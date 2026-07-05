# Kaki Screen Time API

一个极简的 iPhone 快捷指令打点后端。它不会读取 iOS Screen Time 数据库，而是靠快捷指令在 App 打开/关闭时访问 URL，记录使用时长。

## 需要的环境变量

在 Vercel 项目里设置：

```txt
SCREEN_TOKEN=你自己的密码
SCREEN_TZ=Asia/Shanghai
```

连接 Upstash Redis 后，Vercel 会自动写入 Redis 相关环境变量。`@upstash/redis` 会通过 `Redis.fromEnv()` 读取它们。

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
