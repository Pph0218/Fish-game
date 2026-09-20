(() => {
  "use strict";
  const source = window.TIDE_SPRITE_DATA || {};
  const customSources = window.TIDE_CUSTOM_FISH_ASSETS || {};
  const textures = {};
  const fallbackCache = {};
  const loading = {};
  const keys = ["slim", "dart", "round", "bream", "puffer", "angel", "pike", "tuna", "ray", "shark", "seahorse", "eel", "jelly", "squid", "angler", "whale"];

  function configureTexture(texture) {
    if (!texture) return texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  function makeFallback(key, color) {
    if (fallbackCache[key]) return fallbackCache[key];
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = color || "#8cecf5";
    ctx.beginPath();
    ctx.ellipse(68, 32, 34, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(35, 32);
    ctx.lineTo(10, 14);
    ctx.lineTo(16, 32);
    ctx.lineTo(10, 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#071525";
    ctx.beginPath();
    ctx.arc(84, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    fallbackCache[key] = configureTexture(new THREE.CanvasTexture(canvas));
    return fallbackCache[key];
  }

  async function ensure(requiredKeys = keys, loader = null) {
    const list = Array.from(new Set((Array.isArray(requiredKeys) ? requiredKeys : [requiredKeys]).filter(Boolean)));
    const textureLoader = loader || new THREE.TextureLoader();
    await Promise.all(list.map((key) => {
      if (textures[key]) return Promise.resolve(textures[key]);
      if (loading[key]) return loading[key];
      loading[key] = (async () => {
        const data = customSources[key] || source[key];
        if (data) {
          const texture = configureTexture(await textureLoader.loadAsync(data));
          textures[key] = texture;
          return texture;
        }
        const generated = window.TideFishArt?.getSheet?.(key);
        if (generated) {
          textures[key] = configureTexture(new THREE.CanvasTexture(generated));
          return textures[key];
        }
        throw new Error(`Missing sprite data: ${key}`);
      })().catch(() => {
        textures[key] = makeFallback(key, "#8cecf5");
        return textures[key];
      }).finally(() => {
        delete loading[key];
      });
      return loading[key];
    }));
    return textures;
  }

  function loadAll(loader) {
    return ensure(keys, loader);
  }

  async function ensureSpecies(entries = []) {
    const normalized = entries.map((entry) => typeof entry === "string" ? { assetKey: entry, fallbackKey: entry } : entry);
    await Promise.all(normalized.map(async (entry) => {
      if (!entry || !entry.assetKey) return;
      if (customSources[entry.assetKey] || window.TideFishArt?.hasSpecies?.(entry.assetKey)) {
        await ensure([entry.assetKey]);
        return;
      }
      await ensure([entry.fallbackKey || entry.assetKey]);
      textures[entry.assetKey] = textures[entry.fallbackKey || entry.assetKey] || makeFallback(entry.assetKey, "#8cecf5");
    }));
    return textures;
  }

  function create(key, color, assetKey = key) {
    const base = textures[assetKey] || textures[key] || makeFallback(key, color);
    const map = base.clone();
    map.repeat.set(.25, .5);
    map.offset.set(0, 0);
    map.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
      map,
      color: new THREE.Color(0xffffff),
      transparent: true,
      alphaTest: .07,
      depthWrite: false,
      toneMapped: false
    });
    const sprite = new THREE.Sprite(material);
    const footprint = window.TideFishArt?.getFootprint?.(assetKey) || [1.55, .9];
    sprite.scale.set(footprint[0], footprint[1], 1);
    sprite.userData.spriteKey = key;
    sprite.userData.baseSpriteX = footprint[0];
    sprite.userData.baseSpriteY = footprint[1];
    sprite.userData.frame = 0;
    return sprite;
  }

  function update(sprite, time, state = {}) {
    if (!sprite || !sprite.material || !sprite.material.map) return;
    const speed = Number(state.speed) || 1;
    const frameRate = state.lod === "far" ? 3.2 : state.lod === "mid" ? 5.2 : 7.5;
    const frame = Math.floor(time * speed * frameRate + (state.phase || 0) * 2) % 8;
    const row = state.mode === "turn" || state.mode === "fleeing" || state.mode === "captured" || state.mode === "caught" ? 1 : 0;
    sprite.userData.frame = frame;
    sprite.material.map.offset.set((frame % 4) * .25, row * .5);
    sprite.material.rotation = Math.sin(time * (1.3 + speed) + (state.phase || 0)) * (state.mode === "captured" ? .18 : .055);
    const direction = state.direction < 0 ? -1 : 1;
    sprite.scale.x = sprite.userData.baseSpriteX * direction;
    sprite.scale.y = sprite.userData.baseSpriteY;
  }

  async function replace(key, dataUrl, loader = null) {
    if (!key || !dataUrl) return null;
    const texture = configureTexture(await (loader || new THREE.TextureLoader()).loadAsync(dataUrl));
    textures[key] = texture;
    Object.keys(fallbackCache).forEach((cacheKey) => {
      if (cacheKey === key) delete fallbackCache[cacheKey];
    });
    return texture;
  }

  function getTexture(key) {
    return textures[key] || makeFallback(key, "#8cecf5");
  }

  function isReady() {
    return keys.some((key) => Boolean(textures[key]));
  }

  function loadedKeys() {
    return Object.keys(textures);
  }

  window.TideSpriteFish = { keys, customSources, ensure, ensureSpecies, preload: ensure, loadAll, create, update, replace, getTexture, isReady, loadedKeys };
})();