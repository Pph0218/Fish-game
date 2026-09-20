(() => {
  "use strict";
  const CONFIG = window.TIDE_LEADERBOARD_CONFIG || {};
  const PROFILE_KEY = "tideline_leaderboard_profile_v1";
  const CACHE_KEY = "tideline_leaderboard_cache_v1";
  const BOARD_COLUMNS = {
    captain: "captain_score",
    gold: "total_gold_earned",
    depth: "unlocked_zone_count",
    boss: "boss_defeated",
    ascension: "ascension_count"
  };
  const boardSort = (board, item) => {
    const key = BOARD_COLUMNS[board] || BOARD_COLUMNS.captain;
    return Number(item[key] || item[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] || 0);
  };
  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function isConfigured() {
    return Boolean(CONFIG.enabled && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  }
  function calculateCaptainScore(snapshot = {}) {
    return Math.max(0, Math.floor(
      Math.log10(Math.max(10, Number(snapshot.totalGoldEarned) || 0) + 10) * 120 +
      (Number(snapshot.unlockedZoneCount) || 0) * 350 +
      (Number(snapshot.bossDefeated) || 0) * 500 +
      (Number(snapshot.ascensionCount) || 0) * 900 +
      (Number(snapshot.codexStars) || 0) * 60 +
      (Number(snapshot.discoveredCount) || 0) * 30 +
      (Number(snapshot.equipmentUnique) || 0) * 35 +
      (Number(snapshot.totalNodeLevels) || 0) * 8
    ));
  }
  function normalizeNickname(nickname) {
    return String(nickname || "").trim().toLowerCase();
  }
  function validateNickname(nickname) {
    const value = String(nickname || "").trim();
    if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,12}$/.test(value)) return { ok: false, message: "昵称需要 2–12 个中文、字母、数字或下划线。" };
    return { ok: true, nickname: value, nicknameKey: normalizeNickname(value) };
  }
  function getProfile() {
    return readJSON(PROFILE_KEY, null);
  }
  function saveProfile(profile) {
    writeJSON(PROFILE_KEY, profile);
    return profile;
  }
  function getCache(board = "captain") {
    const cache = readJSON(CACHE_KEY, {});
    return cache[board] || { entries: [], fetchedAt: 0, offline: true };
  }
  function cacheBoard(board, entries) {
    const cache = readJSON(CACHE_KEY, {});
    cache[board] = { entries, fetchedAt: Date.now(), offline: false };
    writeJSON(CACHE_KEY, cache);
  }
  async function requestFunction(name, payload = {}) {
    if (!isConfigured()) throw new Error("OFFLINE");
    const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${CONFIG.supabaseAnonKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return response.json();
  }
  async function claimNickname(nickname, deviceToken = "") {
    const validation = validateNickname(nickname);
    if (!validation.ok) return { ok: false, message: validation.message };
    const token = deviceToken || createId();
    const localProfile = {
      id: getProfile()?.id || createId(),
      nickname: validation.nickname,
      nicknameKey: validation.nicknameKey,
      deviceToken: token,
      createdNicknameAt: Date.now(),
      lastSyncedAt: 0
    };
    if (!isConfigured()) return { ok: true, offline: true, profile: saveProfile(localProfile), recoveryCode: "离线档案不需要恢复码" };
    try {
      const result = await requestFunction("claim-profile", { nickname: validation.nickname, deviceToken: token });
      const profile = { ...localProfile, ...result.profile, deviceToken: token };
      return { ok: true, profile: saveProfile(profile), recoveryCode: result.recoveryCode || "" };
    } catch (error) {
      return { ok: true, offline: true, profile: saveProfile(localProfile), recoveryCode: "当前离线，联网后可迁移档案。" };
    }
  }
  async function changeNickname(nickname, deviceToken = "") {
    const profile = getProfile();
    if (!profile) return claimNickname(nickname, deviceToken);
    const validation = validateNickname(nickname);
    if (!validation.ok) return { ok: false, message: validation.message };
    if (Date.now() - Number(profile.createdNicknameAt || 0) < 3 * 24 * 60 * 60 * 1000) return { ok: false, message: "昵称创建后 3 天内不能修改。" };
    if (!isConfigured()) {
      const next = saveProfile({ ...profile, nickname: validation.nickname, nicknameKey: validation.nicknameKey, createdNicknameAt: Date.now() });
      return { ok: true, offline: true, profile: next };
    }
    try {
      const result = await requestFunction("change-profile", { nickname: validation.nickname, deviceToken: profile.deviceToken });
      return { ok: true, profile: saveProfile({ ...profile, ...result.profile, createdNicknameAt: Date.now() }) };
    } catch (error) {
      return { ok: false, message: "联网后才能改名，当前昵称保持不变。" };
    }
  }
  async function submitSnapshot(snapshot = {}) {
    const profile = getProfile();
    if (!profile) return { ok: false, message: "尚未创建舰长档案。" };
    const payload = {
      profileId: profile.id,
      deviceToken: profile.deviceToken,
      snapshot: { ...snapshot, captainScore: calculateCaptainScore(snapshot) },
      submittedAt: Date.now()
    };
    if (!isConfigured()) {
      const pending = readJSON("tideline_pending_snapshots", []);
      pending.push(payload);
      writeJSON("tideline_pending_snapshots", pending.slice(-100));
      return { ok: true, offline: true, score: payload.snapshot.captainScore };
    }
    try {
      const result = await requestFunction("submit-score", payload);
      return { ...result, ok: true };
    } catch (error) {
      const pending = readJSON("tideline_pending_snapshots", []);
      pending.push(payload);
      writeJSON("tideline_pending_snapshots", pending.slice(-100));
      return { ok: true, offline: true, score: payload.snapshot.captainScore };
    }
  }
  async function getLeaderboard(board = "captain", limit = 50) {
    const cached = getCache(board);
    if (!isConfigured()) return { ...cached, offline: true };
    try {
      const column = BOARD_COLUMNS[board] || BOARD_COLUMNS.captain;
      const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/leaderboard_scores?select=*&order=${column}.desc&limit=${limit}`, {
        headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` }
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const entries = await response.json();
      cacheBoard(board, entries);
      return { entries, fetchedAt: Date.now(), offline: false };
    } catch (error) {
      return { ...cached, offline: true, error: "网络不可用，当前显示本地缓存。" };
    }
  }
  async function syncPending() {
    if (!isConfigured()) return { synced: 0, offline: true };
    const pending = readJSON("tideline_pending_snapshots", []);
    let synced = 0;
    const remain = [];
    for (const item of pending) {
      try { await requestFunction("submit-score", item); synced += 1; } catch { remain.push(item); }
    }
    writeJSON("tideline_pending_snapshots", remain);
    return { synced, offline: remain.length > 0 };
  }
  async function deleteProfile() {
    const profile = getProfile();
    if (profile && isConfigured()) {
      try { await requestFunction("delete-profile", { profileId: profile.id, deviceToken: profile.deviceToken }); } catch {}
    }
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem("tideline_pending_snapshots");
    return { ok: true };
  }
  window.LeaderboardBridge = { isConfigured, validateNickname, calculateCaptainScore, getProfile, saveProfile, claimNickname, changeNickname, submitSnapshot, getLeaderboard, getCache, syncPending, deleteProfile };
})();