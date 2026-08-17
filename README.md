# TxxT-
TxxT Add-on
# TxxT 插件开发示例

这个仓库是 TxxT 插件系统 v1 的最小可运行示例。它提供「章节洞察」面板：读取当前作品章节，展示总字数、平均字数和最长章节，并演示面板注册、命令注册与插件设置。

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
