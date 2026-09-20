(() => {
  "use strict";

  const CELL = 256;
  const COLS = 4;
  const ROWS = 2;
  const cache = new Map();
  const overrides = {};

  const config = (shape, body, belly, fin, accent, pattern, iris = "#7beaff", glow = null, eyeScale = 1) => ({ shape, body, belly, fin, accent, pattern, iris, glow: glow || accent, eyeScale });

  const CONFIGS = {
    silver_scad: config("dart", "#8fe9f4", "#e9feff", "#65cadc", "#d9fbff", "stripe", "#6be9ff", "#7cefff", 1.0),
    sardine: config("oval", "#62c7df", "#d9f8ff", "#3da4c5", "#e8fdff", "scales", "#64dfff", "#68ddf5", 1.05),
    spotted_bream: config("round", "#47d4a8", "#ddffe9", "#279d91", "#b8ffe1", "spots", "#68ffd6", "#5df0c7", 1.15),
    moon_carp: config("round", "#f6c85b", "#fff3bd", "#dd8e45", "#fff0a4", "moon", "#72eaff", "#ffd876", 1.1),
    prism_guppy: config("dart", "#79efc9", "#effff8", "#4bc9ba", "#b8fff0", "spectrum", "#ff8bd8", "#7dffe3", 0.95),
    lagoon_pike: config("long", "#79c8ef", "#e5f9ff", "#4b94c5", "#d7f6ff", "stripe", "#78eaff", "#71d7ff", 1.0),
    red_snapper: config("oval", "#ef7469", "#ffe2d7", "#c84d52", "#ffd1bd", "scales", "#ffd46e", "#ff866f", 1.05),
    grouper: config("round", "#b87962", "#f2d0ad", "#8a5145", "#f6d5a6", "spots", "#ffe9a6", "#d89b6d", 1.1),
    blue_spotted_ray: config("ray", "#4e9df2", "#cae7ff", "#4274d7", "#c7f0ff", "spots", "#8ff4ff", "#65b7ff", 1.15),
    coral_dragon: config("seahorse", "#e86f9e", "#ffd7e8", "#c7537f", "#ffd3e4", "coral", "#78ecff", "#ff83bd", 1.1),
    neon_lionfish: config("puffer", "#ff9a68", "#ffe4c9", "#d95d42", "#ffd0a4", "spots", "#ffdf69", "#ff9b63", 1.22),
    crystal_turtle: config("round", "#71dfc7", "#e4fff7", "#3ca995", "#c8fff0", "crystal", "#8ff4ff", "#81efda", 1.1),
    deep_cod: config("oval", "#7899aa", "#d7e6eb", "#516e80", "#c6e4ee", "scales", "#8ceaff", "#8fb9ca", 1.0),
    bluefin_tuna: config("dart", "#267fc8", "#b9ddff", "#165b9f", "#cce9ff", "stripe", "#76e9ff", "#4a9dff", 0.95),
    oarfish: config("long", "#8aa8c7", "#e8f3ff", "#657e9f", "#d9f1ff", "stripe", "#85edff", "#9cbfff", 1.0),
    lanternfish: config("angler", "#719b54", "#dff2b2", "#4f743d", "#d4ff91", "glow", "#b9ff58", "#9dff5c", 1.2),
    gloom_sword: config("dart", "#7ea8c8", "#e3f3ff", "#5478a4", "#cce9ff", "circuit", "#8cecff", "#91bce0", 0.96),
    abyss_eel: config("eel", "#596ca6", "#cad6ff", "#394779", "#b5c7ff", "scales", "#9adfff", "#748cff", 1.0),
    black_sea_bream: config("round", "#52647f", "#b9c8dc", "#354557", "#cfe2f2", "spots", "#8cecff", "#7186a8", 1.1),
    ghost_shark: config("shark", "#718df5", "#d9e5ff", "#4968ca", "#c8dcff", "ghost", "#a9f7ff", "#8b9cff", 1.0),
    plasma_manta: config("ray", "#9679ff", "#e9e2ff", "#684bc7", "#d5c8ff", "aurora", "#8ff2ff", "#b092ff", 1.14),
    nebula_eel: config("eel", "#805ff0", "#e3d9ff", "#533ab1", "#cdbfff", "stars", "#8df7ff", "#a783ff", 1.02),
    starlight_whale: config("whale", "#8b75d4", "#e7dcff", "#6654ac", "#d9c9ff", "stars", "#bdf5ff", "#b288ff", 1.15),
    titan_whale: config("whale", "#78a7e8", "#e3f1ff", "#4e77bd", "#caebff", "gravity", "#8ff4ff", "#8dc6ff", 1.15),
    crystal_smelt: config("dart", "#a9f1f7", "#ffffff", "#77ccdb", "#eaffff", "crystal", "#78eaff", "#bdfbff", 1.05),
    aurora_cod: config("oval", "#62cec7", "#ddfff8", "#3fa69e", "#c9fff4", "aurora", "#8effdc", "#79ffe4", 1.0),
    phosphor_ray: config("ray", "#6bb5ff", "#d8ebff", "#4b7ee0", "#cee8ff", "glow", "#8dffe8", "#7ed6ff", 1.15),
    cobalt_marlin: config("dart", "#377fe9", "#c7e0ff", "#2258b5", "#c8e8ff", "stripe", "#78efff", "#5e9cff", 0.95),
    aurora_dragon_eel: config("eel", "#62dfc4", "#ddfff5", "#2fa995", "#c6ffe9", "aurora", "#9fffe0", "#79ffcf", 1.0),
    sky_jelly: config("jelly", "#c9a9ff", "#f0e8ff", "#8e78da", "#eadfff", "stars", "#8df4ff", "#d6b8ff", 1.15),
    magma_bass: config("oval", "#d66d48", "#ffd2ae", "#9f4337", "#ffb274", "magma", "#ffd45e", "#ff8a52", 1.05),
    blacksmoke_eel: config("eel", "#76607b", "#d5b9d7", "#49394f", "#c6a6c8", "smoke", "#ff9e6b", "#a87bab", 1.0),
    flame_marlin: config("dart", "#f27649", "#ffd5b1", "#bd4932", "#ffb270", "flame", "#ffde64", "#ff7a4f", 0.95),
    ember_snapper: config("round", "#ef6245", "#ffd4c5", "#b63f35", "#ffb691", "spots", "#ffd96c", "#ff784f", 1.1),
    lava_goblin_shark: config("shark", "#b84b38", "#e4a085", "#743229", "#e89168", "magma", "#ffcf5c", "#e56542", 1.0),
    primordial_whalefish: config("whale", "#dc9552", "#ffe1b8", "#9f6038", "#ffc782", "flame", "#ffdf6c", "#ffae5d", 1.15),
    relic_damselfish: config("round", "#72bcae", "#dcfff6", "#4d887f", "#c6efe8", "circuit", "#8cecff", "#79d5c8", 1.1),
    titanium_barracuda: config("dart", "#9cb2c8", "#eef6ff", "#64788f", "#dce8f4", "circuit", "#7feaff", "#b5c9db", 0.95),
    blue_steel_pomfret: config("oval", "#728fd7", "#dbe5ff", "#4c64a8", "#cbd8ff", "scales", "#91efff", "#8aa8ff", 1.0),
    watcher_swordfish: config("dart", "#55a8df", "#d4efff", "#3571ad", "#c6ebff", "circuit", "#8cfff2", "#6bc8ff", 0.95),
    mech_ghost_shark: config("shark", "#7886b8", "#d6dcf5", "#505d8a", "#cbd5ff", "circuit", "#8ff4ff", "#91a2ff", 1.0),
    abyss_core: config("squid", "#69e7d3", "#dcfff9", "#3eaa9e", "#b9fff2", "circuit", "#8effff", "#72ffe4", 1.2),
    stardust_sardine: config("dart", "#a9c5ff", "#f0f4ff", "#718bd4", "#e2eaff", "stars", "#8ff5ff", "#c2d6ff", 1.0),
    phantom_moon_ray: config("ray", "#aa91ff", "#eee7ff", "#7561c9", "#e1d8ff", "moon", "#8ff2ff", "#bca8ff", 1.15),
    void_tuna: config("dart", "#6676ee", "#dce2ff", "#414bb1", "#d0d7ff", "stars", "#92f7ff", "#8496ff", 0.95),
    gravity_oarfish: config("long", "#b49bdd", "#f0e8ff", "#8067b4", "#e5d9ff", "gravity", "#9bf6ff", "#c7adff", 1.0),
    void_whale: config("whale", "#6377e7", "#dce2ff", "#3c49aa", "#d2dcff", "stars", "#8ff4ff", "#808fff", 1.15),
    genesis_whale: config("whale", "#dccfff", "#ffffff", "#a896e7", "#f0e8ff", "genesis", "#95f7ff", "#e1cfff", 1.15)
  };

  const FALLBACK = config("oval", "#75dbe8", "#e7fdff", "#459fb5", "#d9fbff", "scales", "#73eaff", "#79e6f2", 1.0);

  function colorMix(a, b, ratio) {
    const pa = a.match(/\w\w/g).map((value) => parseInt(value, 16));
    const pb = b.match(/\w\w/g).map((value) => parseInt(value, 16));
    const mixed = pa.map((value, index) => Math.round(value + (pb[index] - value) * ratio).toString(16).padStart(2, "0"));
    return `#${mixed.join("")}`;
  }

  function bodyPath(ctx, cfg, cx, cy, sx, sy) {
    ctx.beginPath();
    if (cfg.shape === "ray") {
      ctx.moveTo(cx + 66 * sx, cy);
      ctx.bezierCurveTo(cx + 22 * sx, cy - 48 * sy, cx - 54 * sx, cy - 48 * sy, cx - 68 * sx, cy);
      ctx.bezierCurveTo(cx - 38 * sx, cy + 30 * sy, cx + 38 * sx, cy + 30 * sy, cx + 66 * sx, cy);
    } else if (cfg.shape === "jelly") {
      ctx.moveTo(cx - 48 * sx, cy + 5 * sy);
      ctx.bezierCurveTo(cx - 45 * sx, cy - 62 * sy, cx + 45 * sx, cy - 62 * sy, cx + 48 * sx, cy + 5 * sy);
      ctx.bezierCurveTo(cx + 18 * sx, cy - 2 * sy, cx - 18 * sx, cy - 2 * sy, cx - 48 * sx, cy + 5 * sy);
    } else if (cfg.shape === "squid") {
      ctx.moveTo(cx - 27 * sx, cy - 42 * sy);
      ctx.bezierCurveTo(cx + 34 * sx, cy - 58 * sy, cx + 62 * sx, cy - 8 * sy, cx + 29 * sx, cy + 40 * sy);
      ctx.bezierCurveTo(cx - 12 * sx, cy + 55 * sy, cx - 48 * sx, cy + 14 * sy, cx - 27 * sx, cy - 42 * sy);
    } else if (cfg.shape === "seahorse") {
      ctx.moveTo(cx + 12 * sx, cy - 70 * sy);
      ctx.bezierCurveTo(cx + 48 * sx, cy - 62 * sy, cx + 46 * sx, cy - 20 * sy, cx + 28 * sx, cy + 5 * sy);
      ctx.bezierCurveTo(cx + 18 * sx, cy + 42 * sy, cx - 18 * sx, cy + 54 * sy, cx - 32 * sx, cy + 72 * sy);
      ctx.bezierCurveTo(cx - 15 * sx, cy + 41 * sy, cx - 22 * sx, cy + 24 * sy, cx - 4 * sx, cy - 2 * sy);
      ctx.bezierCurveTo(cx - 20 * sx, cy - 31 * sy, cx - 9 * sx, cy - 54 * sx, cx + 12 * sx, cy - 70 * sy);
    } else if (cfg.shape === "eel" || cfg.shape === "long") {
      ctx.moveTo(cx - 82 * sx, cy + 4 * sy);
      ctx.bezierCurveTo(cx - 38 * sx, cy - 31 * sy, cx + 18 * sx, cy - 31 * sy, cx + 76 * sx, cy);
      ctx.bezierCurveTo(cx + 21 * sx, cy + 31 * sy, cx - 38 * sx, cy + 31 * sy, cx - 82 * sx, cy + 4 * sy);
    } else if (cfg.shape === "shark") {
      ctx.moveTo(cx + 82 * sx, cy);
      ctx.bezierCurveTo(cx + 35 * sx, cy - 39 * sy, cx - 39 * sx, cy - 38 * sy, cx - 75 * sx, cy - 5 * sy);
      ctx.bezierCurveTo(cx - 34 * sx, cy + 40 * sy, cx + 39 * sx, cy + 35 * sy, cx + 82 * sx, cy);
    } else if (cfg.shape === "puffer" || cfg.shape === "round") {
      ctx.ellipse(cx, cy, 60 * sx, 51 * sy, 0, 0, Math.PI * 2);
    } else {
      const width = cfg.shape === "whale" ? 78 : cfg.shape === "dart" ? 64 : 64;
      const height = cfg.shape === "whale" ? 39 : cfg.shape === "puffer" ? 50 : 46;
      ctx.ellipse(cx, cy, width * sx, height * sy, 0, 0, Math.PI * 2);
    }
    ctx.closePath();
  }

  function drawTail(ctx, cfg, cx, cy, sx, sy, wag) {
    ctx.save();
    ctx.translate(cx - 57 * sx, cy);
    ctx.rotate(wag);
    ctx.fillStyle = cfg.fin;
    ctx.beginPath();
    if (cfg.shape === "ray") {
      ctx.moveTo(0, 0);
      ctx.lineTo(-92 * sx, -6 * sy);
      ctx.lineTo(-55 * sx, 0);
      ctx.lineTo(-92 * sx, 7 * sy);
    } else if (cfg.shape === "jelly") {
      ctx.moveTo(-10 * sx, 0);
      for (let i = 0; i < 5; i += 1) {
        const x = (i - 2) * 18 * sx;
        ctx.quadraticCurveTo(x + 9 * sx, 72 * sy, x - 4 * sx, 96 * sy);
        ctx.quadraticCurveTo(x + 10 * sx, 66 * sy, x + 4 * sx, 4 * sy);
      }
    } else if (cfg.shape === "squid") {
      ctx.moveTo(-5 * sx, 20 * sy);
      for (let i = 0; i < 5; i += 1) {
        const x = (i - 2) * 13 * sx;
        ctx.quadraticCurveTo(x - 16 * sx, 78 * sy, x + 5 * sx, 104 * sy);
        ctx.quadraticCurveTo(x + 18 * sx, 70 * sy, x + 5 * sx, 16 * sy);
      }
    } else {
      ctx.moveTo(0, 0);
      ctx.lineTo(-48 * sx, -30 * sy);
      ctx.lineTo(-32 * sx, 0);
      ctx.lineTo(-48 * sx, 30 * sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFins(ctx, cfg, cx, cy, sx, sy, wag) {
    ctx.fillStyle = cfg.fin;
    if (cfg.shape !== "ray" && cfg.shape !== "jelly" && cfg.shape !== "squid") {
      ctx.beginPath();
      ctx.moveTo(cx - 10 * sx, cy - 35 * sy);
      ctx.quadraticCurveTo(cx + 2 * sx, cy - 82 * sy, cx + 30 * sx, cy - 35 * sy);
      ctx.quadraticCurveTo(cx + 5 * sx, cy - 27 * sy, cx - 10 * sx, cy - 35 * sy);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(cx - 5 * sx, cy + 27 * sy);
    ctx.rotate(0.34 + wag * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 27 * sx, 10 * sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPattern(ctx, cfg, cx, cy, sx, sy) {
    ctx.save();
    bodyPath(ctx, cfg, cx, cy, sx, sy);
    ctx.clip();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = cfg.accent;
    ctx.fillStyle = cfg.accent;
    ctx.lineWidth = 7 * sx;
    if (cfg.pattern === "stripe" || cfg.pattern === "flame" || cfg.pattern === "smoke") {
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 24 * sx, cy - 55 * sy);
        ctx.quadraticCurveTo(cx + i * 28 * sx, cy, cx + i * 23 * sx, cy + 55 * sy);
        ctx.stroke();
      }
    } else if (cfg.pattern === "spots" || cfg.pattern === "crystal") {
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        ctx.arc(cx - 45 * sx + (i * 17) % 92 * sx, cy - 31 * sy + (i * 29) % 63 * sy, (3 + i % 3) * sx, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cfg.pattern === "scales" || cfg.pattern === "circuit") {
      for (let row = -2; row <= 2; row += 1) {
        for (let col = -2; col <= 2; col += 1) {
          ctx.beginPath();
          ctx.arc(cx + col * 27 * sx, cy + row * 22 * sy, 10 * sx, -0.7, 1.7);
          ctx.stroke();
        }
      }
    } else if (cfg.pattern === "stars" || cfg.pattern === "moon" || cfg.pattern === "aurora" || cfg.pattern === "genesis") {
      for (let i = 0; i < 7; i += 1) {
        const x = cx - 48 * sx + (i * 37) % 96 * sx;
        const y = cy - 32 * sy + (i * 23) % 64 * sy;
        ctx.beginPath();
        ctx.arc(x, y, (2 + i % 2) * sx, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cfg.pattern === "magma" || cfg.pattern === "gravity" || cfg.pattern === "spectrum" || cfg.pattern === "glow") {
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(cx - 42 * sx + i * 22 * sx, cy + Math.sin(i * 1.7) * 20 * sy, (4 + i % 2) * sx, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawEye(ctx, cfg, x, y, scale, blink = 0) {
    const radius = 19.5 * scale * cfg.eyeScale;
    const squash = Math.max(0.28, 1 - blink * 0.7);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, squash);
    ctx.fillStyle = "#f7ffff";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cfg.iris;
    ctx.beginPath();
    ctx.arc(radius * 0.17, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07101c";
    ctx.beginPath();
    ctx.arc(radius * 0.25, 0, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(radius * 0.02, -radius * 0.24, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFace(ctx, cfg, cx, cy, sx, sy, row, frame) {
    const headX = cfg.shape === "ray" ? cx + 45 * sx : cfg.shape === "eel" ? cx + 58 * sx : cx + 35 * sx;
    const eyeY = cfg.shape === "seahorse" ? cy - 45 * sy : cy - 12 * sy;
    const blink = row === 1 && frame === 3 ? 1 : 0;
    drawEye(ctx, cfg, headX, eyeY, sx, blink);
    ctx.strokeStyle = colorMix(cfg.body, "#07101c", 0.58);
    ctx.lineWidth = Math.max(2, 3.2 * sx);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(headX + 8 * sx, cy + 18 * sy, 15 * sx, 0.2, Math.PI - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headX + 22 * sx, cy + 7 * sy);
    ctx.lineTo(headX + 27 * sx, cy + 3 * sy);
    ctx.stroke();
  }

  function drawCell(ctx, cfg, frame, row) {
    const phase = (frame / COLS) * Math.PI * 2;
    const wag = Math.sin(phase) * (row === 0 ? 0.18 : 0.28);
    const sx = 1 + Math.cos(phase) * 0.025;
    const sy = 1 - Math.cos(phase) * 0.018;
    const cx = 126;
    const cy = 130 + Math.sin(phase) * 3;
    ctx.save();
    ctx.globalAlpha = row === 1 ? 0.96 : 1;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 15;
    drawTail(ctx, cfg, cx, cy, sx, sy, wag);
    drawFins(ctx, cfg, cx, cy, sx, sy, wag);
    const gradient = ctx.createLinearGradient(cx, cy - 60 * sy, cx, cy + 60 * sy);
    gradient.addColorStop(0, cfg.body);
    gradient.addColorStop(0.58, colorMix(cfg.body, cfg.belly, 0.28));
    gradient.addColorStop(1, cfg.belly);
    ctx.fillStyle = gradient;
    bodyPath(ctx, cfg, cx, cy, sx, sy);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawPattern(ctx, cfg, cx, cy, sx, sy);
    ctx.strokeStyle = colorMix(cfg.body, "#06121d", 0.52);
    ctx.lineWidth = 2.2;
    bodyPath(ctx, cfg, cx, cy, sx, sy);
    ctx.stroke();
    drawFace(ctx, cfg, cx, cy, sx, sy, row, frame);
    ctx.restore();
  }

  function createSheet(speciesId) {
    const cfg = CONFIGS[speciesId] || FALLBACK;
    const canvas = document.createElement("canvas");
    canvas.width = CELL * COLS;
    canvas.height = CELL * ROWS;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row += 1) {
      for (let frame = 0; frame < COLS; frame += 1) {
        ctx.save();
        ctx.translate(frame * CELL, row * CELL);
        ctx.beginPath();
        ctx.rect(0, 0, CELL, CELL);
        ctx.clip();
        drawCell(ctx, cfg, frame, row);
        ctx.restore();
      }
    }
    return canvas;
  }

  function getSheet(speciesId) {
    if (!speciesId) return null;
    if (overrides[speciesId]) return overrides[speciesId];
    if (!CONFIGS[speciesId]) return null;
    if (!cache.has(speciesId)) cache.set(speciesId, createSheet(speciesId));
    return cache.get(speciesId);
  }

  function invalidate(speciesId) {
    if (speciesId) cache.delete(speciesId);
    else cache.clear();
  }

  function registerOverride(speciesId, source) {
    if (!speciesId || !source) return null;
    overrides[speciesId] = source;
    cache.delete(speciesId);
    return source;
  }

  function getFootprint(speciesId) {
    const cfg = CONFIGS[speciesId] || FALLBACK;
    if (cfg.shape === "long" || cfg.shape === "eel") return [1.75, 0.72];
    if (cfg.shape === "whale") return [1.9, 0.95];
    if (cfg.shape === "ray") return [1.62, 0.94];
    if (cfg.shape === "jelly") return [1.18, 1.2];
    if (cfg.shape === "squid") return [1.3, 1.1];
    if (cfg.shape === "round" || cfg.shape === "puffer") return [1.36, 1.02];
    return [1.55, 0.9];
  }

  window.TideFishArt = {
    getSheet,
    invalidate,
    registerOverride,
    getFootprint,
    hasSpecies: (speciesId) => Boolean(CONFIGS[speciesId]),
    configs: CONFIGS
  };
})();