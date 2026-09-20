(() => {
  "use strict";
  const files = {
    splash: "assets/audio/splash.wav",
    reel: "assets/audio/reel.wav",
    select: "assets/audio/select.wav",
    bloop: "assets/audio/bloop.wav"
  };
  const pools = {};
  let muted = false;
  let unlocked = false;
  let activeVoices = 0;

  Object.entries(files).forEach(([key, source]) => {
    pools[key] = Array.from({ length: key === "splash" ? 3 : 2 }, () => {
      const audio = new Audio(source);
      audio.preload = "auto";
      audio.volume = key === "reel" ? 0.18 : 0.32;
      audio.dataset.baseVolume = String(audio.volume);
      return audio;
    });
  });

  function play(key, volume = 1, rate = 1) {
    if (muted || !unlocked || activeVoices >= 6) return;
    const pool = pools[key];
    if (!pool) return;
    const audio = pool.find((item) => item.paused || item.ended) || pool[0];
    audio.currentTime = 0;
    audio.volume = Math.min(0.6, Number(audio.dataset.baseVolume || audio.volume) * volume);
    audio.playbackRate = rate;
    activeVoices += 1;
    audio.play().catch(() => {}).finally(() => {
      activeVoices = Math.max(0, activeVoices - 1);
    });
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    play("select", 0.55, 1.15);
  }

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("tide:cast", () => play("select", 0.65, 1.12));
  window.addEventListener("tide:net-impact", (event) => {
    play("splash", 1, event.detail && event.detail.empty ? 0.82 : 1);
    play("reel", 0.75, 0.92);
  });
  window.addEventListener("tide:catch", () => play("bloop", 0.72, 1.08));
  window.addEventListener("tide:sell", () => play("select", 1, 0.82));
  window.addEventListener("tide:impact", (event) => {
    const type = event.detail && event.detail.type;
    if (type === "rare" || type === "legendary" || type === "ultimate") play("bloop", 1, type === "legendary" || type === "ultimate" ? 1.35 : 1.18);
    else play("select", 0.58, 1.2);
  });
  window.addEventListener("tide:upgrade", () => play("select", 1, 0.72));
  window.addEventListener("tide:combo", (event) => play("select", 0.48, 1 + Math.min(0.36, (event.detail?.combo || 0) * 0.012)));
  window.addEventListener("tide:mute", (event) => { muted = Boolean(event.detail && event.detail.muted); });
})();
