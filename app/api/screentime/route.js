const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization"
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers })
}

export async function GET() {
  return json({
    ok: true,
    name: "kaki-screentime-api",
    usage: [
      "/api/screentime/open/小红书?token=YOUR_TOKEN",
      "/api/screentime/close/小红书?token=YOUR_TOKEN",
      "/api/screentime/toggle/小红书?token=YOUR_TOKEN",
      "/api/screentime/today?token=YOUR_TOKEN",
      "/api/screentime/events?token=YOUR_TOKEN"
    ]
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers })
}
