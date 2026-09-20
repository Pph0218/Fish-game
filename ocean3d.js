(() => {
  "use strict";
  const THREE = window.THREE;
  const GLTFLoader = THREE.GLTFLoader;

const canvas = document.getElementById("oceanCanvas");
const app = document.getElementById("app");
const MODEL_ROOT = "assets/fish/models/";
const MODEL_FILES = {
  boss_tetra: "boss_tetra.glb",
  boss_blobfish: "boss_blobfish.glb",
  boss_snake: "boss_snake.glb",
  boss_whale: "boss_whale.glb",
  boss_dragon: "boss_dragon.glb",
  boss_dragon_evolved: "boss_dragon_evolved.glb",
  boss_manta: "boss_manta.glb",
  boss_shark: "boss_shark.glb"
};
const SPECIES_MODELS = {
  silver_scad: ["slim", "#55c6d9"], sardine: ["dart", "#2d9ed8"], spotted_bream: ["round", "#35c899"], moon_carp: ["puffer", "#ffc84a"],
  red_snapper: ["angel", "#ef6a5e"], grouper: ["puffer", "#b6764f"], blue_spotted_ray: ["ray", "#4b91f7"], coral_dragon: ["seahorse", "#ef6a9a"],
  deep_cod: ["slim", "#6f95a7"], bluefin_tuna: ["dart", "#267fc8"], oarfish: ["eel", "#83a6c7"], lanternfish: ["angler", "#73d94e"],
  abyss_eel: ["eel", "#53649a"], black_sea_bream: ["bream", "#4e6078"], ghost_shark: ["shark", "#6d8eff"], starlight_whale: ["whale", "#9a74e8"],
  prism_guppy: ["slim", "#7debc6"], lagoon_pike: ["pike", "#8ad4ff"], neon_lionfish: ["puffer", "#ff9a62"], crystal_turtle: ["round", "#72e3ca"],
  gloom_sword: ["marlin", "#7ea8c8"], plasma_manta: ["ray", "#997eff"], nebula_eel: ["eel", "#825fff"], titan_whale: ["whale", "#78a7e8"],
  crystal_smelt: ["slim", "#a8f4ff"], aurora_cod: ["bream", "#71d8d1"], phosphor_ray: ["ray", "#70b9ff"], cobalt_marlin: ["marlin", "#3f91ff"], aurora_dragon_eel: ["eel", "#71f2cd"], sky_jelly: ["jelly", "#d7b8ff"],
  magma_bass: ["pike", "#e2774a"], blacksmoke_eel: ["eel", "#7b6787"], flame_marlin: ["marlin", "#ff8757"], ember_snapper: ["round", "#ff6745"], lava_goblin_shark: ["shark", "#c64d35"], primordial_whalefish: ["whale", "#ffb15c"],
  relic_damselfish: ["round", "#7dc6b8"], titanium_barracuda: ["dart", "#9fb4c9"], blue_steel_pomfret: ["bream", "#769fe5"], watcher_swordfish: ["marlin", "#5fb5e8"], mech_ghost_shark: ["shark", "#7f88b8"], abyss_core: ["squid", "#88ffe8"],
  stardust_sardine: ["slim", "#b7d0ff"], phantom_moon_ray: ["ray", "#b69cff"], void_tuna: ["dart", "#6f7dff"], gravity_oarfish: ["eel", "#c9b8ff"], void_whale: ["whale", "#728cff"], genesis_whale: ["whale", "#e8ddff"]
};const FISH_MODEL_ROOT = "assets/deepsea/downloads/";
const FISH_MODEL_FILES = {
  hq_bluegill: "animated-blue-gill.glb",
  hq_trout: "animated-trout.glb",
  hq_sailfish: "sailfish.glb",
  hq_clownfish: "cartoon-clownfish.glb",
  hq_tropical: "tropical-alien-fish.glb",
  hq_manta: "cartoon-manta-ray.glb",
  hq_angler: "cartoon-angler-fish.glb",
  hq_zorag: "zorag-mutant-angler.glb",
  hq_stingray: "stonewisp-mutant-stingray.glb",
  hq_stylizedray: "stylized-mutant-stingray.glb",
  hq_remora: "remora.glb",
  hq_mutantfish: "mutant-deep-sea-fish.glb",
  hq_jellyfish: "jellyfish.glb",
  hq_tuna: "tuna-fish.glb"
};
const HQ_SPECIES_MODELS = {
  silver_scad: ["hq_bluegill", .92], sardine: ["hq_trout", 1], spotted_bream: ["hq_clownfish", .88], moon_carp: ["hq_tropical", 1.02], prism_guppy: ["hq_bluegill", .82], lagoon_pike: ["hq_sailfish", .9],
  red_snapper: ["hq_tropical", .94], grouper: ["hq_angler", .88], blue_spotted_ray: ["hq_manta", .94], coral_dragon: ["hq_tropical", 1.06], neon_lionfish: ["hq_tropical", .9], crystal_turtle: ["hq_stylizedray", .82],
  deep_cod: ["hq_trout", .94], bluefin_tuna: ["hq_tuna", 1], oarfish: ["hq_remora", 1.08], lanternfish: ["hq_zorag", .82], gloom_sword: ["hq_sailfish", .96], plasma_manta: ["hq_manta", 1.02],
  abyss_eel: ["hq_remora", 1.06], black_sea_bream: ["hq_bluegill", .94], ghost_shark: ["hq_zorag", .9], starlight_whale: ["hq_mutantfish", 1.02], nebula_eel: ["hq_stingray", 1.02], titan_whale: ["hq_mutantfish", 1.1],
  crystal_smelt: ["hq_bluegill", .9], aurora_cod: ["hq_trout", .96], phosphor_ray: ["hq_manta", .98], cobalt_marlin: ["hq_sailfish", 1.02], aurora_dragon_eel: ["hq_remora", 1.05], sky_jelly: ["hq_jellyfish", 1.05],
  magma_bass: ["hq_tropical", .96], blacksmoke_eel: ["hq_remora", 1.04], flame_marlin: ["hq_sailfish", 1.02], ember_snapper: ["hq_bluegill", .96], lava_goblin_shark: ["hq_zorag", .96], primordial_whalefish: ["hq_mutantfish", 1.08],
  relic_damselfish: ["hq_clownfish", .92], titanium_barracuda: ["hq_sailfish", 1.02], blue_steel_pomfret: ["hq_tuna", .96], watcher_swordfish: ["hq_sailfish", 1.06], mech_ghost_shark: ["hq_zorag", 1], abyss_core: ["hq_mutantfish", 1.02],
  stardust_sardine: ["hq_trout", .92], phantom_moon_ray: ["hq_manta", 1.02], void_tuna: ["hq_tuna", 1.04], gravity_oarfish: ["hq_remora", 1.08], void_whale: ["hq_mutantfish", 1.1], genesis_whale: ["hq_mutantfish", 1.16]
};const ZONE_FISH_IDS = {
  shallow: ["silver_scad", "sardine", "spotted_bream", "moon_carp", "prism_guppy", "lagoon_pike"],
  reef: ["red_snapper", "grouper", "blue_spotted_ray", "coral_dragon", "neon_lionfish", "crystal_turtle"],
  deep: ["deep_cod", "bluefin_tuna", "oarfish", "lanternfish", "gloom_sword", "plasma_manta"],
  abyss: ["abyss_eel", "black_sea_bream", "ghost_shark", "starlight_whale", "nebula_eel", "titan_whale"],
  aurora: ["crystal_smelt", "aurora_cod", "phosphor_ray", "cobalt_marlin", "aurora_dragon_eel", "sky_jelly"],
  rift: ["magma_bass", "blacksmoke_eel", "flame_marlin", "ember_snapper", "lava_goblin_shark", "primordial_whalefish"],
  city: ["relic_damselfish", "titanium_barracuda", "blue_steel_pomfret", "watcher_swordfish", "mech_ghost_shark", "abyss_core"],
  void: ["stardust_sardine", "phantom_moon_ray", "void_tuna", "gravity_oarfish", "void_whale", "genesis_whale"]
};
const ZONE_PALETTE = {
  shallow: { bg: 0x03182a, fog: 0x06263d, top: 0x0b4966, bottom: 0x020b18, light: 0x9addea, accent: 0x2ed6e8 },
  reef: { bg: 0x04182e, fog: 0x082b47, top: 0x10536e, bottom: 0x020a1a, light: 0x8dd7e5, accent: 0x4fc5e8 },
  deep: { bg: 0x03132c, fog: 0x071f3d, top: 0x12315a, bottom: 0x010714, light: 0x83b8de, accent: 0x668cff },
  abyss: { bg: 0x010712, fog: 0x040c1d, top: 0x171a44, bottom: 0x00030a, light: 0xa9a1ed, accent: 0x9d70ff },
  aurora: { bg: 0x041329, fog: 0x072b48, top: 0x176b82, bottom: 0x031126, light: 0xb9fff5, accent: 0x5fffe0 },
  rift: { bg: 0x1b0b18, fog: 0x301425, top: 0x743645, bottom: 0x10050d, light: 0xffbd8d, accent: 0xff754d },
  city: { bg: 0x050d21, fog: 0x0b1836, top: 0x243d68, bottom: 0x020613, light: 0xb4d7ff, accent: 0x6d8dff },
  void: { bg: 0x070318, fog: 0x170a38, top: 0x3d2873, bottom: 0x03020b, light: 0xe7dcff, accent: 0xbc75ff }
};

const BOSS_VISUAL_PROFILES = {
  shallow: { model: "boss_tetra", scale: 1.72, color: 0xffa15e, accent: 0x9ff5ff, motion: "tail", amplitude: 0.075, speed: 1.15, weakpoint: [0.54, 0.08, 0.36] },
  reef: { model: "boss_blobfish", scale: 1.86, color: 0x54e1c8, accent: 0xffcf8a, motion: "pulse", amplitude: 0.055, speed: 0.78, weakpoint: [0.48, 0.12, 0.34] },
  deep: { model: "boss_snake", scale: 1.78, color: 0x9ec8ff, accent: 0x70f0dd, motion: "serpent", amplitude: 0.095, speed: 1.05, weakpoint: [0.62, 0.03, 0.30] },
  abyss: { model: "boss_whale", scale: 2.08, color: 0x91c8ff, accent: 0x9f7dff, motion: "tail", amplitude: 0.085, speed: 0.72, weakpoint: [0.58, 0.10, 0.30] },
  aurora: { model: "boss_dragon", scale: 1.82, color: 0x6ff0d0, accent: 0x87a8ff, motion: "flap", amplitude: 0.105, speed: 1.12, weakpoint: [0.48, 0.12, 0.30] },
  rift: { model: "boss_dragon_evolved", scale: 1.88, color: 0xff744d, accent: 0xffc15e, motion: "flap", amplitude: 0.095, speed: 1.00, weakpoint: [0.48, 0.12, 0.30] },
  city: { model: "boss_manta", scale: 1.82, color: 0x8593ff, accent: 0x6ff4ff, motion: "flap", amplitude: 0.125, speed: 0.90, weakpoint: [0.42, 0.10, 0.26] },
  void: { model: "boss_shark", scale: 1.96, color: 0xc278ff, accent: 0xff8ad8, motion: "tail", amplitude: 0.090, speed: 0.82, weakpoint: [0.58, 0.10, 0.30] }
};
let renderer;
let scene;
let camera;
let clock;
let water;
let seabed;
let particles;
let school = [];
let models = {};
let modelAnimations = {};
const modelLoads = new Map();
let fishMixers = new Set();
let ready = false;
let paused = false;
let currentZone = window.TideGameState && window.TideGameState.zone || "shallow";
let currentPalette = ZONE_PALETTE[currentZone];
let quality = "high";
let castState = null;
let impactPulse = 0;
let lights;
let rngState = 0x4f1bbcdc;
let sonarVisuals = [];
let sonarPing = null;
let bossVisual = null;
let zoneLandmarks = null;
let fishLodQuality = "high";
let fishDensityTarget = 0;
let lastSchoolValidation = 0;
let ecologyVisualState = null;
let gearAura = null;
let bossPhaseState = null;
let environmentGroup = null;
let environmentBeams = [];
let distantShadows = [];
let causticMesh = null;
let surfaceHighlights = null;
let renderAnimationFrame = null;
const cameraParallax = new THREE.Vector2(0, 0);
const cameraParallaxTarget = new THREE.Vector2(0, 0);
function rand() {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  return rngState / 4294967296;
}
const pointerWorld = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pendingCalls = [];

function apiCall(name, args = []) {
  if (!ready) {
    pendingCalls.push([name, args]);
    return false;
  }
  if (typeof api[name] !== "function") return false;
  api[name](...args);
  return true;
}

function createFallbackFish(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 22, 14),
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0.04, clearcoat: 1 })
  );
  body.scale.set(1.55, 0.82, 0.7);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.72, 4),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).offsetHSL(0.02, 0.12, 0.04), roughness: 0.32, clearcoat: 0.8 })
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -1.05;
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x173145 });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 8), eyeMaterial);
  eye.position.set(0.58, 0.16, 0.48);
  group.add(body, tail, eye);
  group.userData.tail = tail;
  return group;
}

function createProceduralFish(modelKey, color) {
  const group = new THREE.Group();
  const base = new THREE.Color(color);
  const skin = new THREE.MeshPhysicalMaterial({ color: base, roughness: .26, metalness: .05, clearcoat: .9, clearcoatRoughness: .18 });
  const accent = new THREE.MeshBasicMaterial({ color: base.clone().offsetHSL(.02, .06, .12), side: THREE.DoubleSide, toneMapped: false });
  const dark = new THREE.MeshBasicMaterial({ color: 0x07101e, toneMapped: false });
  const white = new THREE.MeshBasicMaterial({ color: 0xf5ffff, toneMapped: false });
  const eyes = [];
  const fins = [];
  const addEye = (x, y, z, scale = 1) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.13 * scale, 12, 8), white);
    eye.position.set(x, y, z);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.075 * scale, 10, 7), new THREE.MeshBasicMaterial({ color: 0x7cecff, toneMapped: false }));
    iris.position.set(x + .05 * scale, y, z);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.036 * scale, 8, 6), dark);
    pupil.position.set(x + .085 * scale, y, z);
    group.add(eye, iris, pupil); eyes.push(eye, iris, pupil);
  };
  const addFin = (geometry, position, rotation, scale = 1) => {
    const fin = new THREE.Mesh(geometry, accent);
    fin.position.copy(position); fin.rotation.set(...rotation); fin.scale.setScalar(scale);
    group.add(fin); fins.push(fin); return fin;
  };
  if (modelKey === "eel") {
    const segments = [];
    for (let i = 0; i < 6; i += 1) {
      const segment = new THREE.Mesh(new THREE.SphereGeometry(.3 - i * .018, 14, 10), skin);
      segment.scale.set(1.35, .72, .76); segment.position.set(.9 - i * .55, Math.sin(i) * .08, 0); group.add(segment); segments.push(segment);
    }
    addFin(new THREE.ConeGeometry(.24, .66, 3), new THREE.Vector3(-2.35, 0, 0), [0, 0, Math.PI / 2], 1.1);
    addEye(.95, .1, .25, .72); addEye(.95, .1, -.25, .72);
    group.userData.segments = segments;
  } else if (modelKey === "ray") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.68, 22, 12), skin); body.scale.set(1.55, .22, 1.0); group.add(body);
    const leftWing = addFin(new THREE.ConeGeometry(.42, 1.9, 4), new THREE.Vector3(0, 0, .68), [1.15, 0, -.12], 1.05);
    const rightWing = addFin(new THREE.ConeGeometry(.42, 1.9, 4), new THREE.Vector3(0, 0, -.68), [-1.15, 0, .12], 1.05);
    addFin(new THREE.ConeGeometry(.16, 1.5, 4), new THREE.Vector3(-1.45, 0, 0), [0, 0, Math.PI / 2], .8);
    addEye(.6, .1, .25, 1.05); addEye(.6, .1, -.25, 1.05);
    group.userData.wings = [leftWing, rightWing]; group.userData.body = body;
  } else if (modelKey === "jelly") {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin); dome.scale.y = .8; group.add(dome);
    for (let i = 0; i < 6; i += 1) {
      const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .08, 1.8 + (i % 2) * .4, 8), accent);
      tentacle.position.set(-.42 + i * .16, -1.0, (i % 2 ? .18 : -.18)); tentacle.rotation.z = (i - 2.5) * .08; group.add(tentacle); fins.push(tentacle);
    }
    addEye(.42, .28, .34, 1.15); addEye(.42, .28, -.34, 1.15); group.userData.dome = dome;
  } else if (modelKey === "squid") {
    const body = new THREE.Mesh(new THREE.ConeGeometry(.6, 2.25, 18), skin); body.rotation.z = Math.PI / 2; body.position.x = -.2; group.add(body);
    for (let i = 0; i < 8; i += 1) {
      const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .1, 1.45 + (i % 3) * .2, 7), accent);
      tentacle.position.set(-1.5, -.18 + (i % 4) * .12, -.18 + (i > 3 ? .32 : 0)); tentacle.rotation.z = Math.PI / 2 + (i % 2 ? .16 : -.16); group.add(tentacle); fins.push(tentacle);
    }
    addEye(.72, .1, .3, 1.25); addEye(.72, .1, -.3, 1.25); group.userData.body = body;
  } else if (modelKey === "marlin") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.56, 20, 12), skin); body.scale.set(1.9, .62, .66); group.add(body);
    const bill = new THREE.Mesh(new THREE.ConeGeometry(.12, 1.8, 10), skin); bill.position.x = 1.55; bill.rotation.z = -Math.PI / 2; group.add(bill);
    addFin(new THREE.ConeGeometry(.22, .75, 3), new THREE.Vector3(-1.25, 0, 0), [0, 0, Math.PI / 2], 1.2);
    addFin(new THREE.ConeGeometry(.16, .58, 3), new THREE.Vector3(-.1, .48, 0), [0, 0, -.18], 1.1);
    addEye(.78, .16, .26, .85); addEye(.78, .16, -.26, .85); group.userData.body = body;
  } else if (modelKey === "piranha") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.68, 18, 12), skin); body.scale.set(1.2, .96, .78); group.add(body);
    const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(.34, .55, 4), dark); lowerJaw.position.set(.72, -.18, 0); lowerJaw.rotation.z = Math.PI / 2; group.add(lowerJaw);
    addFin(new THREE.ConeGeometry(.25, .68, 3), new THREE.Vector3(-1.0, 0, 0), [0, 0, Math.PI / 2], 1.1);
    addEye(.5, .25, .28, 1.1); addEye(.5, .25, -.28, 1.1); group.userData.body = body; group.userData.jaw = lowerJaw;
  } else if (modelKey === "seahorse") {
    const body = new THREE.Mesh((typeof THREE.CapsuleGeometry === "function" ? new THREE.CapsuleGeometry(.36, 1.1, 8, 12) : new THREE.CylinderGeometry(.34, .42, 1.65, 14)), skin);
    body.rotation.z = -.35; group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 10), skin); head.position.set(.48, .75, 0); group.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(.13, .72, 8), skin); snout.position.set(1.0, .67, 0); snout.rotation.z = -Math.PI / 2; group.add(snout);
    addFin(new THREE.ConeGeometry(.18, .62, 3), new THREE.Vector3(-.36, .55, 0), [0, 0, -.35], 1.0);
    addEye(.65, .88, .22, .82); addEye(.65, .88, -.22, .82); group.userData.body = body;
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 14), skin); body.scale.set(2.15, .78, .88); group.add(body);
    addFin(new THREE.ConeGeometry(.42, 1.28, 4), new THREE.Vector3(-2.0, 0, 0), [0, 0, Math.PI / 2], 1.3);
    addFin(new THREE.ConeGeometry(.26, .82, 3), new THREE.Vector3(-.2, .7, 0), [0, 0, -.12], 1.2);
    addFin(new THREE.ConeGeometry(.18, .62, 3), new THREE.Vector3(.1, -.3, .58), [.8, 0, -.3], .9);
    addEye(1.25, .18, .48, 1.4); addEye(1.25, .18, -.48, 1.4); group.userData.body = body;
  }
  group.userData.proceduralType = modelKey;
  group.userData.extraFins = fins;
  group.userData.eyes = eyes;
  return group;
}
function normalizeModel(source) {
  const root = source.clone(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  root.scale.multiplyScalar(1 / longest);
  if (size.z > size.x * 1.1) root.rotation.y = Math.PI / 2;
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
  });
  return root;
}

function tuneMaterial(root, color) {
  const candy = new THREE.Color(color);
  root.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const next = materials.map((material) => {
      const result = new THREE.MeshPhysicalMaterial({
        color: candy.clone(),
        roughness: .28,
        metalness: .035,
        clearcoat: 1,
        clearcoatRoughness: .2,
        side: material && material.side !== undefined ? material.side : THREE.DoubleSide,
        toneMapped: false
      });
      if (material && material.transparent) {
        result.transparent = true;
        result.opacity = material.opacity;
      }
      return result;
    });
    child.material = Array.isArray(child.material) ? next : next[0];
  });
}

function addFishFeatures(root, color, scale = 1) {
  const finMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).offsetHSL(0, 0.05, 0.08), side: THREE.DoubleSide, toneMapped: false });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xf4ffff, toneMapped: false });
  const irisMaterial = new THREE.MeshBasicMaterial({ color: 0x79efff, toneMapped: false });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x07101e, toneMapped: false });
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.19 * scale, 0.52 * scale, 3), finMaterial);
  dorsal.position.set(-0.1, 0.48 * scale, 0);
  dorsal.rotation.z = -0.18;
  const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.24 * scale, 0.55 * scale, 3), finMaterial);
  tailFin.position.set(-1.12 * scale, 0, 0);
  tailFin.rotation.z = Math.PI / 2;
  const leftFin = new THREE.Mesh(new THREE.ConeGeometry(0.13 * scale, 0.38 * scale, 3), finMaterial);
  leftFin.position.set(-0.18, -0.1 * scale, 0.31 * scale);
  leftFin.rotation.set(0.78, 0, -0.42);
  const rightFin = leftFin.clone();
  rightFin.position.z *= -1;
  rightFin.rotation.x *= -1;
  const eyeGeometry = new THREE.SphereGeometry(0.115 * scale, 14, 10);
  const irisGeometry = new THREE.SphereGeometry(0.068 * scale, 12, 8);
  const pupilGeometry = new THREE.SphereGeometry(0.035 * scale, 10, 7);
  const eyes = [];
  [0.19 * scale, -0.19 * scale].forEach((z) => {
    const white = new THREE.Mesh(eyeGeometry, eyeWhite);
    white.position.set(0.46 * scale, 0.12 * scale, z);
    const iris = new THREE.Mesh(irisGeometry, irisMaterial);
    iris.position.set(0.54 * scale, 0.12 * scale, z);
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.set(0.575 * scale, 0.12 * scale, z);
    eyes.push(white, iris, pupil);
  });
  root.add(dorsal, tailFin, leftFin, rightFin, ...eyes);
  root.userData.extraFins = [dorsal, tailFin, leftFin, rightFin];
  root.userData.eyes = eyes;
}


function zoneSpriteEntries(zoneId) {
  const ids = ZONE_FISH_IDS[zoneId] || ZONE_FISH_IDS.shallow;
  return ids.map((id) => ({ assetKey: id, fallbackKey: (SPECIES_MODELS[id] || ["dart"])[0] }));
}
function ensureZoneSprites(zoneId) {
  const spriteApi = window.TideSpriteFish;
  if (!spriteApi || typeof spriteApi.ensureSpecies !== "function") return Promise.resolve();
  return spriteApi.ensureSpecies(zoneSpriteEntries(zoneId)).catch((error) => {
    console.warn("Sprite fish preload failed", error);
  });
}
function scheduleSpritePreload() {
  const spriteApi = window.TideSpriteFish;
  if (!spriteApi || typeof spriteApi.ensureSpecies !== "function") return;
  const zoneKeys = Object.keys(ZONE_FISH_IDS);
  const currentIndex = Math.max(0, zoneKeys.indexOf(currentZone));
  const nextZone = zoneKeys[(currentIndex + 1) % zoneKeys.length];
  const preload = () => ensureZoneSprites(nextZone);
  const idle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1800));
  idle(preload, { timeout: 6000 });
}

function updateFishRenderOrder(fish) {
  const sprite = fish.userData.sprite;
  if (!sprite) return;
  sprite.renderOrder = 40 + Math.round((fish.position.z + 8) * 60) + (fish.userData.depthTie || 0);
}

function placeFishInLane(fish, lane) {
  const data = fish.userData;
  const safeLane = Math.max(0, Math.min(7, Number(lane) || 0));
  data.lane = safeLane;
  data.baseX = -14 + safeLane * 4 + (rand() - 0.5) * 1.8;
  data.baseY = -4.2 + rand() * 9.2;
  fish.position.x = data.baseX;
  fish.position.y = data.baseY;
  fish.position.z = -4.6 + rand() * 7.2 + (data.depthTie || 0);
  data.motionCheck = null;
  updateFishRenderOrder(fish);
}

const hqFishTemplates = new Map();

function freezeFishModel(source, color) {
  const root = new THREE.Group();
  const tint = new THREE.Color(color || "#8cecf5");
  source.updateMatrixWorld(true);
  source.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);
    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const materials = sourceMaterials.filter(Boolean).map((material) => {
      const next = material.clone();
      if (next.color) next.color.lerp(tint, 0.12);
      if ("roughness" in next) next.roughness = Math.min(0.55, Math.max(0.26, Number(next.roughness) || 0.42));
      if ("metalness" in next) next.metalness = Math.min(0.18, Number(next.metalness) || 0);
      next.side = THREE.DoubleSide;
      next.toneMapped = false;
      return next;
    });
    const mesh = new THREE.Mesh(geometry, Array.isArray(child.material) ? materials : materials[0]);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
  });
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.scale.setScalar(1 / longest);
  if (size.z > size.x * 1.08) wrapper.rotation.y = Math.PI / 2;
  wrapper.userData.fishModelFrozen = true;
  return wrapper;
}

function createHighQualityFish(speciesId) {
  const entry = HQ_SPECIES_MODELS[speciesId];
  if (!entry || !models[entry[0]]) return null;
  let template = hqFishTemplates.get(speciesId);
  if (!template) {
    const [modelKey, color] = SPECIES_MODELS[speciesId] || ["dart", "#9de8f4"];
    template = freezeFishModel(models[entry[0]], color);
    template.userData.modelKey = modelKey;
    hqFishTemplates.set(speciesId, template);
  }
  const root = template.clone(true);
  const group = new THREE.Group();
  group.add(root);
  group.userData.speciesId = speciesId;
  group.userData.model = root;
  group.userData.sprite = null;
  group.userData.hqModel = true;
  group.userData.color = new THREE.Color((SPECIES_MODELS[speciesId] || ["dart", "#9de8f4"])[1]);
  group.userData.phase = rand() * Math.PI * 2;
  group.userData.speed = 0.34 + rand() * 0.34;
  group.userData.baseScale = (0.72 + rand() * 0.42) * Number(entry[1] || 1) * 1.55;
  group.userData.baseY = 0;
  group.userData.route = "horizontal";
  group.userData.mode = "schooling";
  group.scale.setScalar(group.userData.baseScale);
  return group;
}

function shouldUseHighQualityFishModels() {
  return !window.TIDE_FORCE_SPRITES && quality !== "low" && window.innerWidth >= 760 && !navigator.connection?.saveData;
}

function ensureZoneFishModels(zoneId) {
  if (!shouldUseHighQualityFishModels()) return Promise.resolve();
  const ids = ZONE_FISH_IDS[zoneId] || ZONE_FISH_IDS.shallow;
  const keys = Array.from(new Set(ids.map((id) => HQ_SPECIES_MODELS[id]?.[0]).filter(Boolean)));
  return Promise.all(keys.map((key) => ensureModelAsset(key))).catch((error) => {
    console.warn("High-quality fish preload failed", error);
  });
}
function createSpriteFish(speciesId) {
  const [modelKey, color] = SPECIES_MODELS[speciesId] || ["dart", "#9de8f4"];
  const group = new THREE.Group();
  const sprite = window.TideSpriteFish?.create(modelKey, color, speciesId) || null;
  if (sprite) group.add(sprite);
  group.userData.speciesId = speciesId;
  group.userData.sprite = sprite;
  group.userData.model = null;
  group.userData.color = new THREE.Color(color);
  group.userData.phase = rand() * Math.PI * 2;
  group.userData.speed = 0.45 + rand() * 0.45;
  group.userData.baseScale = 0.82 + rand() * 0.72;
  group.userData.baseY = 0;
  group.userData.route = "horizontal";
  group.userData.mode = "schooling";
  group.scale.setScalar(group.userData.baseScale);
  return group;
}
function createFish(speciesId) {
  const [modelKey, color] = SPECIES_MODELS[speciesId] || ["dart", "#9de8f4"];
  const source = models[modelKey];
  const root = source ? normalizeModel(source) : createProceduralFish(modelKey, color);
  tuneMaterial(root, color);
  if (source) addFishFeatures(root, color, speciesId.includes("whale") ? 1.25 : 0.86);
  const group = new THREE.Group();
  group.add(root);
  group.userData.speciesId = speciesId;
  group.userData.model = root;
  const clips = modelAnimations[modelKey] || [];
  if (source && clips.length) {
    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(clips[0]);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    group.userData.mixer = mixer;
    fishMixers.add(mixer);
  }
  group.userData.color = new THREE.Color(color);
  group.userData.baseY = 0;
  group.userData.phase = rand() * Math.PI * 2;
  group.userData.speed = 0.45 + rand() * 0.45;
  group.userData.depth = -10 + rand() * 8;
  const modelScale = { whale: 1.35, ray: 1.08, jelly: 1.0, squid: 1.08, seahorse: .82, eel: .94, marlin: 1.12, piranha: .88, angler: 1.0, shark: 1.08, puffer: .9, bream: .94, round: .9, dart: .96, slim: .94 }[modelKey] || 1;
  group.scale.setScalar((0.62 + rand() * 0.75) * modelScale);
  group.userData.baseScale = group.scale.x;
  return group;
}

function placeFishSchool() {
  school.forEach((fish) => scene.remove(fish));
  school = [];
  const zoneIds = ZONE_FISH_IDS[currentZone] || ZONE_FISH_IDS.shallow;
  const hqReady = shouldUseHighQualityFishModels() && zoneIds.every((id) => Boolean(models[HQ_SPECIES_MODELS[id]?.[0]]));
  const count = hqReady ? Math.min(fishDensityTarget || 36, quality === "high" ? 36 : 24) : (fishDensityTarget || (quality === "high" ? 64 : 36));
  const laneCount = 8;
  const perLane = Math.ceil(count / laneCount);
  for (let i = 0; i < count; i += 1) {
    const id = zoneIds[i % zoneIds.length];
    const fish = (hqReady ? createHighQualityFish(id) : null) || createSpriteFish(id);
    const data = fish.userData;
    const lane = i % laneCount;
    const slot = Math.floor(i / laneCount);
    data.lane = lane;
    data.depthTie = (i % 64) * 0.0025;
    data.direction = rand() > 0.5 ? 1 : -1;
    data.phase = rand() * Math.PI * 2;
    data.speed = 0.42 + rand() * 0.46;
    data.route = i % 13 === 0 ? "vertical" : "horizontal";
    fish.position.x = -14 + lane * 4 + (slot - (perLane - 1) / 2) * 0.78 + (rand() - 0.5) * 0.35;
    fish.position.y = -4.2 + (slot % 5) * 2.15 + (rand() - 0.5) * 0.5;
    fish.position.z = -4.6 + rand() * 7.2 + data.depthTie;
    data.baseX = fish.position.x;
    data.baseY = fish.position.y;
    updateFishRenderOrder(fish);
    school.push(fish);
    scene.add(fish);
  }
}

function createWater() {
  const geometry = new THREE.PlaneGeometry(120, 80, 72, 28);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(currentPalette.top) },
      uBottom: { value: new THREE.Color(currentPalette.bottom) },
      uAccent: { value: new THREE.Color(currentPalette.accent) }
    },
    vertexShader: `varying vec2 vUv; varying float vWave; varying float vCrest; uniform float uTime; void main(){ vUv=uv; vec3 p=position; float wave=sin(p.x*.19+uTime*1.45)*.16+cos(p.y*.17-uTime*1.08)*.11+sin((p.x+p.y)*.11+uTime*.72)*.05; p.z+=wave; vWave=wave; vCrest=smoothstep(.15,.25,wave); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying vec2 vUv; varying float vWave; varying float vCrest; uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uAccent; void main(){ float a=.14+vWave*.20; vec3 c=mix(uBottom,uTop,vUv.y*.8); c+=uAccent*vCrest*.24; gl_FragColor=vec4(c,a); }`
  });
  water = new THREE.Mesh(geometry, material);
  water.position.set(0, 0.3, -13);
  scene.add(water);
}

function createSeabed() {
  const geometry = new THREE.PlaneGeometry(80, 60, 32, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const ridge = Math.sin(x * .24) * .45 + Math.cos(y * .31) * .35 + Math.sin((x + y) * .11) * .28;
    positions.setZ(i, ridge);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0x31596b, roughness: .96, metalness: .02, flatShading: true });
  seabed = new THREE.Mesh(geometry, material);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.set(0, -8, -10);
  seabed.receiveShadow = true;
  scene.add(seabed);

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x406f83, roughness: 0.84, flatShading: true });
  for (let i = 0; i < 18; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + rand() * 1.8, 0), rockMaterial);
    rock.position.set(-18 + rand() * 36, -7.2, -18 + rand() * 14);
    rock.rotation.set(rand(), rand(), rand());
    rock.scale.y = 0.45 + rand() * 0.7;
    scene.add(rock);
  }
}

function clearZoneLandmarks() {
  if (!zoneLandmarks) return;
  zoneLandmarks.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
  scene.remove(zoneLandmarks);
  zoneLandmarks = null;
}

function createZoneLandmarks(zoneId) {
  clearZoneLandmarks();
  const group = new THREE.Group();
  const accent = new THREE.MeshBasicMaterial({ color: currentPalette.accent, transparent: true, opacity: .46, toneMapped: false });
  const dark = new THREE.MeshBasicMaterial({ color: 0x061124, transparent: true, opacity: .76, toneMapped: false });
  const glass = new THREE.MeshBasicMaterial({ color: currentPalette.light, transparent: true, opacity: .22, toneMapped: false, side: THREE.DoubleSide });
  const elements = [];

  if (zoneId === "shallow") {
    [-13, 0, 13].forEach((x, index) => {
      const buoy = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 2.2, 10), accent);
      post.position.y = .8;
      const float = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), new THREE.MeshBasicMaterial({ color: index === 1 ? 0xffc65f : 0x65e5f3, toneMapped: false }));
      float.position.y = 1.9;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.46, .035, 8, 32), glass);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.9;
      buoy.add(post, float, halo);
      buoy.position.set(x, -4.8, -10 - index * 1.4);
      buoy.userData.phase = index * 1.8;
      elements.push(buoy);
      group.add(buoy);
    });
  } else if (zoneId === "reef") {
    [-10, -2, 7].forEach((x, index) => {
      const coral = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .42, 3.1 + index * .5, 7), new THREE.MeshBasicMaterial({ color: index === 1 ? 0xef8fa7 : 0x4bc7bd, toneMapped: false }));
      base.position.y = 1.4;
      const branch = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.4, 6), accent);
      branch.position.set(.2, 3.1 + index * .35, 0);
      branch.rotation.z = .25;
      coral.add(base, branch);
      coral.position.set(x, -6.3, -9 - index * 2.2);
      coral.rotation.z = (index - 1) * .12;
      elements.push(coral);
      group.add(coral);
    });
    const wreck = new THREE.Mesh(new THREE.BoxGeometry(9, 1.8, 2.2), dark);
    wreck.position.set(1, -5.4, -14);
    wreck.rotation.z = -.12;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 5, 8), accent);
    mast.position.set(1, -2.9, -14);
    group.add(wreck, mast);
    elements.push(wreck);
  } else if (zoneId === "deep") {
    const station = new THREE.Mesh(new THREE.SphereGeometry(2.1, 24, 16), dark);
    station.scale.set(1.2, .72, .8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, .08, 10, 64), accent);
    ring.rotation.x = Math.PI / 2;
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x75ddff, transparent: true, opacity: .72, toneMapped: false });
    const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(.34, 14, 10), windowMaterial);
    windowMesh.position.set(1.9, .2, .48);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.12, .8, 13, 18, 1, true), glass);
    beam.position.set(1.2, 3.8, -2);
    beam.rotation.z = .35;
    group.add(station, ring, windowMesh, beam);
    station.position.set(-7, -5.3, -13);
    ring.position.copy(station.position);
    windowMesh.position.add(station.position);
    station.userData.phase = 0;
    elements.push(station, ring, windowMesh, beam);
  } else if (zoneId === "aurora") {
    for (let i = 0; i < 6; i += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(.36 + (i % 2) * .18, 3.4 + (i % 3) * .8, 6), glass);
      crystal.position.set(-13 + i * 5.2, -4.6, -10 - (i % 3) * 2.4);
      crystal.rotation.z = (i % 2 ? 1 : -1) * .18;
      crystal.userData.phase = i * .8;
      elements.push(crystal); group.add(crystal);
    }
    const auroraRing = new THREE.Mesh(new THREE.TorusGeometry(6.4, .08, 10, 72), accent);
    auroraRing.position.set(0, 2.2, -14); auroraRing.rotation.x = Math.PI / 2; group.add(auroraRing); elements.push(auroraRing);
  } else if (zoneId === "rift") {
    for (let i = 0; i < 4; i += 1) {
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.32 + i * .06, .7, 4 + i * .75, 8), dark);
      chimney.position.set(-10 + i * 6.5, -4.8, -11 - i * 1.2);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6c3d, transparent: true, opacity: .72, toneMapped: false }));
      glow.position.copy(chimney.position); glow.position.y += 2.3 + i * .35;
      elements.push(chimney, glow); group.add(chimney, glow);
    }
  } else if (zoneId === "city") {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    dome.position.set(0, -4.8, -13); dome.scale.y = .72; group.add(dome);
    for (let i = 0; i < 5; i += 1) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(.34, 4 + i * .4, .34), dark);
      pillar.position.set(-8 + i * 4, -4.3, -12 - (i % 2) * 2); elements.push(pillar); group.add(pillar);
    }
    elements.push(dome);
  } else {
    const trench = new THREE.Mesh(new THREE.RingGeometry(3.2, 5.4, 64), new THREE.MeshBasicMaterial({ color: 0x8b63ff, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    trench.position.set(0, -6.4, -13);
    trench.scale.y = .42;
    const shadow = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 14), dark);
    body.scale.set(2.2, .55, .7);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.8, 2.4, 4), dark);
    tail.position.x = -3.1;
    tail.rotation.z = Math.PI / 2;
    shadow.add(body, tail);
    shadow.position.set(7, -3.7, -15);
    shadow.scale.setScalar(.8);
    const sparks = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 18 }, (_, index) => new THREE.Vector3(-14 + index * 1.7, -5 + (index % 4) * 1.5, -10 - (index % 3) * 2))), new THREE.PointsMaterial({ color: 0xb78cff, size: .11, transparent: true, opacity: .72, toneMapped: false }));
    group.add(trench, shadow, sparks);
    shadow.userData.phase = 1.2;
    elements.push(trench, shadow, sparks);
  }

  group.userData.elements = elements;
  zoneLandmarks = group;
  scene.add(group);
}

function updateZoneLandmarks(now) {
  if (!zoneLandmarks) return;
  const time = now * .001;
  (zoneLandmarks.userData.elements || []).forEach((element, index) => {
    if (element.userData.baseY === undefined) element.userData.baseY = element.position.y;
    element.position.y = element.userData.baseY + Math.sin(time * .7 + index * 1.6) * .12;
    element.rotation.y += .0009 * (index % 2 ? -1 : 1);
    if (element.userData && element.userData.phase !== undefined) {
      element.scale.x = 1 + Math.sin(time * .42 + element.userData.phase) * .025;
    }
  });
}
function createEnvironmentEffects() {
  if (environmentGroup) {
    environmentGroup.traverse((child) => { if (child.geometry) child.geometry.dispose(); if (child.material) child.material.dispose(); });
    scene.remove(environmentGroup);
  }
  environmentBeams = [];
  distantShadows = [];
  environmentGroup = new THREE.Group();
  const beamColor = new THREE.Color(currentPalette.light);
  const beamMaterial = new THREE.MeshBasicMaterial({ color: beamColor, transparent: true, opacity: .055, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i += 1) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.04, .62 + (i % 3) * .18, 22, 12, 1, true), beamMaterial.clone());
    beam.position.set(-18 + i * 6, 1, -11 - (i % 3) * 2);
    beam.rotation.z = (i % 2 ? 1 : -1) * (.08 + i * .012);
    beam.userData.phase = i * .9;
    environmentBeams.push(beam);
    environmentGroup.add(beam);
  }
  causticMesh = new THREE.Mesh(new THREE.PlaneGeometry(90, 52, 1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(currentPalette.accent) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime; uniform vec3 uColor; float wave(vec2 p,float t){return sin(p.x*18.0+t)*sin(p.y*13.0-t*.7);} void main(){ vec2 p=vUv*2.0-1.0; float c=smoothstep(.2,.95,abs(wave(p,uTime*.32))); float fade=1.0-smoothstep(.35,1.0,length(p)); gl_FragColor=vec4(uColor,c*fade*.11); }`
  }));
  causticMesh.position.set(0, -2.5, -12.5);
  environmentGroup.add(causticMesh);
  const highlightCount = 110;
  const highlightPositions = new Float32Array(highlightCount * 3);
  for (let i = 0; i < highlightCount; i += 1) {
    highlightPositions[i * 3] = -20 + rand() * 40;
    highlightPositions[i * 3 + 1] = -6 + rand() * 16;
    highlightPositions[i * 3 + 2] = -13 + rand() * 15;
  }
  const highlightGeometry = new THREE.BufferGeometry();
  highlightGeometry.setAttribute("position", new THREE.BufferAttribute(highlightPositions, 3));
  surfaceHighlights = new THREE.Points(highlightGeometry, new THREE.PointsMaterial({ color: currentPalette.light, size: .055, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending }));
  environmentGroup.add(surfaceHighlights);
  for (let i = 0; i < 3; i += 1) {
    const shadow = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0x02050c, transparent: true, opacity: .16, depthWrite: false });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material); body.scale.set(2.4, .48, .5);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.48, 1.5, 4), material); tail.position.x = -2.2; tail.rotation.z = Math.PI / 2;
    shadow.add(body, tail); shadow.position.set(-7 + i * 8, 2 - i * 2.2, -18 - i * 2); shadow.scale.setScalar(.7 + i * .18);
    shadow.userData.speed = .12 + i * .04; shadow.userData.phase = i * 1.7;
    distantShadows.push(shadow); environmentGroup.add(shadow);
  }
  scene.add(environmentGroup);
}

function updateEnvironmentEffects(now) {
  if (!environmentGroup) return;
  const time = now * .001;
  if (causticMesh?.material?.uniforms?.uTime) causticMesh.material.uniforms.uTime.value = time;
  environmentBeams.forEach((beam, index) => {
    beam.material.opacity = .04 + Math.sin(time * .17 + beam.userData.phase) * .018;
    beam.rotation.z += .00008 * (index % 2 ? -1 : 1);
  });
  if (surfaceHighlights) surfaceHighlights.rotation.z = Math.sin(time * .035) * .035;
  distantShadows.forEach((shadow) => {
    shadow.position.x += shadow.userData.speed * .016;
    shadow.position.y += Math.sin(time * .18 + shadow.userData.phase) * .002;
    if (shadow.position.x > 19) shadow.position.x = -19;
  });
}
function createParticles() {
  const count = quality === "high" ? 180 : 80;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = -18 + rand() * 36;
    positions[i * 3 + 1] = -7 + rand() * 17;
    positions[i * 3 + 2] = -12 + rand() * 13;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xdafcff, size: 0.08, transparent: true, opacity: 0.52, depthWrite: false });
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function createLights() {
  const ambient = new THREE.HemisphereLight(0xd9fbff, 0x2d7188, 1.35);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffedbd, 1.85);
  sun.position.set(8, 15, 10);
  scene.add(sun);
  const fill = new THREE.PointLight(currentPalette.accent, 2.4, 40);
  fill.position.set(-8, 1, 4);
  scene.add(fill);
  return { sun, fill };
}

function createNet() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0xf5ffff, transparent: true, opacity: 0.9 });
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0xa9f5ff, transparent: true, opacity: 0.75 });
  [0.24, 0.56, 0.92].forEach((radius, index) => {
    const points = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), index === 2 ? material : ringMaterial));
  });
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a), Math.sin(a), 0)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  group.scale.setScalar(0.01);
  group.visible = false;
  scene.add(group);
  return group;
}

let net;

function clampNumber(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}

function hotspotToWorld(spot) {
  return new THREE.Vector3(
    (clampNumber(spot.x, 0, 100) / 100) * 32 - 16,
    (clampNumber(spot.y, 30, 90) / 100) * 14 - 7,
    3.2
  );
}

function createSonarMarker(spot, index) {
  const color = spot.type === "legendary" ? 0xb987ff : spot.type === "rare" ? 0xffc45c : 0x57e2f3;
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .52, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  [0.62, 0.98, 1.34].forEach((radius, ringIndex) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.94, radius, 48), ringMaterial.clone());
    ring.scale.y = 0.42;
    ring.position.z = ringIndex * 0.08;
    group.add(ring);
  });
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  center.position.z = 0.18;
  group.add(center);
  group.position.copy(hotspotToWorld(spot));
  group.scale.setScalar(clampNumber(spot.radius, 4, 24) / 12);
  group.userData = { spotId: spot.id, type: spot.type, index, phase: index * 1.7, bornAt: performance.now() };
  scene.add(group);
  return group;
}

function setSonarHotspots(hotspots = []) {
  const next = (Array.isArray(hotspots) ? hotspots : []).filter((spot) => spot && spot.id).slice(0, 6);
  const nextIds = next.map((spot) => spot.id).join("|");
  const currentIds = sonarVisuals.map((visual) => visual.userData.spotId).join("|");
  if (nextIds !== currentIds) {
    sonarVisuals.forEach((visual) => {
      visual.traverse((child) => { if (child.geometry) child.geometry.dispose(); if (child.material) child.material.dispose(); });
      scene.remove(visual);
    });
    sonarVisuals = next.map((spot, index) => createSonarMarker(spot, index));
    return;
  }
  next.forEach((spot, index) => {
    const visual = sonarVisuals[index];
    if (!visual) return;
    visual.position.copy(hotspotToWorld(spot));
    visual.scale.setScalar(clampNumber(spot.radius, 4, 24) / 12);
    visual.userData.type = spot.type;
  });
}

function playSonarPing(type = "normal", position = null) {
  if (sonarPing && sonarPing.mesh) {
    scene.remove(sonarPing.mesh);
    sonarPing.mesh.geometry.dispose();
    sonarPing.mesh.material.dispose();
  }
  const color = type === "legendary" ? 0xb987ff : type === "rare" ? 0xffc45c : 0x57e2f3;
  sonarPing = {
    type,
    color,
    position: position && Number.isFinite(position.x) ? hotspotToWorld(position) : new THREE.Vector3(0, 0, 3.2),
    startedAt: performance.now(),
    duration: type === "legendary" ? 720 : type === "rare" ? 600 : 440
  };
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1.02, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  mesh.position.copy(sonarPing.position);
  mesh.scale.set(.35, .15, .35);
  scene.add(mesh);
  sonarPing.mesh = mesh;
  impactPulse = Math.max(impactPulse, type === "legendary" ? 1.45 : type === "rare" ? 1.05 : .6);
}

function bossProfileFor(zone) {
  return BOSS_VISUAL_PROFILES[zone] || BOSS_VISUAL_PROFILES.shallow;
}

function cloneBossMaterial(material, profile, motionAxis) {
  const source = Array.isArray(material) ? material[0] : material;
  const next = source ? source.clone() : new THREE.MeshPhysicalMaterial({ color: profile.color, side: THREE.DoubleSide });
  if (next.color) {
    const color = next.color;
    const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    if (luminance > 0.18 && luminance < 0.9) color.lerp(new THREE.Color(profile.color), 0.18);
  }
  if ("roughness" in next) next.roughness = Math.min(0.62, Math.max(0.30, Number(next.roughness) || 0.48));
  if ("metalness" in next) next.metalness = Math.min(0.18, Number(next.metalness) || 0);
  if ("clearcoat" in next) { next.clearcoat = 0.72; next.clearcoatRoughness = 0.2; }
  if ("emissive" in next && next.emissive) {
    next.emissive = new THREE.Color(profile.accent);
    next.emissiveIntensity = 0.045;
  }
  next.side = THREE.DoubleSide;
  next.toneMapped = false;
  const uniforms = {
    uBossTime: { value: 0 },
    uBossAmp: { value: profile.amplitude || 0.08 },
    uBossSpeed: { value: profile.speed || 1 },
    uBossMotion: { value: profile.motion === "serpent" ? 1 : profile.motion === "flap" ? 2 : 0 },
    uBossAxis: { value: motionAxis }
  };
  next.userData.bossUniforms = uniforms;
  next.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nuniform float uBossTime;\nuniform float uBossAmp;\nuniform float uBossSpeed;\nuniform float uBossMotion;\nuniform float uBossAxis;"
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      [
        "#include <begin_vertex>",
        "float bossAxisPos = mix(position.x, position.z, uBossAxis);",
        "float bossWave = sin(bossAxisPos * 3.1 + uBossTime * uBossSpeed) * uBossAmp;",
        "if (uBossMotion < 0.5) { transformed.z += bossWave; transformed.y += bossWave * 0.18; }",
        "else if (uBossMotion < 1.5) { transformed.y += bossWave; transformed.z += bossWave * 0.35; }",
        "else { transformed.y += bossWave * (0.55 + abs(position.x)); transformed.z += bossWave * 0.12; }"
      ].join("\n")
    );
  };
  next.customProgramCacheKey = () => `tide-boss-${profile.motion}-${motionAxis}`;
  next.needsUpdate = true;
  return next;
}

function createBossVisual(zone, color = 0xffb45d) {
  const profile = bossProfileFor(zone);
  const group = new THREE.Group();
  const source = models[profile.model];
  const root = source ? normalizeModel(source) : createFallbackFish(color);
  const shaderUniforms = [];
  const sharedGeometries = new Set();
  root.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry) {
      if (source) {
        sharedGeometries.add(child.geometry);
        child.userData.sharedGeometry = true;
      }
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    }
    const size = child.geometry?.boundingBox ? child.geometry.boundingBox.getSize(new THREE.Vector3()) : null;
    const axis = size && size.z > size.x ? 1 : 0;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    child.material = materials.map((material) => {
      const next = cloneBossMaterial(material, profile, axis);
      if (next.userData.bossUniforms) shaderUniforms.push(next.userData.bossUniforms);
      return next;
    });
    if (!Array.isArray(child.material)) child.material = child.material[0];
  });
  group.add(root);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.72, 1.84, 64),
    new THREE.MeshBasicMaterial({ color: profile.accent, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  ring.scale.y = 0.42;
  ring.position.z = 0.22;
  group.add(ring);
  const weakpoint = new THREE.Group();
  const weakCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2b4, transparent: true, opacity: 0.96, toneMapped: false })
  );
  const weakHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 18, 12),
    new THREE.MeshBasicMaterial({ color: profile.accent, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false })
  );
  weakpoint.add(weakCore, weakHalo);
  weakpoint.position.fromArray(profile.weakpoint || [0.55, 0.08, 0.3]);
  group.add(weakpoint);
  group.userData = { zone, profile, root, ring, weakpoint, shaderUniforms, sharedGeometries, baseScale: profile.scale, home: new THREE.Vector3() };
  group.visible = false;
  scene.add(group);
  return group;
}

function disposeBossVisual() {
  if (!bossVisual) return;
  bossVisual.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry && !child.userData.sharedGeometry) child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material?.dispose?.());
  });
  scene.remove(bossVisual);
  bossVisual = null;
}


function rebuildBossVisual(zone) {
  if (!bossVisual || bossVisual.userData.zone !== zone || !models[bossProfileFor(zone).model]) return;
  const position = bossVisual.position.clone();
  const visible = bossVisual.visible;
  const phase = bossPhaseState || { phase: 1, progress: 0 };
  const profile = bossProfileFor(zone);
  disposeBossVisual();
  bossVisual = createBossVisual(zone, profile.color);
  bossVisual.position.copy(position);
  bossVisual.userData.home.copy(position);
  bossVisual.visible = visible;
  bossVisual.userData.baseScale = profile.scale * (window.innerWidth < 720 ? 0.74 : window.innerWidth < 1000 ? 0.88 : 1);
  bossVisual.scale.setScalar(bossVisual.userData.baseScale);
  setBossPhase(phase.phase, phase.progress);
}

function setBossEncounter(data = null) {
  if (!data || !data.zone) { if (bossVisual) bossVisual.visible = false; return; }
  const profile = bossProfileFor(data.zone);
  if (!bossVisual || bossVisual.userData.zone !== data.zone || bossVisual.userData.profile.model !== profile.model) {
    disposeBossVisual();
    bossVisual = createBossVisual(data.zone, profile.color);
  }
  bossVisual.visible = true;
  const world = hotspotToWorld({ x: data.x, y: data.y });
  bossVisual.position.set(world.x, Math.max(-4.2, world.y), 2.4);
  bossVisual.userData.home.copy(bossVisual.position);
  const responsiveScale = window.innerWidth < 720 ? 0.74 : window.innerWidth < 1000 ? 0.88 : 1;
  const scale = profile.scale * responsiveScale;
  bossVisual.userData.baseScale = scale;
  bossVisual.scale.setScalar(scale);
  setBossPhase(data.phase || 1, data.phaseProgress || 0);
  const brokenParts = new Set(Array.isArray(data.brokenParts) ? data.brokenParts : []);
  if (bossVisual.userData.weakpoint) bossVisual.userData.weakpoint.visible = data.phase === 1 && !brokenParts.has("sonar");
  if (bossVisual.userData.ring?.material) bossVisual.userData.ring.material.opacity = brokenParts.has("armor") ? 0.38 : 0.66;
  if (!models[profile.model]) {
    ensureModelAsset(profile.model)
      .then(() => rebuildBossVisual(data.zone))
      .catch((error) => console.warn("Boss model load failed", error));
  }
}
function setFishDensity(count) {
  const next = Math.round(Number(count) || 0);
  if (!next || next === fishDensityTarget) return;
  fishDensityTarget = next;
  if (ready) placeFishSchool();
}

function setEcologyState(data = {}) {
  ecologyVisualState = data || null;
  if (!water || !data) return;
  const pressure = Math.max(0, Math.min(1, Number(data.predatorPressure) || 0));
  water.material.uniforms.uTop.value.setHex(currentPalette.top).lerp(new THREE.Color(0x6b2d4f), pressure * .22);
  water.material.uniforms.uBottom.value.setHex(currentPalette.bottom).lerp(new THREE.Color(0x13091d), pressure * .12);
}

function playFishReaction(type = "flee", payload = {}) {
  impactPulse = Math.max(impactPulse, type === "legendary" ? 1.4 : type === "rare" ? 1.05 : .55);
  school.forEach((fish) => {
    if (payload.speciesId && fish.userData.speciesId !== payload.speciesId) return;
    fish.userData.reaction = type;
    fish.userData.reactionUntil = performance.now() + (type === "flee" ? 900 : 1400);
  });
}

function setGearAura(slot, rarity, active = false) {
  if (!scene) return;
  if (!gearAura) {
    gearAura = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, .035, 8, 48), new THREE.MeshBasicMaterial({ color: 0x6eeaff, transparent: true, opacity: .45, toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    gearAura.add(ring); gearAura.userData.ring = ring; gearAura.visible = false; scene.add(gearAura);
  }
  const rarityColors = { common: 0x9fb4c5, rare: 0x56d8ff, epic: 0xa98cff, legendary: 0xffd36a };
  const color = rarityColors[rarity] || 0x56d8ff;
  gearAura.visible = true;
  gearAura.userData.ring.material.color.setHex(color);
  gearAura.userData.ring.material.opacity = active ? .76 : .3;
  gearAura.userData.slot = slot;
}

function playGearSkill(skillId, skill = {}) {
  const color = skill.color ? new THREE.Color(skill.color).getHex() : 0x74efff;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, .05, 8, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .72, side: THREE.DoubleSide, toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0, 3);
  scene.add(ring);
  const startedAt = performance.now();
  const animate = () => {
    const progress = (performance.now() - startedAt) / 620;
    if (progress >= 1) { scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); return; }
    const scale = 1 + progress * 5;
    ring.scale.set(scale, scale, scale);
    ring.material.opacity = .72 * (1 - progress);
    if (renderer) requestAnimationFrame(animate);
  };
  animate();
  impactPulse = Math.max(impactPulse, 1.2);
}

function setBossPhase(phase, progress = 0) {
  bossPhaseState = { phase: Number(phase) || 1, progress: Number(progress) || 0 };
  if (!bossVisual) return;
  const colors = [0xff9f56, 0xffd36a, 0xb987ff, 0x74efff];
  const phaseColor = colors[Math.min(3, bossPhaseState.phase - 1)];
  if (bossVisual.userData.ring) bossVisual.userData.ring.material.color.setHex(phaseColor);
  if (bossVisual.userData.weakpoint) {
    const halo = bossVisual.userData.weakpoint.children[1];
    if (halo?.material?.color) halo.material.color.setHex(bossPhaseState.phase >= 3 ? 0xff6f8f : bossVisual.userData.profile.accent);
  }
  const profile = bossVisual.userData.profile;
  bossVisual.userData.shaderUniforms.forEach((uniforms) => {
    if (!uniforms) return;
    uniforms.uBossAmp.value = (profile.amplitude || 0.08) * (1 + bossPhaseState.progress * 0.22);
    uniforms.uBossSpeed.value = (profile.speed || 1) * (1 + bossPhaseState.phase * 0.06);
  });
  bossVisual.scale.setScalar((bossVisual.userData.baseScale || 1) * (1 + bossPhaseState.progress * .18));
}

function setZoneFeatures(features = []) {
  window.TIDE_ZONE_FEATURES = Array.isArray(features) ? features : [];
}
function setFishSpriteQuality(level) { setFishLodQuality(level); }
function setFishVisibilityDebug(enabled) { window.TIDE_FISH_DEBUG = Boolean(enabled); }
function setFishLodQuality(level) {
  fishLodQuality = level === "low" || level === "medium" ? level : "high";
}

function updateSonarVisuals(now, delta) {
  sonarVisuals.forEach((visual) => {
    const elapsed = (now - visual.userData.bornAt) * 0.001;
    visual.rotation.z += delta * (visual.userData.type === "legendary" ? 0.48 : 0.28);
    visual.children.forEach((child, index) => {
      if (index > 2) return;
      const pulse = 0.86 + Math.sin(elapsed * (1.5 + index * .28) + visual.userData.phase) * 0.13;
      child.scale.set(pulse, pulse * .42, pulse);
      child.material.opacity = (0.24 + index * .11) * (0.8 + Math.sin(elapsed * 1.8 + index) * .2);
    });
  });
  if (sonarPing) {
    const progress = (now - sonarPing.startedAt) / sonarPing.duration;
    if (progress >= 1) {
      if (sonarPing.mesh) {
        scene.remove(sonarPing.mesh);
        sonarPing.mesh.geometry.dispose();
        sonarPing.mesh.material.dispose();
      }
      sonarPing = null;
    } else if (sonarPing.mesh) {
      const scale = 0.35 + progress * 3.2;
      sonarPing.mesh.scale.set(scale, scale * .42, scale);
      sonarPing.mesh.material.opacity = (1 - progress) * .72;
    }
  }
}

function updateBossVisual(now) {
  if (!bossVisual || !bossVisual.visible) return;
  const time = now * .001;
  const data = bossVisual.userData;
  const ring = data.ring;
  if (ring) {
    ring.scale.x = 1 + Math.sin(time * 1.8) * .08;
    ring.scale.y = .42 + Math.sin(time * 1.8) * .035;
    ring.material.opacity = .18 + Math.sin(time * 1.35) * .06;
  }
  const weakpoint = data.weakpoint;
  if (weakpoint) {
    const pulse = 1 + Math.sin(time * 3.2) * .22;
    weakpoint.scale.setScalar(pulse);
    weakpoint.children.forEach((child, index) => {
      if (child.material) child.material.opacity = (index === 0 ? .82 : .12) + Math.sin(time * 3.2) * .08;
    });
  }
  data.shaderUniforms.forEach((uniforms) => { if (uniforms) uniforms.uBossTime.value = time; });
  const home = data.home;
  bossVisual.position.x = home.x + Math.sin(time * .32) * .38;
  bossVisual.position.y = home.y + Math.sin(time * .61 + 1.2) * .16;
  bossVisual.rotation.y = Math.sin(time * .24) * .09;
  bossVisual.rotation.z = Math.sin(time * .9) * .022;
}
function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera({ x, y }, camera);
  raycaster.ray.intersectPlane(seaPlane, pointerWorld);
  return pointerWorld.clone().clamp(new THREE.Vector3(-16, -7, -12), new THREE.Vector3(16, 7, 4));
}

function castNet(detail = {}) {
  const point = detail.origin && Number.isFinite(detail.origin.x)
    ? screenToWorld(detail.origin.x, detail.origin.y)
    : new THREE.Vector3(0, 0, 0);
  castState = { start: performance.now(), point, duration: detail.fullScreen ? 1280 : 980, reeling: false };
  net.visible = true;
  net.position.copy(point);
  net.scale.setScalar(0.01);
}

function respawnFish(fish) {
  const data = fish.userData;
  const lane = Math.max(0, Math.min(7, Number(data.lane) || 0));
  if (!Number.isFinite(data.direction)) data.direction = rand() > 0.5 ? 1 : -1;
  if (data.route === "vertical") {
    fish.position.set(-14 + lane * 4 + (rand() - 0.5) * 2.2, data.direction > 0 ? -6 : 6, -4.6 + rand() * 7.2 + (data.depthTie || 0));
  } else {
    fish.position.set(data.direction > 0 ? -18 : 18, -4.2 + rand() * 9.2, -4.6 + rand() * 7.2 + (data.depthTie || 0));
  }
  data.baseX = fish.position.x;
  data.baseY = fish.position.y;
  data.phase = rand() * Math.PI * 2;
  data.speed = 0.42 + rand() * 0.46;
  fish.scale.setScalar(data.baseScale || 1);
  fish.rotation.set(0, data.direction > 0 ? 0 : Math.PI, 0);
  fish.visible = true;
  data.hiddenUntil = 0;
  data.isCaught = false;
  data.caughtAt = 0;
  data.catchEndsAt = 0;
  data.catchTarget = null;
  data.mode = "schooling";
  data.motionCheck = null;
  updateFishRenderOrder(fish);
  if (data.sprite) data.sprite.visible = true;
}

function resolveCatch(detail = {}) {
  if (!castState) castNet(detail);
  castState.reeling = true;
  castState.reelAt = performance.now();
  const count = Math.min(Number(detail.count) || 1, 8);
  const candidates = school.filter((fish) => !fish.userData.isCaught && !fish.userData.hiddenUntil);
  candidates.sort((a, b) => a.position.distanceTo(castState.point) - b.position.distanceTo(castState.point));
  for (let i = 0; i < count; i += 1) {
    const fish = candidates.splice(Math.floor(rand() * candidates.length), 1)[0];
    if (!fish) continue;
    fish.userData.reaction = "flee";
    fish.userData.reactionUntil = performance.now() + 520;
    fish.userData.mode = "fleeing";
  }
  impactPulse = detail.tier === "legendary" ? 1.6 : detail.tier === "rare" ? 1.15 : 0.7;
}

function updateNet(now, delta) {
  if (!castState || !net) return;
  const elapsed = now - castState.start;
  const phase = elapsed / castState.duration;
  if (phase < 0.34) {
    const p = phase / 0.34;
    net.visible = true;
    net.position.y = castState.point.y + Math.sin(p * Math.PI) * 1.25;
    net.scale.setScalar(0.04 + p * 0.94);
    net.rotation.z = -0.18 + p * 0.3;
  } else if (phase < 0.66) {
    const p = (phase - 0.34) / 0.32;
    net.scale.set(1 + p * 0.08, 0.78 + p * 0.2, 1);
    net.position.y = castState.point.y - Math.sin(p * Math.PI) * 0.14;
    net.rotation.z = 0.12 - p * 0.18;
  } else if (!castState.reeling) {
    castState.reeling = true;
    castState.reelAt = now;
  }
  if (castState.reeling) {
    const reel = Math.min(1, (now - castState.reelAt) / 440);
    net.scale.setScalar(Math.max(0.04, 1 - reel * 0.96));
    net.material && (net.material.opacity = 1 - reel);
  }
  if (phase > 1.35) {
    castState = null;
    net.visible = false;
  }
}

function updateFish(now, delta) {
  const time = now * 0.001;
  const clampedDelta = Math.min(delta, 0.05);
  school.forEach((fish) => {
    const data = fish.userData;
    if (data.mixer) data.mixer.update(clampedDelta);
    if (data.isCaught && (!Number.isFinite(data.caughtAt) || now - data.caughtAt > 950)) {
      respawnFish(fish);
      return;
    }
    if (!Number.isFinite(fish.position.x) || !Number.isFinite(fish.position.y) || !Number.isFinite(fish.scale.x)) {
      respawnFish(fish);
      return;
    }
    if (data.hiddenUntil && now >= data.hiddenUntil) respawnFish(fish);
    if (data.isCaught && now >= data.caughtAt) {
      fish.position.lerp(data.catchTarget, Math.min(1, clampedDelta * 6.5));
      const caughtScale = Math.max(0.08, (data.baseScale || 1) * (1 - Math.min(1, (now - data.caughtAt) / 380)));
      fish.scale.setScalar(caughtScale);
      fish.rotation.z = Math.sin(time * 18) * 0.22;
      if (now >= data.catchEndsAt || fish.position.distanceTo(data.catchTarget) < 0.12) {
        fish.visible = false;
        data.mode = "respawn";
        data.hiddenUntil = now + 320;
      }
    } else if (!data.isCaught) {
      const fleeing = data.reactionUntil > now && data.reaction === "flee";
      const movementSpeed = data.speed * (fleeing ? 1.65 : 1);
      if (data.route === "vertical") {
        fish.position.y += data.direction * movementSpeed * .34 * clampedDelta;
        fish.position.x = (data.baseX || 0) + Math.sin(time * .62 + data.phase) * .7;
        if (fish.position.y > 6.5) { fish.position.y = -6; data.baseY = -6; data.motionCheck = null; }
        if (fish.position.y < -6) { fish.position.y = 6.5; data.baseY = 6.5; data.motionCheck = null; }
      } else {
        fish.position.x += data.direction * movementSpeed * clampedDelta;
        fish.position.y = data.baseY + Math.sin(time * (0.7 + data.speed) + data.phase) * 0.24;
        if (data.direction > 0 && fish.position.x > 18) { fish.position.x = -18; data.baseX = -18; data.motionCheck = null; }
        if (data.direction < 0 && fish.position.x < -18) { fish.position.x = 18; data.baseX = 18; data.motionCheck = null; }
      }
      updateFishRenderOrder(fish);
      data.mode = data.reactionUntil > now && data.reaction === "flee" ? "fleeing" : "schooling";
      fish.rotation.z = Math.sin(time * (1.5 + data.speed) + data.phase) * (data.route === "vertical" ? .11 : .055);
      fish.rotation.y = data.direction > 0 ? 0 : Math.PI;
    }
    if (data.sprite && window.TideSpriteFish) window.TideSpriteFish.update(data.sprite, time, { speed: data.speed, phase: data.phase, direction: data.direction, lod: data.lod, mode: data.mode });
    const root = data.model;
    if (root?.userData?.modelKey) root.rotation.z = Math.sin(time * 2.4 + data.phase) * 0.035;
    const fins = root && root.userData ? root.userData.extraFins : null;
    if (Array.isArray(fins)) {
      if (fins[0]) fins[0].rotation.x = Math.sin(time * 7 + data.phase) * 0.16;
      if (fins[1]) fins[1].rotation.y = Math.sin(time * 6 + data.phase) * 0.32;
      if (fins[2]) fins[2].rotation.z = -0.42 + Math.sin(time * 8 + data.phase) * 0.22;
      if (fins[3]) fins[3].rotation.z = 0.42 - Math.sin(time * 8 + data.phase) * 0.22;
    }
    if (root && root.userData.proceduralType) {
      const type = root.userData.proceduralType;
      if (type === "eel" && root.userData.segments) {
        root.userData.segments.forEach((segment, index) => { segment.position.y = Math.sin(time * 5 + data.phase - index * .42) * (.08 + index * .012); });
      }
      if (type === "ray" && root.userData.wings) {
        root.userData.wings[0].rotation.z = -.12 + Math.sin(time * 5 + data.phase) * .18;
        root.userData.wings[1].rotation.z = .12 - Math.sin(time * 5 + data.phase) * .18;
      }
      if (type === "jelly" && root.userData.dome) {
        root.userData.dome.scale.x = 1 + Math.sin(time * 1.8 + data.phase) * .06;
        root.userData.dome.scale.y = .8 + Math.sin(time * 1.8 + data.phase) * .05;
      }
      if (type === "squid" && root.userData.body) root.userData.body.rotation.x = Math.sin(time * 3 + data.phase) * .08;
      if (type === "piranha" && root.userData.jaw) root.userData.jaw.rotation.z = Math.PI / 2 + Math.sin(time * 8 + data.phase) * .06;
    }
    const distance = fish.position.distanceTo(camera.position);
    const lod = distance > 30 ? "far" : distance > 21 ? "mid" : "near";
    data.lod = lod;
    if (root) {
      const showEyes = fishLodQuality !== "low" && lod !== "far";
      const showFins = fishLodQuality !== "low" && lod !== "far";
      if (root.userData.eyes) root.userData.eyes.forEach((eye) => { eye.visible = showEyes; });
      if (root.userData.extraFins) root.userData.extraFins.forEach((fin) => { fin.visible = showFins; });
    }
  });
}

function ensureVisibleCoverage() {
  const bins = Array.from({ length: 8 }, () => []);
  school.forEach((fish) => {
    if (!fish.visible) return;
    const bin = Math.max(0, Math.min(7, Math.floor((fish.position.x + 16) / 4)));
    bins[bin].push(fish);
  });
  for (let target = 0; target < bins.length; target += 1) {
    while (bins[target].length < 3) {
      let donorIndex = -1;
      let donorSize = 4;
      bins.forEach((list, index) => {
        if (index === target || list.length <= donorSize) return;
        donorIndex = index;
        donorSize = list.length;
      });
      if (donorIndex < 0) break;
      const donorList = bins[donorIndex];
      donorList.sort((a, b) => Math.abs(b.position.x) - Math.abs(a.position.x));
      const fish = donorList.pop();
      placeFishInLane(fish, target);
      bins[target].push(fish);
    }
  }
}

function validateSchool(now) {
  if (now - lastSchoolValidation < 1000) return;
  lastSchoolValidation = now;
  school.forEach((fish) => {
    const data = fish.userData;
    if (data.isCaught && (!Number.isFinite(data.caughtAt) || now - data.caughtAt > 1050)) {
      respawnFish(fish);
      return;
    }
    if (data.hiddenUntil && now >= data.hiddenUntil) {
      respawnFish(fish);
      return;
    }
    const previous = data.motionCheck;
    if (!previous) {
      data.motionCheck = { x: fish.position.x, y: fish.position.y, at: now };
      return;
    }
    if (now - previous.at >= 1800) {
      const moved = Math.hypot(fish.position.x - previous.x, fish.position.y - previous.y);
      if (moved < 0.08) placeFishInLane(fish, data.lane || 0);
      else data.motionCheck = { x: fish.position.x, y: fish.position.y, at: now };
    }
  });
  ensureVisibleCoverage();
}
function updateScene(now, delta) {
  if (!ready || paused) return;
  updateNet(now, delta);
  updateFish(now, delta);
  updateSonarVisuals(now, delta);
  updateBossVisual(now);
  updateZoneLandmarks(now);
  updateEnvironmentEffects(now);
  validateSchool(now);
  if (camera) { cameraParallax.lerp(cameraParallaxTarget, .035); camera.position.x = cameraParallax.x * .28; camera.position.y = cameraParallax.y * .18; camera.lookAt(0, 0, 0); }
  if (water && water.material.uniforms.uTime) water.material.uniforms.uTime.value = now * 0.001;
  if (particles) particles.rotation.y += delta * 0.01;
  if (impactPulse > 0) impactPulse = Math.max(0, impactPulse - delta * 2.2);
  renderer.render(scene, camera);
}

function resize() {
  if (!renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.75 : 1.15));
}

function applyZone(zoneId) {
  currentZone = ZONE_PALETTE[zoneId] ? zoneId : "shallow";
  currentPalette = ZONE_PALETTE[currentZone];
  if (!scene) return;
  scene.background = new THREE.Color(currentPalette.bg);
  scene.fog = new THREE.Fog(currentPalette.fog, 18, 48);
  if (water) {
    water.material.uniforms.uTop.value.setHex(currentPalette.top);
    water.material.uniforms.uBottom.value.setHex(currentPalette.bottom);
    water.material.uniforms.uAccent.value.setHex(currentPalette.accent);
  }
  if (seabed) seabed.material.color.setHex(new THREE.Color(currentPalette.bottom).lerp(new THREE.Color(0x9dbea4), 0.28));
  lights.fill.color.setHex(currentPalette.accent);
  setSonarHotspots([]);
  setBossEncounter(null);
  createZoneLandmarks(currentZone);
  createEnvironmentEffects();
  placeFishSchool();
  Promise.all([ensureZoneSprites(currentZone), ensureZoneFishModels(currentZone)]).then(() => {
    if (currentZone === zoneId && ready) placeFishSchool();
  });
}

function setQuality(level) {
  quality = level === "low" || level === "medium" ? level : "high";
  setFishLodQuality(quality);
  resize();
  if (particles) particles.visible = quality !== "low";
  if (environmentGroup) environmentGroup.visible = quality !== "low";
  environmentBeams.forEach((beam) => { beam.visible = quality === "high"; });
  distantShadows.forEach((shadow) => { shadow.visible = quality === "high"; });
}

function setEnvironmentQuality(level) { setQuality(level); }
function setCameraParallax(x, y) { cameraParallaxTarget.set(clampNumber(x, -1, 1) * 2, clampNumber(y, -1, 1) * 1.5); }


let bossModelDataPromise = null;
function ensureBossModelData() {
  if (window.TIDE_BOSS_MODEL_DATA || window.TIDE_MODEL_DATA) return Promise.resolve();
  if (bossModelDataPromise) return bossModelDataPromise;
  bossModelDataPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const version = app.dataset.appVersion || "20260920-15";
    script.src = `assets/fish/boss-models-data.js?v=${version}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load boss model data"));
    document.head.appendChild(script);
  });
  return bossModelDataPromise;
}

async function ensureModelAsset(key) {
  if (models[key]) return models[key];
  if (modelLoads.has(key)) return modelLoads.get(key);
  const bossFile = MODEL_FILES[key];
  const fishFile = FISH_MODEL_FILES[key];
  const file = bossFile || fishFile;
  if (!file) throw new Error(`Unknown model asset: ${key}`);
  const promise = (async () => {
    if (bossFile) await ensureBossModelData();
    const dataKey = bossFile ? file.replace(/\.glb$/i, "") : "";
    const data = bossFile ? (window.TIDE_BOSS_MODEL_DATA?.[dataKey] || window.TIDE_MODEL_DATA?.[dataKey]) : null;
    const gltf = data ? await new Promise((resolve, reject) => {
      const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
      new GLTFLoader().parse(bytes.buffer, "", resolve, reject);
    }) : await new GLTFLoader().loadAsync(`${bossFile ? MODEL_ROOT : FISH_MODEL_ROOT}${file}`);
    models[key] = gltf.scene;
    modelAnimations[key] = gltf.animations || [];
    return gltf.scene;
  })();
  modelLoads.set(key, promise);
  try {
    return await promise;
  } finally {
    modelLoads.delete(key);
  }
}

async function init() {
  if (!canvas || !window.WebGLRenderingContext) {
    app.classList.add("webgl-fallback");
    return;
  }
  try {
    quality = window.innerWidth < 720 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? "medium" : "high";
    setFishLodQuality(quality);
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace; else renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(currentPalette.bg);
    scene.fog = new THREE.Fog(currentPalette.fog, 18, 48);
    camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 0, 25);
    camera.lookAt(0, 0, 0);
    clock = new THREE.Clock();
    lights = createLights();
    createWater();
    createSeabed();
    createZoneLandmarks(currentZone);
    createParticles();
    createEnvironmentEffects();
    net = createNet();
    await ensureZoneSprites(currentZone);
    placeFishSchool();
    resize();
    ensureZoneFishModels(currentZone).then(() => { if (renderer) placeFishSchool(); });
    ready = true;
    app.classList.add("webgl-ready");
    window.dispatchEvent(new CustomEvent("tide:3d-ready", { detail: { zone: currentZone } }));
    pendingCalls.splice(0).forEach(([name, args]) => apiCall(name, args));
    renderer.render(scene, camera);
    scheduleSpritePreload();
    const renderLoop = (now) => {
      try {
        if (renderer) updateScene(now, clock.getDelta());
      } catch (error) {
        const message = (error && error.stack) ? error.stack : ((error && error.name ? error.name : "Error") + ": " + (error && error.message ? error.message : String(error)));
        if (window.__tideRenderError !== message) {
          window.__tideRenderError = message;
          console.error("Tide3D render loop recovered", error);
        }
      }
      renderAnimationFrame = window.requestAnimationFrame(renderLoop);
    };
    renderAnimationFrame = window.requestAnimationFrame(renderLoop);
  } catch (error) {
    console.warn("3D ocean disabled", error);
    app.classList.add("webgl-fallback");
  }
}

const api = {
  setZone: applyZone,
  resetFishActivity() {
    school.forEach((fish) => {
      fish.userData.baseScale = fish.userData.baseScale || fish.scale.x || 1;
      respawnFish(fish);
    });
    if (castState) { castState = null; net.visible = false; }
  },
  castNet,
  resolveCatch,
  triggerImpact(type) { impactPulse = type === "legendary" || type === "ultimate" ? 1.8 : type === "rare" ? 1.25 : 0.72; },
  setCombo() {},
  setPaused(value) { paused = Boolean(value); },
  setQuality,
  setEnvironmentQuality,
  setCameraParallax,
  setSonarHotspots,
  playSonarPing,
  setBossEncounter,
  setFishLodQuality,
  setFishSpriteQuality,
  setFishVisibilityDebug,
  setFishDensity,
  setEcologyState,
  playFishReaction,
  setGearAura,
  playGearSkill,
  setBossPhase,
  setZoneFeatures,
  dispose() { if (renderAnimationFrame) window.cancelAnimationFrame(renderAnimationFrame); clearZoneLandmarks(); renderer?.setAnimationLoop(null); renderer?.dispose(); }
};

window.Tide3D = {
  get ready() { return ready; },
  get zone() { return currentZone; },
  get modelCount() { return new Set(Object.values(SPECIES_MODELS).map(([key]) => key)).size; },
  get fishCount() { return school.length; },
  get highQualityModelCount() { return hqFishTemplates.size; },
  get fishVisualMode() { return !shouldUseHighQualityFishModels() ? "sprite" : (hqFishTemplates.size ? "downloaded-3d" : "loading"); },
  get caughtFishCount() { return school.filter((fish) => fish.userData.isCaught).length; },
  get hiddenFishCount() { return school.filter((fish) => fish.userData.hiddenUntil).length; },
  get debugColors() { const out=[]; school.slice(0,4).forEach((fish)=>{fish.traverse((child)=>{if(child.isMesh && child.material && child.material.color && !out.includes(child.material.color.getHexString()))out.push(child.material.color.getHexString());});}); return out; },
  setZone(zone) { return apiCall("setZone", [zone]); },
  castNet(detail) { return apiCall("castNet", [detail]); },
  resolveCatch(detail) { return apiCall("resolveCatch", [detail]); },
  triggerImpact(type) { return apiCall("triggerImpact", [type]); },
  setCombo(value) { return apiCall("setCombo", [value]); },
  setPaused(value) { return apiCall("setPaused", [value]); },

  setQuality(value) { return apiCall("setQuality", [value]); },
  setEnvironmentQuality(value) { return apiCall("setEnvironmentQuality", [value]); },
  setCameraParallax(x, y) { return apiCall("setCameraParallax", [x, y]); },
  setSonarHotspots(hotspots) { return apiCall("setSonarHotspots", [hotspots]); },
  playSonarPing(type, position) { return apiCall("playSonarPing", [type, position]); },
  setBossEncounter(data) { return apiCall("setBossEncounter", [data]); },
  setFishLodQuality(level) { return apiCall("setFishLodQuality", [level]); },
  setFishSpriteQuality(level) { return apiCall("setFishSpriteQuality", [level]); },
  setFishVisibilityDebug(enabled) { return apiCall("setFishVisibilityDebug", [enabled]); },
  setFishDensity(count) { return apiCall("setFishDensity", [count]); },
  setEcologyState(data) { return apiCall("setEcologyState", [data]); },
  playFishReaction(type, payload) { return apiCall("playFishReaction", [type, payload]); },
  setGearAura(slot, rarity, active) { return apiCall("setGearAura", [slot, rarity, active]); },
  playGearSkill(skillId, skill) { return apiCall("playGearSkill", [skillId, skill]); },
  setBossPhase(phase, progress) { return apiCall("setBossPhase", [phase, progress]); },
  setZoneFeatures(features) { return apiCall("setZoneFeatures", [features]); },
  resetFishActivity() { return apiCall("resetFishActivity"); },
  dispose() { return apiCall("dispose"); }
};

window.addEventListener("tide:zone", (event) => apiCall("setZone", [event.detail.zone]));
window.addEventListener("tide:cast", (event) => apiCall("castNet", [event.detail]));
window.addEventListener("tide:catch", (event) => apiCall("resolveCatch", [event.detail]));
window.addEventListener("tide:impact3d", (event) => apiCall("triggerImpact", [event.detail.type]));
window.addEventListener("tide:sonar", (event) => apiCall("setSonarHotspots", [event.detail.hotspots]));
window.addEventListener("tide:sonar-hit", (event) => apiCall("playSonarPing", [event.detail.hotspot.type, event.detail.hotspot]));
window.addEventListener("tide:boss", (event) => apiCall("setBossEncounter", [event.detail.boss]));
window.addEventListener("tide:ecology", (event) => apiCall("setEcologyState", [event.detail]));
window.addEventListener("tide:gear-skill", (event) => apiCall("playGearSkill", [event.detail.skillId, event.detail.skill]));
window.addEventListener("tide:gear-aura", (event) => apiCall("setGearAura", [event.detail.slot, event.detail.rarity, event.detail.active]));
window.addEventListener("tide:fish-density", (event) => apiCall("setFishDensity", [event.detail.count]));
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => { paused = document.hidden; });
window.addEventListener("pointermove", (event) => { setCameraParallax((event.clientX / window.innerWidth - .5) * 2, (event.clientY / window.innerHeight - .5) * -2); }, { passive: true });

init();
})();
