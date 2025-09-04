import path from 'node:path'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { load } from 'js-yaml'
import { detect as detectPM } from 'package-manager-detector'
import { readPackageJSON } from 'pkg-types'
import { useLogger, useTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

export interface MonorepoPackage {
  name: string
  dir: string
  scripts: Record<string, string>
}

function processAndFilterPackages(packages: string[], excludePlayground: boolean): string[] {
  if (!excludePlayground) {
    return packages
  }

  const index = packages.findIndex((item: string) => item.includes('playground'))
  if (index > -1) {
    packages.splice(index, 1)
  }
  return packages
}
async function detectMonorepo(root: string, excludePlayground: boolean): Promise<string[] | false> {
  // 1. pnpm-workspace.yaml
  const pnpmWorkspacePath = path.join(root, 'pnpm-workspace.yaml')
  if (await fs.pathExists(pnpmWorkspacePath)) {
    const content = await fs.readFile(pnpmWorkspacePath, 'utf-8')
    const data = load(content) as any
    if (data?.packages?.length) {
      return processAndFilterPackages(data.packages, excludePlayground)
    }
  }

  // 2. package.json workspaces
  const rootPkg = await readPackageJSON(root)
  if (Array.isArray(rootPkg.workspaces)) {
    return processAndFilterPackages(rootPkg.workspaces, excludePlayground)
  }

  // 3. lerna.json
  const lernaPath = path.join(root, 'lerna.json')
  if (await fs.pathExists(lernaPath)) {
    const lerna = await fs.readJSON(lernaPath)
    if (Array.isArray(lerna.packages)) {
      return processAndFilterPackages(lerna.packages, excludePlayground)
    }
  }

  // 4. fallback 默认 packages/*
  const fallback = path.join(root, 'packages')
  if (await fs.pathExists(fallback))
    return ['packages/*']

  return false
}

export async function getAllPackages(root: string, excludePlayground: boolean): Promise<MonorepoPackage[]> {
  const workspacePatterns = await detectMonorepo(root, excludePlayground)

  if (!workspacePatterns) {
    const pkg = await readPackageJSON(root)
    return [
      {
        name: pkg.name || path.basename(root),
        dir: root,
        scripts: (pkg.scripts || {}) as Record<string, string>,
      },
    ]
  }

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
          scripts: (pkg.scripts || {}) as Record<string, string>,
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
export async function executeScript(dir: string, script: string, message?: string) {
  try {
    const cwd = normalizeCwd(dir)
    const { agent } = await detectPM({
      cwd,
      onUnknown: () => {
        return undefined
      },
    }) || {}
    const terminal = useTerminal({
      name: 'RunX Terminal',
      cwd,
    })
    terminal.show()
    setTimeout(() => {
      terminal.sendText(`${agent} run ${script}`)
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
