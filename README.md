# 🚀 RunX - 前端项目一键启动神器

> 告别繁琐的命令行操作，让前端开发如丝般顺滑！

![RunX Logo](res/logo.png)

## ✨ 为什么选择 RunX？

还在为每次启动项目时需要记住各种命令而烦恼吗？
- `npm run dev`
- `yarn start`
- `pnpm serve`
- `nx serve myapp`

**RunX** 来拯救你！只需一键点击，智能识别你的项目类型，自动选择最佳启动命令。

## 🎯 核心特性

### 🧠 智能识别
RunX 会自动检测你的项目结构：
- **单体项目**：直接启动最常用的开发服务器
- **Monorepo**：列出所有子包，让你轻松选择
- **多种包管理器**：支持 npm、yarn、pnpm 等

### ⚡ 一键启动
点击状态栏的火箭图标 🚀启动，即可：或点击项目中任意文件会在右上角出现🚀也可直接启动
1. 自动检测项目类型
2. 智能选择启动命令
3. 在集成终端中执行
4. 实时显示启动状态

### 🎨 优雅的用户界面

#### 状态栏集成
![状态栏显示](./res/image.png)

#### 编辑栏继承
![编辑栏继承](./res/editor.png)

在 VSCode 状态栏中显示醒目的启动按钮，支持左右位置自定义。

当有多个启动选项时，会弹出优雅的选择面板，显示：
- 📂 项目名称
- ⚡ 脚本命令
- 📝 脚本描述
- 📍 项目路径

### 🔧 灵活配置

```json
{
  "RunX.autoStart": true,
  "RunX.iconLocation": "left",
  "RunX.command": "dev"
}
```

- **自动启动**：单项目时直接执行，无需选择
- **图标位置**：状态栏左侧或右侧显示
- **默认命令**：指定统一的启动命令

## 🏗️ 支持的项目类型

### 📦 单体项目
适用于传统的前端项目：
```
my-project/
├── package.json
├── src/
└── ...
```

### 🏢 Monorepo 项目
完美支持现代化的 Monorepo 架构：

#### PNPM Workspace
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

#### NPM/Yarn Workspaces
```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

#### Lerna 项目
```json
{
  "packages": [
    "packages/*"
  ]
}
```

## 🚀 快速开始

### 安装
1. 在 VSCode 扩展市场搜索 "RunX"
2. 点击安装
3. 重启 VSCode

### 首次使用
1. 打开任意前端项目
2. 观察状态栏出现 🚀 启动按钮
3. 点击按钮，享受一键启动的快感！
![启动图片](./res/image.png)

## ⚠️ 重要注意事项

### 依赖环境
RunX 依赖于 `@antfu/ni` 这个优秀的包管理器统一工具来执行项目启动命令。

#### 自动安装
- 🔄 **首次使用时**，如果系统中未安装 `@antfu/ni`，RunX 会自动为您安装
- ⏳ **安装过程**会显示进度通知，请耐心等待
- ✅ **安装完成**后会显示成功提示

#### 手动安装（推荐）
如果您遇到自动安装失败，请手动全局安装：

```bash
# 使用 npm
npm install -g @antfu/ni

# 使用 yarn
yarn global add @antfu/ni

# 使用 pnpm
pnpm add -g @antfu/ni
```

#### 常见问题排查

**🚫 启动失败？**
- 检查是否已安装 `@antfu/ni`
- 确认网络连接正常
- 尝试手动安装依赖

**⚡ 权限问题？**
- Windows：以管理员身份运行终端
- macOS/Linux：使用 `sudo` 安装或配置 npm 全局目录

**🔍 验证安装**
在终端中运行以下命令验证安装：
```bash
ni --version
```
如果显示版本号，说明安装成功！
## ⚙️ 高级配置

### 自定义启动命令
如果你的项目使用通用的启动命令(dev,server...)或者命令通用了前缀(dev:file,dev:fed....)：

```json
{
  "RunX.command": "start:dev"
}
```

### 调整图标位置
让启动按钮出现在你习惯的位置：

```json
{
  "RunX.iconLocation": "right"
}
```

### 关闭自动启动
如果你更喜欢手动选择：

```json
{
  "RunX.autoStart": false
}
```

## 🔮 未来规划

- [ ] 支持更多框架和构建工具
- [ ] 添加项目模板快速创建功能
- [ ] 增加独立项目快捷启动
- [ ] 支持自定义启动脚本模板
- [ ] 添加项目性能监控

## 🤝 参与贡献

我们欢迎任何形式的贡献！

- 🐛 **报告 Bug**：在 GitHub Issues 中提交
- 💡 **功能建议**：分享你的想法
- 🔧 **代码贡献**：提交 Pull Request
- 📖 **文档改进**：帮助完善文档

## 📄 许可证

MIT License - 详见 [LICENSE.md](LICENSE.md)

## 💖 致谢

感谢以下开源项目的支持：
- [reactive-vscode](https://github.com/antfu/reactive-vscode) - 响应式 VSCode 扩展开发框架
- [@antfu/ni](https://github.com/antfu/ni) - 包管理器统一工具

---

<div align="center">

**让前端开发更简单，让启动项目更快捷！**

[⭐ Star on GitHub](https://github.com/Voyoro/RunX.git) | [🐛 Report Issues](https://github.com/Voyoro/RunX.git/issues) | [💬 Discussions](https://github.com/Voyoro/RunX.git/discussions)

Made with ❤️ by [Voyoro](https://github.com/Voyoro)

</div>
