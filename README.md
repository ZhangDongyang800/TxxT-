# TxxT 插件开发示例

这个仓库是 TxxT 插件系统 v1 的最小可运行示例。它提供「章节洞察」面板：读取当前作品章节，展示总字数、平均字数和最长章节，并演示面板注册、命令注册与插件设置。

## 发布测试插件

`v*` 标签会触发 GitHub Actions：校验标签与 `manifest.json` 版本一致，生成根目录正确的 zip 和 `SHA256SUMS.txt`，并创建 GitHub Release。

本地验证发布包：

```powershell
.\scripts\package.ps1
```

示例版本 `1.0.0` 的发布命令：

```powershell
git tag v1.0.0
git push origin v1.0.0
```

## 测试市场索引

[`marketplace/registry.json`](marketplace/registry.json) 是 TxxT 市场接入测试使用的静态索引。客户端通过 GitHub Raw 读取它，再下载固定版本的 GitHub Release 资产并校验 `sha256`；不会从分支源码或任意仓库地址直接安装。

完整的代码归属、安装校验、仓库改名影响和正式市场建议见：[插件市场架构与接入流程](docs/marketplace-architecture.md)。

## 从开发到市场收录

```text
编写插件 -> 本地安装验证 -> 创建 GitHub Release -> 计算 Release SHA-256
  -> 提交市场索引 PR -> 审核通过 -> TxxT 市场展示与安装
```

### 1. 本地开发

按本文的包结构编写 `manifest.json` 与入口脚本。打开 TxxT 的「工具 -> 插件」，选择插件目录安装；安装后需要在「已安装」页启用插件。每次修改入口代码后，停用再启用即可重新加载。

### 2. 发布 GitHub Release

每个可安装版本必须使用不可变的 GitHub Release 资产，而不是 `main` 分支源码。更新 `manifest.json` 的版本后推送同名标签，例如 `manifest.version` 为 `1.2.0` 时创建 `v1.2.0`。本仓库的 Actions 会自动生成 zip 与 `SHA256SUMS.txt`。

### 3. 填写市场索引

市场索引是 `schemaVersion: 1` 的 JSON 文件，`plugins` 中每一项都需要以下字段：

```json
{
  "id": "author.plugin-id",
  "name": "插件名称",
  "description": "一句话说明插件解决的问题。",
  "author": "GitHub 用户名或组织名",
  "tags": ["分类", "用途"],
  "highlights": ["能力一", "能力二"],
  "updatedAt": "2026-08-17",
  "version": "1.2.0",
  "repository": "https://github.com/owner/repo",
  "downloadUrl": "https://github.com/owner/repo/releases/download/v1.2.0/plugin-1.2.0.zip",
  "sha256": "Release zip 的 64 位小写 SHA-256",
  "apiVersion": 1,
  "minAppVersion": "1.2.3",
  "permissions": ["novel.read", "ui.panel"]
}
```

`id`、`version`、`apiVersion` 和 `permissions` 必须与最终 zip 中的 `manifest.json` 一致。`downloadUrl` 必须指向 GitHub Release 下载地址。发布者应先下载 Release 资产并计算 SHA-256，再提交索引 PR；TxxT 安装时会再次计算哈希，任何不匹配都会被拒绝。

### 4. 提交收录申请

向官方市场索引仓库提交 PR，附上插件仓库、Release 链接、许可证、变更说明和权限用途。审核重点是：包结构、哈希、API 版本、权限最小化、错误提示与开源许可证。索引合并后，用户重新打开「插件 -> 市场」即可看到新版本。

## 安装示例

1. 打开 TxxT 顶栏的「工具 -> 插件」。
2. 点击安装按钮，选择本仓库目录，或选择按下文规则生成的 zip 包。
3. 查看声明权限后启用「章节洞察」。
4. 在插件列表中点击「章节洞察」打开面板。

插件运行在没有 Node、Electron、网络和文件系统权限的 sandboxed iframe 中。它只能调用宿主显式提供且已在 `manifest.json` 声明权限的 API。

## 插件包结构

```text
your-plugin/
├── manifest.json
├── dist/
│   └── index.js
└── assets/                 # 可选，只允许包内静态资源
```

zip 包的根目录必须直接包含 `manifest.json`，不要再包一层仓库目录。

## manifest.json

```json
{
  "id": "your-name.plugin-id",
  "name": "插件名称",
  "version": "1.0.0",
  "apiVersion": 1,
  "entry": "dist/index.js",
  "ui": { "panels": [{ "id": "main", "title": "主面板" }] },
  "permissions": ["novel.read", "ui.panel"]
}
```

约束：

- `id` 使用小写字母、数字、点与连字符，且在插件市场中全局唯一。
- `apiVersion` 当前固定为 `1`。
- `entry` 必须是包内的 JavaScript 文件，不能使用绝对路径或 `..`。
- 每个插件可声明 1 至 8 个面板；面板必须同时出现在 manifest 和运行时注册调用中。

当前支持权限：

| 权限 | 能力 |
| --- | --- |
| `novel.read` | 获取当前作品、章节列表和章节纯文本快照 |
| `novel.write` | 通过受控 API 修改指定章节标题或纯文本 |
| `ui.panel` | 注册 manifest 中声明的面板 |
| `command.register` | 注册显示在插件面板标题栏的命令 |

网络、任意文件访问、Node/Electron API、子进程和 AI Provider 扩展暂不开放。

## 运行时 API

入口脚本会得到 `txxt` 参数。它是异步消息 API，不会暴露宿主 DOM、Zustand store 或作品路径。

```js
txxt.ui.registerPanel({ id: 'main' })

txxt.events.on('panel.show', async () => {
  const chapters = await txxt.workspace.listChapters()
  // 在插件自己的 iframe DOM 中渲染
})
```

可调用方法：

```js
await txxt.plugin.getInfo()
await txxt.plugin.getSettings()
await txxt.plugin.setSettings({ compact: true })

await txxt.workspace.getCurrentNovel()
await txxt.workspace.listChapters()
await txxt.workspace.readChapter(chapterId)
await txxt.workspace.updateChapter(chapterId, { title, contentText })

await txxt.commands.register({ id: 'refresh', title: '刷新' })
await txxt.ui.registerPanel({ id: 'main' })
await txxt.ui.notify('处理完成')
txxt.events.on('command.execute', ({ id }) => {})
txxt.events.on('panel.show', ({ panelId }) => {})
```

没有声明对应权限时，调用会被宿主拒绝。单次消息最大 128KB；插件应避免把完整大书稿一次性传入内存。

## 本地开发与发布

本示例无需 npm 安装。修改 `dist/index.js` 后，在 TxxT 中停用再启用插件即可重新加载。

发布时：

1. 更新 `manifest.json` 的 `version`。
2. 从包根目录创建 zip，确保 zip 内第一层就是 `manifest.json` 与 `dist/`。
3. 创建 GitHub Release，并上传版本化 zip，例如 `chapter-insights-1.0.0.zip`。
4. 向 TxxT 官方插件索引仓库提交 PR，提供仓库地址、Release 下载地址、SHA-256、支持的 API 版本和权限说明。

市场不会从任意 GitHub 仓库自动执行代码。收录插件应提供开源许可证、版本变更说明和可复现的 Release 资产。

## 安全与兼容性

- 不要依赖未文档化的 TxxT 内部实现。
- 读取章节返回的是纯文本快照；修改通过 `contentText` 提交，富文本扩展不属于 v1 API。
- 增加权限、修改数据行为或发布破坏性更新时，应提高主版本并在 Release 中说明。
- 插件错误会显示在插件自身区域；请捕获异步异常并将可理解的信息展示给用户。
