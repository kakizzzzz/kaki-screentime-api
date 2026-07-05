export const metadata = {
  title: "Kaki Screen Time API",
  description: "Tiny personal screen-time logger for iOS Shortcuts."
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
