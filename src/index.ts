import type vscode from 'vscode'
import {
  defineConfigs,
  defineExtension,
  ref,
  useCommand,
  useStatusBarItem,
  useWorkspaceFolders,
} from 'reactive-vscode'
import { QuickPickItemKind, window } from 'vscode'
import { executeScript, getAllPackages } from './utils'

const { activate, deactivate } = defineExtension(async () => {
  const configs = defineConfigs('RunX', {
    autoStart: true,
    iconLocation: 'left' as 'left' | 'right',
    command: '',
    excludePlayground: true,
  })
  const items = ref<vscode.QuickPickItem[]>([])
  const preferredScripts = ['dev', 'start', 'serve', 'vite']

  const item = useStatusBarItem({
    text: '$(gitlens-rocket-filled) Start',
    alignment: configs.iconLocation.value === 'left' ? 1 : 2,
    priority: configs.iconLocation.value === 'left' ? Number.MAX_VALUE : -Number.MIN_VALUE,
    tooltip: 'Quick Start Project',
    command: 'myExtension.startProject',
    color: '#4CAF50',
  })

  useCommand('myExtension.startProject', async () => {
    const root = useWorkspaceFolders()
    if (!root.value) {
      window.showErrorMessage(`Please open the project`)
      return
    }
    const packages = await getAllPackages(root.value[0].uri.fsPath, configs.excludePlayground.value)
    items.value = []
    if (packages.length === 1) {
      const pkg = packages[0]
      const scripts = Object.keys(pkg.scripts)
      if (configs.autoStart.value) {
        if (configs.command.value && scripts.includes(configs.command.value)) {
          executeScript(pkg.dir, configs.command.value, `Command started: ${configs.command.value}`)
          return
        }

        const found = preferredScripts.find(cmd => scripts.includes(cmd))
        if (found) {
          executeScript(pkg.dir, found, `Automatically started script: ${found}`)
          return
        }
      }

      scripts.forEach((script) => {
        items.value.push({
          label: `$(terminal-cmd)  ${script}`,
          description: `${pkg.scripts[script]}`,
          detail: ` ${pkg.dir}`,
        })
      })
    }
    else {
      for (const pkg of packages) {
        items.value.push({
          kind: QuickPickItemKind.Separator,
          label: `${pkg.name}`,
          alwaysShow: true,
        })

        const scripts = Object.keys(pkg.scripts)

        if (configs.command.value) {
          if (scripts.includes(configs.command.value)) {
            items.value.push({
              label: ` $(terminal-cmd)  ${configs.command.value}`,
              description: `${pkg.scripts[configs.command.value]}`,
              detail: ` ${pkg.dir}`,
            })
            continue
          }
        }
        else {
          scripts.forEach((script) => {
            items.value.push({
              label: ` $(terminal-cmd)  ${script}`,
              description: `${pkg.scripts[script]}`,
              detail: ` ${pkg.dir}`,
            })
          })
        }
      }
    }
    const selected = await window.showQuickPick(items.value, {
      placeHolder: 'Select the package script to be executed',
      matchOnDescription: true,
      matchOnDetail: true,
    })
    if (!selected)
      return

    const path = selected.detail
    const script = selected.label.trim().replace('$(terminal-cmd)', '').trim()
    path && script && executeScript(path, script)
  })

  item.show()
})
export { activate, deactivate }
