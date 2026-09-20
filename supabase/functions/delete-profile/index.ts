const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const enc = new TextEncoder();
const hash = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { profileId, deviceToken } = await request.json();
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  const profiles = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}&device_hash=eq.${await hash(String(deviceToken || ""))}&select=id`, { headers }).then((r) => r.json());
  if (!profiles.length) return json({ error: "unauthorized" }, 403);
  await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: "DELETE", headers });
  return json({ ok: true });
});