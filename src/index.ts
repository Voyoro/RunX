import type vscode from 'vscode'
import type { ExtensionContext } from 'vscode'
import process from 'node:process'
import {
  defineConfigs,
  defineExtension,
  ref,
  useCommand,
  useStatusBarItem,
  useTerminal,
  useWorkspaceFolders,
} from 'reactive-vscode'
import { QuickPickItemKind, window } from 'vscode'
import { executeScript, getAllPackages, hasNi, init } from './utils'

const { activate, deactivate } = defineExtension(async () => {
  const configs = defineConfigs('RunX', {
    autoStart: true,
    iconLocation: 'left' as 'left' | 'right',
    command: '',
  })
  const ni = ref<boolean>(await hasNi())
  const items = ref<vscode.QuickPickItem[]>([])
  const preferredScripts = ['dev', 'start', 'serve']

  // 创建状态栏按钮
  const item = useStatusBarItem({
    text: '$(gitlens-rocket-filled) 启动',
    alignment: configs.iconLocation.value === 'left' ? 1 : 2,
    priority: configs.iconLocation.value === 'left' ? Number.MAX_VALUE : -Number.MIN_VALUE,
    tooltip: '一键启动项目',
    command: 'myExtension.startProject',
    color: '#4CAF50',
  })

  useCommand('myExtension.startProject', async () => {
    const root = useWorkspaceFolders()
    if (!root.value) {
      window.showErrorMessage(`请打开项目`)
      return
    }
    if (!ni.value) {
      await init()
    }
    const packages = await getAllPackages(root.value[0].uri.fsPath)
    items.value = []
    // -------------------- 单包逻辑 --------------------
    if (packages.length === 1) {
      const pkg = packages[0]
      const scripts = Object.keys(pkg.scripts)
      if (configs.autoStart.value) {
        // 优先处理 command 配置
        if (configs.command.value && scripts.includes(configs.command.value)) {
          executeScript(pkg.dir, configs.command.value, `已启动命令: ${configs.command.value}`)
          return
        }

        // 回退到自动选择 preferred script
        const found = preferredScripts.find(cmd => scripts.includes(cmd))
        if (found) {
          executeScript(pkg.dir, found, `已自动启动脚本: ${found}`)
          return
        }
      }

      // 走下拉选择逻辑
      scripts.forEach((script) => {
        items.value.push({
          label: `$(terminal-cmd)  ${script}`,
          description: `${pkg.scripts[script]}`,
          detail: ` ${pkg.dir}`,
        })
      })
    }
    // -------------------- monorepo 多包逻辑 --------------------
    else {
      for (const pkg of packages) {
        items.value.push({
          kind: QuickPickItemKind.Separator,
          label: `${pkg.name}`,
          alwaysShow: true,
        })

        const scripts = Object.keys(pkg.scripts)

        if (configs.command.value) {
          // 优先展示 command 对应的
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
          // 默认情况：展示所有
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

    // -------------------- 下拉框选择 --------------------
    const selected = await window.showQuickPick(items.value, {
      placeHolder: '选择要执行的 package 脚本',
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
