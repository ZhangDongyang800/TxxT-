# TxxT 插件市场架构与接入流程

本文说明插件代码的归属、市场索引的职责、仓库改名的影响，以及用户从市场安装插件时发生的完整流程。

## 一、代码与索引分别存在哪里

```text
插件作者仓库                         TxxT 市场索引仓库
├── manifest.json                    └── registry.json
├── dist/index.js                         ├── 插件介绍与作者信息
└── GitHub Release                         ├── 固定版本 Release 下载地址
    └── plugin-x.y.z.zip                   ├── SHA-256
                                             ├── API/最低应用版本
                                             └── 权限声明
```

插件的源代码、构建产物、许可证、Issue 和 Release 都归插件作者仓库管理。市场索引不保存插件代码，也不复制 zip；它只保存经过审核的元数据，帮助客户端发现插件并验证下载资产。

目前 `ZhangDongyang800/TxxT-` 同时承担了“测试插件仓库”和“测试市场索引”两种角色，只适合验证流程。正式上线建议新建独立仓库，例如 `TxxT-plugin-registry`，专门托管 `registry.json`。

## 二、开发者发布与收录

1. 作者在自己的仓库开发插件，完成 `manifest.json` 与 `dist/`。
2. 作者本地通过 TxxT 的「工具 -> 插件」安装目录验证。
3. 作者创建固定版本的 GitHub Release，上传根目录包含 `manifest.json` 和 `dist/` 的 zip。
4. 作者下载该 Release zip，计算 SHA-256。
5. 作者向市场索引仓库提交 PR，新增或更新 `registry.json` 条目。
6. 审核者核对仓库、Release、哈希、权限、API 版本与许可证后合并 PR。
7. 用户下次打开「插件 -> 市场」时，客户端拉取最新索引并展示该插件。

作者仅提交代码仓库或仅创建 Release，不会自动进入市场；市场索引 PR 合并才是“被收录”的动作。

## 三、用户点击安装后的流程

```text
用户点击“安装”
  -> 主进程拉取固定的 registry.json
  -> 校验索引 schema、插件 id、权限、GitHub Release URL
  -> 按 downloadUrl 下载固定版本 zip（30 秒、最大 16 MB）
  -> 计算 zip SHA-256，与索引 sha256 比对
  -> 将 zip 临时写入系统临时目录
  -> 解压至 TxxT 用户数据目录的 staging 目录
  -> 拒绝路径穿越，校验 manifest、入口文件、版本和插件 id
  -> 原子替换为用户级插件目录中的该插件
  -> 默认停用，用户确认权限后手动启用
  -> 启用后仅在 sandbox iframe 中加载入口脚本
```

安装成功后的插件位于 Electron `userData/plugins/<plugin-id>/`，启用状态和插件设置保存在同目录的 `plugins.json`。插件不获得 Node、Electron、文件系统、网络或任意 IPC 访问权；它只能通过宿主 Host API 调用已声明的权限。

## 四、仓库或账户改名的影响

不要依赖 GitHub 的 URL 重定向。改名后应主动更新以下位置：

| 改动对象 | 必须更新的位置 |
| --- | --- |
| 市场索引仓库改名 | TxxT 应用中的 `MARKET_REGISTRY_URL`，然后随应用版本发布 |
| 插件作者仓库改名 | 对应 `registry.json` 条目的 `repository` 和 `downloadUrl` |
| GitHub 账户改名 | 所有索引条目的 GitHub URL，以及市场索引 URL |
| 插件 id 改名 | 视为新插件；原 id 的用户安装和设置不会自动迁移 |

插件 Release 的 zip 内容和 SHA-256 不会因为仓库改名本身改变，但下载 URL 可能失效或跳转。应先完成新的 Release URL 验证和索引 PR 合并，再进行旧仓库清理。

## 五、正式市场建议

1. 创建独立、长期稳定的官方索引仓库，避免与任意单个插件仓库耦合。
2. 为索引仓库启用分支保护和 PR 审核。
3. 每条索引记录固定具体 Release 版本和 SHA-256，不使用 `main`、`latest` 或浮动下载链接。
4. 后续引入索引签名：将公钥内置到 TxxT，发布时签名 `registry.json`，降低索引仓库被篡改后的供应链风险。
5. 市场规模扩大后，再增加分类、搜索、兼容性过滤、更新提示和插件下架机制。
