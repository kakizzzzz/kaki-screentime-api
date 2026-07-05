const examples = [
  "/api/screentime/open/小红书?token=YOUR_TOKEN",
  "/api/screentime/close/小红书?token=YOUR_TOKEN",
  "/api/screentime/toggle/小红书?token=YOUR_TOKEN",
  "/api/screentime/today?token=YOUR_TOKEN",
  "/api/screentime/events?token=YOUR_TOKEN",
  "/api/screentime/reset?confirm=yes&token=YOUR_TOKEN"
]

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f7f6f2",
      color: "#171717"
    }}>
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        background: "white",
        border: "1px solid #e8e3da",
        borderRadius: 28,
        padding: 28,
        boxShadow: "0 18px 50px rgba(0,0,0,.06)"
      }}>
        <p style={{ letterSpacing: ".08em", textTransform: "uppercase", color: "#777", fontSize: 12 }}>
          Personal API
        </p>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: "10px 0 12px" }}>
          Kaki Screen Time API
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "#444" }}>
          这是一个给 iPhone 快捷指令用的小后端：打开 App 时打一个 open，关闭 App 时打一个 close，今天统计从 today 读取。
        </p>
        <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
          {examples.map((item) => (
            <code key={item} style={{
              display: "block",
              padding: "12px 14px",
              borderRadius: 14,
              background: "#f2f0eb",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}>{item}</code>
          ))}
        </div>
        <p style={{ marginTop: 24, fontSize: 14, color: "#666" }}>
          部署后记得在 Vercel 设置 SCREEN_TOKEN、SCREEN_TZ，并连接 Upstash Redis。
        </p>
      </section>
    </main>
  )
}
