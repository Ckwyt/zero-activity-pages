# ZERO AI 活动项目

React、TypeScript 与 Vite 活动页工程。

当前已按照 Figma `mVk2zagIUR5SFrXQByuvTH` 实现活动页面：

- 普惠学习体验赛道与 AI 插件创意作品征集赛道；
- 学生登录、重复信息校验及本地持久化；
- 北京时间自然日任务解锁、证书生成状态；
- 可配置赛事日期、初审/展示/获奖状态；
- ZERO 浏览器检测、最低版本和原生能力适配层；
- 桌面、平板和移动端响应式布局。

## 本地运行

```bash
npm install
npm run dev
```

默认地址：`http://127.0.0.1:4175/`。

## 测试与打包

```bash
npm test
npm run build
```

生产入口：`dist/ai-plugin-campaign.html`。

## GitHub Pages 对外静态预览

项目已提供 GitHub Pages 专用构建和自动发布工作流。静态预览不会检测 ZERO
浏览器，不会读取或写入学生本地数据，也不会请求学生、学习进度或作品列表接口；
作品列表使用仓库内置演示数据，因此适合直接分享给公司外部人员。

将仓库推送到 GitHub 后，在仓库的 **Settings → Pages → Build and deployment**
中把 Source 设为 **GitHub Actions**。推送 `master` 或 `main` 分支后，
`.github/workflows/deploy-ai-plugin-campaign-pages.yml` 会自动测试、构建和发布。

站点基础地址格式为：

```text
https://<GitHub 用户名或组织名>.github.io/<仓库名>/
```

分享时在基础地址后追加 `#/?preview=...`：

| 页面效果 | URL 参数 |
| --- | --- |
| 学习赛道（未解锁） | `#/?preview=learning-locked` |
| 学习赛道（全部解锁） | `#/?preview=learning-unlocked` |
| 赛事未开始 | `#/?preview=competition-before` |
| 作品征集期 | `#/?preview=competition-submission` |
| 作品初审中 | `#/?preview=competition-review` |
| 初审作品展示 | `#/?preview=competition-showcase` |
| 获奖作品展示 | `#/?preview=competition-awards` |
| 活动登录弹窗 | `#/?preview=login` |
| 活动规则弹窗 | `#/?preview=rules` |
| 投稿结束弹窗 | `#/?preview=submission-ended` |
| 学习证明弹窗 | `#/?preview=certificate` |
| 非 ZERO 浏览器提示 | `#/?preview=browser-gate` |

例如仓库地址是 `https://github.com/acme/zero-activity-pages`，则“获奖作品展示”
的完整分享链接为：

```text
https://acme.github.io/zero-activity-pages/#/?preview=competition-awards
```

本地验证 GitHub Pages 产物：

```bash
npm run build:github
npm run preview -- --host 127.0.0.1
```

然后访问 `http://127.0.0.1:4175/#/?preview=learning-unlocked`。

## 构建并发布到 ZERO CDN

参考 ZERO 扩展中心项目的上传方式，在已安装并登录 `qupload` 的环境中执行：

```bash
npm run build:deploy
```

该命令会依次完成在线构建、图片资源兼容处理、清空旧 `output/`、通过
`qupload --inline-css --host-zero ./dist/` 上传资源，并校验 CDN JavaScript 中不存在本地图片路径或相对 JS 分包。
成功后入口文件为 `output/ai-plugin-campaign.html`。

## 页面入口

- `/`：活动主页面；
- `/register`：兼容入口，自动跳转活动主页并打开学生登录弹窗。

作品赛道状态默认根据赛事时间自动计算。需要手动预览时，可使用 `stage` URL 参数：

- `/?stage=before`：赛事未开始；
- `/?stage=submission`：作品征集期；
- `/?stage=initial-review`：作品初审中；
- `/?stage=showcase`：初审作品展示，无安装按钮；
- `/?stage=awards`：获奖作品公示，显示安装按钮。

指定 `stage` 后会自动切换至作品赛道；`showcase` 和 `awards` 在学生登录后会自动定位到作品列表。移除 `stage` 参数即可恢复按真实赛事日期判断。

学习赛道联调时，可使用 `/?learningPreview=all` 临时解锁“去保存”、三个进阶体验、“去学习并总结”和“领取学习证明”按钮。该参数只覆盖当前页面的按钮展示，不会修改本地进度，也不会伪造或上报服务端 `t1/t6`；移除参数后立即恢复真实接口状态。

点击“确认登录”后，页面通过 V1 明文免登录协议调用
`POST https://user.zbrowser.cn/v1/ai/edu/add`，将学生信息 JSON 字符串写入表单字段 `jb`。只有接口返回 `code=0, flag=0` 后，才会保存学生资料并触发 ZERO 账号登录。学生资料及任务进度保存在以下 `localStorage` 键：

- `zero.ai-plugin-campaign.session.v1`
- `zero.ai-plugin-campaign.users.v1`

以上两个键使用由当前设备 ID 派生的 AES-256-GCM 密钥加密保存，每次写入使用随机 IV。旧版明文会话和学生列表会在页面首次初始化时自动迁移为密文；认证标签校验失败时不会使用被篡改的数据。

接口配置参考 `.env.example`：

- `VITE_AI_EDU_API_MODE=production|mock`；
- `VITE_AI_EDU_ADD_URL`。
- `VITE_AI_EDU_HAS_BIND_URL`。
- `VITE_AI_EDU_DONE_URL`。
- `VITE_BOUND_STUDENT_NAME_URL`。
- `VITE_AI_PRODUCTS_URL`。

V1 接口不经过 AES/Base64，也不依赖 `chrome.account360` 或 `window.external.AppCmd` 加密能力。项目在本地开发和正式构建中均默认使用 `production` 模式：只有接口明确返回 `code=0, flag=0` 后才写入本地存储；接口失败、业务占用或响应格式异常时都不会保存。纯 UI 联调需要跳过接口时，才可临时将 `VITE_AI_EDU_API_MODE` 显式设为 `mock`。学生占用和设备占用仍以正式服务端 `code/flag` 为准。

读取到本地学生资料后，页面会调用 `POST /v1/ai/edu/has-bind` 同步服务端任务时间：`t1` 的次日解锁第 2–7 天体验任务，`t1` 所在自然日后的第 7 天解锁第 8 天总结任务，`t6` 存在时解锁证书领取。用户重新聚焦或返回活动页面时会自动刷新该状态。

点击“领取学习证明”或“查看学习证明”时，页面会使用当前 ZERO 登录 Cookie
调用 `POST https://user.zbrowser.cn/v7/user/aip-un`，不发送请求 Body，优先使用
`data.userName` 生成证书。接口未登录、未绑定、返回异常、网络失败或超过 5 秒未响应时，
自动回退到当前本地活动资料中的姓名，保证证书功能仍可使用。静态预览模式不会调用该接口。

证书弹窗成功打开后，页面还会通过 V1 明文免登录协议调用
`POST https://user.zbrowser.cn/v1/ai/edu/done`，以当前学生完整资料、MID 和
`key=certificate_claim` 上报证书领取普通任务。该请求不受课程七日门槛影响；首次写入时
`data.done=true`，重复上报时为 `false`。任务上报失败不会阻断证书查看和下载，静态预览模式不会上报。

作品展示页通过 `GET https://cloud.zbrowser.cn/v1/ai/products` 获取真实审核结果。初审作品展示使用 `kind=2`，获奖作品公示使用 `kind=4`；分页、学校精确筛选和作品名称/姓名/学校关键词搜索均由服务端处理。
本地 `npm run dev` 使用 `/api/ai-products` Vite 代理访问同一正式接口，以规避接口仅允许正式站点域名的浏览器 CORS 限制；正式构建仍直接请求 `cloud.zbrowser.cn`。

## ZERO 浏览器能力

环境检测逻辑保留在：

- `src/services/browserEnvironment.ts`；
- `src/state/BrowserEnvironmentContext.tsx`；
- `src/components/ZeroBrowserGate.tsx`。

最低支持版本为 `2.0.1322.0`。`ZeroBrowserGate` 默认开启：普通浏览器会展示 ZERO 下载弹窗，低版本 ZERO 会展示更新提示。URL 参数优先于环境变量：开发地址使用 `/?zeroGate=off` 临时关闭、`/?zeroGate=on` 开启；正式 Hash 路由地址使用 `#/?zeroGate=off` 或 `#/?zeroGate=on`。删除参数后恢复 `VITE_ZERO_BROWSER_GATE` 配置及默认行为。

多个 URL 参数使用 `&` 连接，例如 `/?zeroGate=off&learningPreview=all` 或 `/?stage=initial-review&zeroGate=off`。页面兼容误写的多个 `?`；同名参数重复时使用最后一个有效值，但建议每个参数只保留一次，避免阶段含义冲突。

ZERO 原生业务动作集中在 `src/services/zeroCampaignBridge.ts`。页面会派发以下集成事件，浏览器侧可按正式协议接入：

- `zero-campaign:action`
- `zero-campaign:request-account-login`

账号状态可通过 `getZeroAccountLoginStatus()` 主动查询，返回 `logged-in | logged-out | unavailable`；其中 `unavailable` 表示当前网页无法访问 ZERO 的 `chrome.account360.getAccount` 能力，不能等同于未登录。客户端通过 `loginStatusUpdate(QT)` 主动通知状态变化时，可使用 `isZeroAccountQtLoggedIn(QT)` 判断 QT 是否有效。

浏览器侧完成首次 AI 对话时应向页面派发 `zero-campaign:first-ai-interaction`；搜索、换肤、PDF、网盘完成时派发 `zero-campaign:experience-completed`，并在 `detail.action` 中传入 `search | skin | pdf | drive`。

课程、网盘、皮肤、PDF、插件生成页及赛事时间均可通过 `VITE_*` 环境变量配置，默认值位于 `src/data/activity.ts`。

上传按钮使用两个北京时间自然日字段控制：

- `competitionConfig.uploadDeadline` / `VITE_UPLOAD_DEADLINE`：该日期当天及以前点击“上传作品”进入 `https://www.zbrowser.cn/PluginHub/`；
- `competitionConfig.initialReviewDeadline` / `VITE_INITIAL_REVIEW_DEADLINE`：上传截止日之后至该日期当天，点击按钮显示“活动已结束！初审中”；该日期之后按钮变为“作品展示”。
