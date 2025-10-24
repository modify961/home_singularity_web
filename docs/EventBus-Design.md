# 事件总线与抽屉式插件集成设计

本文档描述本项目的前端数据通信总线（Event Bus）设计与落地方案，满足以下目标：

- 任意组件可通过总线向其他组件发送消息（互通标签、指令、业务数据）。
- 组件可选择性接收消息（不订阅即不接收）。
- 通过消息激活（打开/关闭）插件：如 `AidenOntology` 接到 AI 的组件调用指令后，通知 `PortalPlugin` 在右侧抽屉中用 `PluginWrapper` 打开插件；插件也可通过总线向 `AidenOntology` 发送消息。

## 总体架构

- 在 `src/utils/bus.js` 实现一个轻量事件总线（发布/订阅 + 可选请求/响应）。
- 在 `src/utils/BusProvider.js` 提供 React Context、`useBus()` 和 `useSubscribe()`，把总线注入到任意组件。
- 在应用入口用 `<BusProvider>` 包裹应用。
- 在 `PortalPlugin` 中集成右侧 `Drawer`，订阅 `plugin/open` 指令，在抽屉中用 `PluginWrapper` 打开目标插件，并统一把插件内部事件转换为总线消息。
- 在 `AidenOntology` 中订阅 `aiden/tags.add`，把收到的标签注入输入区域；在解析到 AI 返回的组件调用指令后，发布 `plugin/open` 消息。
- 在 `GoldInfoPlug` 中给“插件区块”添加点击事件，点击后通过总线发布 `plugin/open`，在抽屉中打开 `gold/GoldSnapshot` 插件。

## 消息模型（统一“信封”）

```
{
  id: string,                       // 总线生成
  type: string,                     // 事件类型，如 aiden/tags.add、plugin/open
  source?: { component: string, instanceId?: string },
  target?: { component?: string, broadcast?: boolean },
  payload?: any,                    // 业务负载
  tags?: Array<{ title: string, content?: string, isClose?: boolean }>,
  meta?: { correlationId?: string, replyTo?: string, isReply?: boolean, timestamp?: number }
}
```

约定：

- 事件类型使用命名空间：`aiden/*`、`plugin/*`、`ai/*`、`bus/*`。
- 请求/响应通过 `meta.correlationId` 关联；响应事件可在 `type` 末尾加 `/reply` 或设置 `meta.isReply=true`。

## 核心 API

- `bus.publish(message)`：发布消息。
- `bus.subscribe(handler, selector) => unsubscribe`：添加订阅，`selector` 可按 `type`、`from`、`to`、`filter(evt)` 过滤。
- `bus.request(message, { timeout }) => Promise<reply>`：请求/响应模式（可选）。
- `useBus()`：在函数组件中获取总线实例。
- `useSubscribe(selector, handler)`：组件内订阅，卸载时自动清理。

## 关键事件类型

- `aiden/tags.add`：向 AidenOntology 添加输入标签。
  - `payload: { tags: Tag[] }`
- `aiden/chat.send`：触发 AidenOntology 将文本与标签发送至 AI。
  - `payload: { text: string, tags?: Tag[] }`
- `ai/command`：AidenOntology 将 AI 的组件调用指令解析后对外发布。
  - `payload: { action: 'open_plugin', plugin: string, props?: any, title?: string }`
- `plugin/open`：通知 PortalPlugin 在抽屉中打开插件。
  - `payload: { plugin: string, pluginData?: any, ui?: 'drawer', title?: string }`
- `plugin/close`：通知 PortalPlugin 关闭抽屉或指定插件。
- `plugin/event`：插件内部事件的对外转发。
  - `payload: { event: string, data?: any }`

## 接入点与行为

1) AidenOntology（`src/view/aiden/AidenOntology.js`）

- 订阅 `aiden/tags.add`，将标签注入 `ChatInputPlug`。
- 在流式响应完成后，如果后端响应中包含组件调用指令（示例：`resp.command.action === 'open_plugin'`），则发布 `plugin/open`。

2) PortalPlugin（`src/components/PortalPlugin.js`）

- 保持左侧 `MainPortalPlug` + 右侧 `AidenOntology` 的版式。
- 增加右侧 `Drawer`，订阅 `plugin/open` 打开指定插件，`pluginData` 透传，标题可选显示。
- Drawer 内部使用现有 `PluginWrapper`。插件的 `onPluginEvent` 将统一被包装为 `plugin/event` 对外发布。

3) GoldInfoPlug（`src/view/portal/main/component/GoldInfoPlug.js`）

- 在每个“插件区块”（当前为每个黄金项卡片）增加点击事件，发布：
  `plugin/open { plugin: 'goldsnapshot', pluginData: {...}, ui: 'drawer', title: '金价快照' }`。

## 代码风格

- 注释使用中文，优先易懂，不使用晦涩写法。
- 尽量保持与现有代码风格一致，改造范围最小化。

## 变更清单

- 新增：`src/utils/bus.js`、`src/utils/BusProvider.js`
- 修改：`src/index.js`（挂载 BusProvider）
- 修改：`src/components/PortalPlugin.js`（增加 Drawer + 订阅 plugin/open）
- 修改：`src/view/aiden/AidenOntology.js`（接入总线，接收标签，转发打开命令）
- 修改：`src/view/portal/main/component/GoldInfoPlug.js`（卡片点击 -> 打开 GoldSnapshot）

## 后续扩展

- 可加调试面板订阅最近 N 条事件，便于开发定位。
- 常用消息类型抽为常量文件，统一管理。

