import type { ExtensionContext } from 'vscode'
import { exec, execFile, spawn } from 'node:child_process'
import path, { join } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import fg from 'fast-glob'
import fs, { existsSync } from 'fs-extra'
import { load } from 'js-yaml'
import { readPackageJSON } from 'pkg-types'
import { useLogger, useTerminal } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

export interface MonorepoPackage {
  name: string
  dir: string
  scripts: Record<string, string>
}
const execAsync = promisify(exec)

// const execFileAsync = promisify(execFile)

async function detectMonorepo(root: string): Promise<string[] | false> {
  // 1. pnpm-workspace.yaml
  const pnpmWorkspacePath = path.join(root, 'pnpm-workspace.yaml')
  if (await fs.pathExists(pnpmWorkspacePath)) {
    const content = await fs.readFile(pnpmWorkspacePath, 'utf-8')
    const data = load(content) as any
    if (data?.packages?.length) {
      return data.packages
    }
  }

  // 2. package.json workspaces
  const rootPkg = await readPackageJSON(root)
  if (Array.isArray(rootPkg.workspaces))
    return rootPkg.workspaces
  if (
    typeof rootPkg.workspaces === 'object'
    && rootPkg.workspaces !== null
    && 'packages' in rootPkg.workspaces
  ) {
    const packages = (rootPkg.workspaces as { packages: unknown }).packages
    if (Array.isArray(packages)) {
      return packages
    }
  }

  // 3. lerna.json
  const lernaPath = path.join(root, 'lerna.json')
  if (await fs.pathExists(lernaPath)) {
    const lerna = await fs.readJSON(lernaPath)
    if (Array.isArray(lerna.packages))
      return lerna.packages
  }

  // 4. fallback 默认 packages/*
  const fallback = path.join(root, 'packages')
  if (await fs.pathExists(fallback))
    return ['packages/*']

  return false
}

export async function getAllPackages(root: string): Promise<MonorepoPackage[]> {
  const workspacePatterns = await detectMonorepo(root)

  if (!workspacePatterns) {
    // 单包
    const pkg = await readPackageJSON(root)
    return [
      {
        name: pkg.name || path.basename(root),
        dir: root,
        scripts: pkg.scripts || {},
      },
    ]
  }

  // 多包
  const dirs = await fg(workspacePatterns, {
    cwd: root,
    onlyDirectories: true,
    absolute: true,
  })

  const results: MonorepoPackage[] = []
  for (const dir of dirs) {
    const pkgPath = path.join(dir, 'package.json')
    if (await fs.pathExists(pkgPath)) {
      const pkg = await readPackageJSON(dir)
      if (!pkg.exports && pkg.scripts) {
        results.push({
          name: pkg.name || path.basename(dir),
          dir,
          scripts: pkg.scripts || {},
        })
      }
    }
  }

  return results
}
function normalizeCwd(p: string) {
  let fixed = p.trim().replace(/\\/g, '/')
  fixed = fixed.replace(/^([a-z]):/, item => `${item.toUpperCase()}`)
  return fixed
}
export function executeScript(dir: string, script: string, message?: string) {
  try {
    const terminal = useTerminal({
      name: 'RunX Terminal',
      cwd: normalizeCwd(dir),
    })
    terminal.show()
    setTimeout(() => {
      terminal.sendText(`nr ${script}`)
    }, 10)

    message && window.showInformationMessage(message)
    return {
      terminal,
    }
  }
  catch (error) {
    logger.error('executeScript error:', error)
  }
}

export async function hasNi(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`npm list -g @antfu/ni`, {
      env: process.env,
      timeout: 3000,
    })
    const packageMap: Record<string, string> = {}
    const lines = stdout.trim().split('\n')
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      const match = line.match(/^[+`]-{2,}\s+(@?[^@\s]+)@(\S+)$/)
      if (match) {
        const packageName = match[1]
        const version = match[2]
        packageMap[packageName] = version
      }
    }
    if (Object.keys(packageMap).includes('@antfu/ni'))
      return true
    return false
  }
  catch (error) {
    logger.error('na command not found in PATH', error)
    return false
  }
}

export async function init() {
  logger.info('ni not found, installing...')
  await window.withProgress({
    location: ProgressLocation.Notification,
    title: `Installing @antfu/ni...`,
    cancellable: false,
  }, async (progress) => {
    progress.report({ increment: 0 })
    logger.info(`Installing @antfu/ni...`)

    try {
      const { stderr } = await execAsync(`npm install -g @antfu/ni`, {
        env: process.env,
      })
      if (stderr) {
        logger.warn('Installation stderr:', stderr)
      }
      progress.report({ increment: 100 })

      logger.info(`@antfu/ni installed successfully`)
      window.showInformationMessage(`@antfu/ni installed successfully`)
    }
    catch (error) {
      logger.error(`Failed to install @antfu/ni:`, error)
      throw error
    }
  })
}
