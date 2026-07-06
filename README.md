# Kaki Screen Time API

一个极简的 iPhone 快捷指令打点后端。它不会读取 iOS Screen Time 数据库，而是靠快捷指令在 App 打开/关闭时访问 URL，记录使用时长。

## 需要的环境变量

在 Vercel 项目里设置：

```txt
SCREEN_TOKEN=你自己的密码
SCREEN_TZ=Asia/Shanghai
```

连接 Upstash Redis 后，Vercel 会自动写入 Redis 相关环境变量。代码也支持手动配置：

```txt
UPSTASH_REDIS_REST_URL=你的 Upstash REST URL
UPSTASH_REDIS_REST_TOKEN=你的 Upstash REST Token
```

## API

假设部署域名是：

```txt
https://kaki-screentime-api.vercel.app
```

打开 App：

```txt
/api/screentime/open/小红书?token=YOUR_TOKEN
```

关闭 App：

```txt
/api/screentime/close/小红书?token=YOUR_TOKEN
```

偷懒版切换状态：

```txt
/api/screentime/toggle/小红书?token=YOUR_TOKEN
```

查看今天统计：

```txt
/api/screentime/today?token=YOUR_TOKEN
```

查看今天事件：

```txt
/api/screentime/events?token=YOUR_TOKEN
```

清空今天数据：

```txt
/api/screentime/reset?confirm=yes&token=YOUR_TOKEN
```

## MCP

MCP 入口：

```txt
/api/mcp?token=YOUR_TOKEN
```

Kelivo 里可以这样填：

```txt
名称：Kaki Screen Time
传输类型：Streamable HTTP
服务器地址：https://kaki-screentime-api.vercel.app/api/mcp?token=YOUR_TOKEN
自定义请求头：不填
```

内置工具：

```txt
get_today_screentime
get_today_events
toggle_app
```

## iPhone 快捷指令建议

更稳的方案是给每个 App 建两个自动化：

- App 被打开时：访问 `open/应用名`
- App 被关闭时：访问 `close/应用名`

`toggle` 能跑，但如果漏触发一次，开关状态会错位。

## 数据结构

Redis key：

```txt
screentime:active
screentime:totals:YYYY-MM-DD
screentime:events:YYYY-MM-DD
```

Redeploy trigger: 2026-07-06 MCP endpoint.
