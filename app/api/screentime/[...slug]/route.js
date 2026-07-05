import { Redis } from "@upstash/redis"

export const dynamic = "force-dynamic"

const redis = Redis.fromEnv()
const TZ = process.env.SCREEN_TZ || "Asia/Shanghai"
const TOKEN = process.env.SCREEN_TOKEN || ""

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: jsonHeaders,
  })
}

function safeDecode(value = "") {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getDay(ts = Date.now()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts))
}

function parseRedisValue(value) {
  if (!value) return null
  if (typeof value === "object") return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function formatDuration(seconds = 0) {
  const s = Math.max(0, Number(seconds) || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function checkToken(req) {
  if (!TOKEN) return true
  const url = new URL(req.url)
  const tokenFromQuery = url.searchParams.get("token")
  const auth = req.headers.get("authorization") || ""
  const tokenFromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  return tokenFromQuery === TOKEN || tokenFromHeader === TOKEN
}

async function writeEvent(day, event) {
  const key = `screentime:events:${day}`
  await redis.lpush(key, JSON.stringify(event))
  await redis.ltrim(key, 0, 499)
}

async function closeSession(app, now) {
  const activeKey = "screentime:active"
  const active = parseRedisValue(await redis.hget(activeKey, app))

  if (!active?.start) {
    const event = {
      type: "close_ignored",
      app,
      at: now,
      iso: new Date(now).toISOString(),
      reason: "no active session",
    }
    await writeEvent(getDay(now), event)
    return { ok: true, warning: "no active session", app, event }
  }

  const seconds = Math.max(1, Math.round((now - Number(active.start)) / 1000))
  const day = active.day || getDay(now)

  await redis.hdel(activeKey, app)
  await redis.hincrby(`screentime:totals:${day}`, app, seconds)

  const event = {
    type: "close",
    app,
    start: active.start,
    end: now,
    day,
    iso: new Date(now).toISOString(),
    seconds,
    duration: formatDuration(seconds),
  }
  await writeEvent(day, event)

  return { ok: true, event }
}

async function openSession(app, now) {
  const day = getDay(now)
  const event = {
    type: "open",
    app,
    start: now,
    day,
    iso: new Date(now).toISOString(),
  }

  await redis.hset("screentime:active", {
    [app]: JSON.stringify({ app, start: now, day }),
  })
  await writeEvent(day, event)

  return { ok: true, event }
}

async function getToday(now) {
  const day = getDay(now)
  const totalsRaw = (await redis.hgetall(`screentime:totals:${day}`)) || {}
  const activeRaw = (await redis.hgetall("screentime:active")) || {}

  const totals = {}
  for (const [app, seconds] of Object.entries(totalsRaw)) {
    const value = Number(seconds) || 0
    totals[app] = {
      seconds: value,
      duration: formatDuration(value),
    }
  }

  const active = {}
  for (const [app, raw] of Object.entries(activeRaw)) {
    const session = parseRedisValue(raw)
    if (!session?.start) continue
    const liveSeconds = Math.max(0, Math.round((now - Number(session.start)) / 1000))
    active[app] = {
      ...session,
      liveSeconds,
      liveDuration: formatDuration(liveSeconds),
    }

    if (!totals[app]) totals[app] = { seconds: 0, duration: "0s" }
    totals[app].liveSeconds = totals[app].seconds + liveSeconds
    totals[app].liveDuration = formatDuration(totals[app].liveSeconds)
  }

  const ranking = Object.entries(totals)
    .map(([app, value]) => ({
      app,
      seconds: value.liveSeconds ?? value.seconds,
      duration: value.liveDuration ?? value.duration,
    }))
    .sort((a, b) => b.seconds - a.seconds)

  return { ok: true, day, timezone: TZ, ranking, totals, active }
}

async function getEvents(now) {
  const day = getDay(now)
  const events = await redis.lrange(`screentime:events:${day}`, 0, 99)
  return {
    ok: true,
    day,
    timezone: TZ,
    events: events.map(parseRedisValue).filter(Boolean),
  }
}

async function resetToday(req, now) {
  const url = new URL(req.url)
  if (url.searchParams.get("confirm") !== "yes") {
    return {
      ok: false,
      error: "reset requires confirm=yes",
      example: "/api/screentime/reset?confirm=yes&token=YOUR_TOKEN",
    }
  }

  const day = getDay(now)
  await redis.del(`screentime:totals:${day}`)
  await redis.del(`screentime:events:${day}`)
  await redis.del("screentime:active")
  return { ok: true, day, reset: true }
}

async function handler(req, context) {
  if (!checkToken(req)) {
    return json({ ok: false, error: "bad token" }, 401)
  }

  const params = await context.params
  const slug = params.slug || []
  const action = safeDecode(slug[0] || "")
  const app = safeDecode(slug.slice(1).join("/"))
  const now = Date.now()

  if (!action) {
    return json({
      ok: true,
      name: "kaki-screentime-api",
      usage: [
        "/api/screentime/open/小红书?token=YOUR_TOKEN",
        "/api/screentime/close/小红书?token=YOUR_TOKEN",
        "/api/screentime/toggle/小红书?token=YOUR_TOKEN",
        "/api/screentime/today?token=YOUR_TOKEN",
        "/api/screentime/events?token=YOUR_TOKEN",
      ],
    })
  }

  if (action === "today") return json(await getToday(now))
  if (action === "events") return json(await getEvents(now))
  if (action === "reset") return json(await resetToday(req, now))

  if (!app) {
    return json({ ok: false, error: "missing app name" }, 400)
  }

  if (action === "open") return json(await openSession(app, now))
  if (action === "close") return json(await closeSession(app, now))
  if (action === "toggle") {
    const active = parseRedisValue(await redis.hget("screentime:active", app))
    if (active?.start) return json(await closeSession(app, now))
    return json(await openSession(app, now))
  }

  return json({ ok: false, error: "unknown action", action }, 400)
}

export async function GET(req, context) {
  return handler(req, context)
}

export async function POST(req, context) {
  return handler(req, context)
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: jsonHeaders })
}
