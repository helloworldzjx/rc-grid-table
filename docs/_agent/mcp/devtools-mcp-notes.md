# DevTools MCP 使用笔记

这份文档记录使用 Chrome DevTools MCP 调试页面时踩过的坑和推荐流程。它只关注 MCP 工具本身、浏览器连接、本地 dev server 和复现操作，不记录具体业务问题的判断。

## 适用场景

当问题依赖真实浏览器行为时，优先考虑 DevTools MCP，例如：

- 点击、拖拽、滚动、焦点、键盘输入等交互链路。
- DOM、布局、可访问性树、视口尺寸或样式状态。
- 控制台错误、网络请求、资源加载和页面跳转。
- 需要验证“页面是否真的响应”“元素是否真的可点击”等现象。

如果问题只是纯代码路径或类型问题，先读源码会更快。DevTools MCP 更适合在已有初步假设后做浏览器侧验证。

## 本地服务检查

打开 DevTools MCP 页面前，先确认本地 dev server 真的可访问。

不要为了 MCP 另起第二个 `dumi dev`，尤其是在已有文档站 dev server 正在运行时。dumi 的多个 dev 进程会共用同一个 `.dumi/tmp` 和 `node_modules/.cache`，后启动的进程会重新生成临时文件，前一个进程的 watcher 可能随即重新编译并拿到不一致的临时文件或 webpack 缓存，表现为页面报 `Can't resolve 'dumi'`、终端报默认主题里的 `Module not found`。优先复用现有 dev server 的地址；确实需要换端口时，先停掉旧进程再启动。

在 Windows 上要注意：`npm` 可能解析到 `npm.ps1`，直接用 `Start-Process` 启动可能报 `%1 is not a valid Win32 application`。更稳的方式是显式使用 `npm.cmd`，或通过 `cmd.exe` 启动。

常用检查命令：

```powershell
Test-NetConnection 127.0.0.1 -Port 8001
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8001/path/to/page
Get-NetTCPConnection -LocalPort 8001 -State Listen
```

不要只相信终端里的 `App listening` 日志。日志出现后，进程仍可能已经退出、端口未监听，或者服务被当前命令生命周期回收。

如果 DevTools MCP 打开页面时报 `ERR_CONNECTION_REFUSED`，先查端口、进程和服务日志。这个错误大概率是本地服务没连上，不一定是页面代码或 MCP 本身的问题。

## 推荐流程

1. 先从 shell 验证 URL 可访问，再用 DevTools MCP 打开页面。
2. 页面打开后优先取 accessibility snapshot，拿到稳定的元素 uid，再执行点击、输入、拖拽等操作。
3. 对难以肉眼判断的状态，用 `evaluate_script` 做小范围探测，例如 `scrollTop`、`document.activeElement`、DOM 数量、元素内联样式等。
4. 复现后检查 console messages 和 network requests。页面没有可见报错时，控制台和请求列表仍可能提供线索。
5. 如果页面打不开，不要反复 `new_page`。先回到 shell 验证服务，再继续浏览器操作。

## 常见坑

- **后台进程不持久**：用 shell 启动 dev server 后，命令结束时服务可能也被回收。需要确认进程仍在、端口仍监听。
- **`localhost` 与 `127.0.0.1` 表现不同**：一个地址失败时，可以换另一个地址验证；但换地址前仍要先确认服务存在。
- **启动命令和实际监听地址不一致**：日志里显示 `localhost`，但服务可能绑定在特定 host。必要时用 `--host 0.0.0.0` 或明确的 host 参数。
- **MCP 失败不等于页面失败**：连接失败、元素 uid 失效、快照过期，都可能是工具使用问题。先重新取 snapshot，再继续操作。
- **不要用旧 snapshot 操作页面**：React 页面更新后，旧 uid 可能已经失效。每次关键状态变化后重新取 snapshot。
- **临时日志别遗留**：启动 dev server 时产生的 stdout/stderr 日志，结束前确认是否需要保留；不需要就清理掉。

## 交互调试建议

- 拖拽类问题尽量分步执行：先记录元素位置，再按下、移动、释放，最后检查状态。
- 输入类问题要确认焦点真的落在目标输入框上，可以检查 `document.activeElement`。
- 滚动类问题要同时观察容器滚动位置和页面滚动位置，避免把 body/window 滚动和内部容器滚动混在一起。
- 如果页面变慢或无响应，先确认是不是复现步骤导致，再看 console、DOM 数量、动画帧/定时器或长任务相关迹象。

## 收尾检查

完成一次 DevTools MCP 调试后，建议做三件事：

1. 记录可复用的复现步骤和环境注意事项。
2. 清理临时日志、临时脚本和不需要提交的生成文件。
3. 用项目自己的检查命令验证改动，例如：

```powershell
npm run lint:es
npm run build
```
