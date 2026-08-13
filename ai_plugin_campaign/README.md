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

点击“确认登录”后，页面先通过 V8 AES-CBC 协议调用
`POST https://user.zbrowser.cn/v8/ai/edu/add`；只有接口返回 `code=0, flag=0` 后，才会保存学生资料并触发 ZERO 账号登录。学生资料及任务进度保存在以下 `localStorage` 键：

- `zero.ai-plugin-campaign.session.v1`
- `zero.ai-plugin-campaign.users.v1`

接口配置参考 `.env.example`：

- `VITE_AI_EDU_API_MODE=production|mock`；
- `VITE_AI_EDU_ADD_URL`；
- `VITE_V8_PROTOCOL_KEY`；
- `VITE_V8_PROTOCOL_IV`。

密钥和 IV 默认按 UTF-8 读取，也支持 `hex:`、`base64:`、`utf8:` 前缀。正式构建前必须填入当前环境的 `protocol.key` 和 `protocol.iv`；本地只验证 UI 时可使用 `mock` 模式。学生占用和设备占用均以服务端 `code/flag` 为准。

## ZERO 浏览器能力

环境检测逻辑保留在：

- `src/services/browserEnvironment.ts`；
- `src/state/BrowserEnvironmentContext.tsx`；
- `src/components/ZeroBrowserGate.tsx`。

最低支持版本为 `2.0.1322.0`。当前默认关闭 `ZeroBrowserGate`；需要恢复浏览器门禁弹窗时，设置 `VITE_ZERO_BROWSER_GATE=on`。

ZERO 原生业务动作集中在 `src/services/zeroCampaignBridge.ts`。页面会派发以下集成事件，浏览器侧可按正式协议接入：

- `zero-campaign:action`
- `zero-campaign:request-account-login`

浏览器侧完成首次 AI 对话时应向页面派发 `zero-campaign:first-ai-interaction`；搜索、换肤、PDF、网盘完成时派发 `zero-campaign:experience-completed`，并在 `detail.action` 中传入 `search | skin | pdf | drive`。

课程、网盘、皮肤、PDF、插件生成页及赛事时间均可通过 `VITE_*` 环境变量配置，默认值位于 `src/data/activity.ts`。

上传按钮使用两个北京时间自然日字段控制：

- `competitionConfig.uploadDeadline` / `VITE_UPLOAD_DEADLINE`：该日期当天及以前点击“上传作品”进入 `https://www.zbrowser.cn/PluginHub/`；
- `competitionConfig.initialReviewDeadline` / `VITE_INITIAL_REVIEW_DEADLINE`：上传截止日之后至该日期当天，点击按钮显示“活动已结束！初审中”；该日期之后按钮变为“作品展示”。
