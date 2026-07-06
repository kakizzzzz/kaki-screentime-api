export const dynamic = "force-dynamic"

const MCP_PROTOCOL_VERSION = "2025-06-18"

const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-screen-token"
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers })
}

function ok(id, value) {
  return { jsonrpc: "2.0", id, result: value }
}

function fail(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } }
}

function getToken(req) {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get("token")
  const fromHeader = req.headers.get("x-screen-token")
  const auth = req.headers.get("authorization") || ""
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : ""
  return fromQuery || fromHeader || bearer || ""
}

async function callScreenTime(req, path) {
  const url = new URL(req.url)
  const token = getToken(req)
  const apiUrl = new URL(`/api/screentime/${path}`, url.origin)
  if (token) apiUrl.searchParams.set("token", token)

  const res = await fetch(apiUrl.toString(), { cache: "no-store" })
  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch {
    return {
      ok: false,
      error: "Screen time API did not return JSON",
      status: res.status,
      body: text
    }
  }
}

function textResult(id, data) {
  return ok(id, {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2)
      }
    ]
  })
}

async function handleMessage(req, message) {
  const id = message?.id ?? null
  const method = message?.method
  const params = message?.params || {}

  if (!method) return fail(id, -32600, "missing method")

  if (method.startsWith("notifications/")) return null

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: {
        name: "kaki-screentime-api",
        version: "1.0.0"
      }
    })
  }

  if (method === "ping") return ok(id, {})

  if (method === "tools/list") {
    return ok(id, {
      tools: [
        {
          name: "get_today_screentime",
          description: "读取今天的 App 使用时长统计，包括排名、总时长和当前正在计时的 App。",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: "get_today_events",
          description: "读取今天的 App 打开、关闭和 toggle 事件记录。",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: "toggle_app",
          description: "切换指定 App 的打开/关闭状态，用于手动补记一次 App 开关。",
          inputSchema: {
            type: "object",
            properties: {
              app: {
                type: "string",
                description: "App 名称，例如 小红书、微信、ChatGPT、Claude"
              }
            },
            required: ["app"],
            additionalProperties: false
          }
        }
      ]
    })
  }

  if (method === "tools/call") {
    const name = params.name
    const args = params.arguments || {}

    if (name === "get_today_screentime") {
      return textResult(id, await callScreenTime(req, "today"))
    }

    if (name === "get_today_events") {
      return textResult(id, await callScreenTime(req, "events"))
    }

    if (name === "toggle_app") {
      const app = String(args.app || "").trim()
      if (!app) return fail(id, -32602, "missing app")
      return textResult(id, await callScreenTime(req, `toggle/${encodeURIComponent(app)}`))
    }

    return fail(id, -32602, `unknown tool: ${name}`)
  }

  if (method === "resources/list") return ok(id, { resources: [] })
  if (method === "prompts/list") return ok(id, { prompts: [] })

  return fail(id, -32601, `unknown method: ${method}`)
}

export async function POST(req) {
  try {
    const body = await req.json()

    if (Array.isArray(body)) {
      const replies = await Promise.all(body.map((item) => handleMessage(req, item)))
      return json(replies.filter(Boolean))
    }

    const reply = await handleMessage(req, body)
    if (!reply) return new Response(null, { status: 204, headers })
    return json(reply)
  } catch (error) {
    return json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: error?.message || "internal server error"
      }
    }, 500)
  }
}

export async function GET() {
  return json({
    ok: true,
    name: "kaki-screentime-mcp",
    transport: "Streamable HTTP",
    endpoint: "/api/mcp?token=YOUR_TOKEN",
    tools: ["get_today_screentime", "get_today_events", "toggle_app"]
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers })
}
