const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const enc = new TextEncoder();
const hash = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const finite = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "return=representation" };
  const body = await request.json();
  const profileId = String(body.profileId || "");
  const deviceHash = await hash(String(body.deviceToken || ""));
  const snapshot = body.snapshot || {};
  const profiles = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}&device_hash=eq.${deviceHash}&select=id`, { headers }).then((r) => r.json());
  if (!profiles.length) return json({ error: "unauthorized" }, 403);
  const metrics = {
    totalGoldEarned: finite(snapshot.totalGoldEarned, 0, 1e18),
    unlockedZoneCount: Math.round(finite(snapshot.unlockedZoneCount, 1, 8)),
    bossDefeated: Math.round(finite(snapshot.bossDefeated, 0, 1000000)),
    ascensionCount: Math.round(finite(snapshot.ascensionCount, 0, 100000)),
    codexStars: Math.round(finite(snapshot.codexStars, 0, 10000)),
    discoveredCount: Math.round(finite(snapshot.discoveredCount, 0, 48)),
    equipmentUnique: Math.round(finite(snapshot.equipmentUnique, 0, 32)),
    totalNodeLevels: Math.round(finite(snapshot.totalNodeLevels, 0, 800))
  };
  const existing = await fetch(`${url}/rest/v1/leaderboard_scores?profile_id=eq.${encodeURIComponent(profileId)}&select=total_gold_earned,boss_defeated,ascension_count,total_node_levels`, { headers }).then((r) => r.json());
  if (existing[0] && metrics.totalGoldEarned < Number(existing[0].total_gold_earned || 0)) return json({ ok: true, ignored: true });
  const recent = await fetch(`${url}/rest/v1/score_snapshots?profile_id=eq.${encodeURIComponent(profileId)}&submitted_at=gte.${encodeURIComponent(new Date(Date.now() - 60000).toISOString())}&select=id`, { headers }).then((r) => r.json());
  if (recent.length >= 6) return json({ error: "rate_limited" }, 429);  const highZone = ["shallow","reef","deep","abyss","aurora","rift","city","void"][metrics.unlockedZoneCount - 1] || "shallow";
  const score = await fetch(`${url}/rest/v1/rpc/calculate_captain_score`, { method: "POST", headers, body: JSON.stringify({ p_gold: metrics.totalGoldEarned, p_zones: metrics.unlockedZoneCount, p_bosses: metrics.bossDefeated, p_ascensions: metrics.ascensionCount, p_codex_stars: metrics.codexStars, p_discovered: metrics.discoveredCount, p_equipment: metrics.equipmentUnique, p_node_levels: metrics.totalNodeLevels }) }).then((r) => r.json());
  const row = { profile_id: profileId, ...metrics, captain_score: Number(score) || 0, highest_zone: highZone, last_seen_at: new Date().toISOString(), flagged: false };
  await fetch(`${url}/rest/v1/score_snapshots`, { method: "POST", headers, body: JSON.stringify({ profile_id: profileId, captain_score: row.captain_score, metrics, status: "accepted" }) });
  await fetch(`${url}/rest/v1/leaderboard_scores?on_conflict=profile_id`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(row) });
  await fetch(`${url}/rest/v1/profiles?id=eq.${profileId}`, { method: "PATCH", headers, body: JSON.stringify({ last_seen_at: row.last_seen_at }) });
  return json({ ok: true, score: row.captain_score });
});