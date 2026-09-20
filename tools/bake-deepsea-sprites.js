(() => {
  "use strict";
  const THREE = window.THREE;
  const loader = new THREE.GLTFLoader();
  const CELL = 256, COLS = 4, ROWS = 2;
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(CELL, CELL, false);
  renderer.setClearColor(0x000000, 0);
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace; else renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  preview.replaceWith(renderer.domElement);
  renderer.domElement.id = "preview";
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xdffaff, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.25); key.position.set(3, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x49d9ff, .9); fill.position.set(-4, -2, 3); scene.add(fill);
  const rim = new THREE.PointLight(0x5effd8, 1.5, 12); rim.position.set(0, 0, -3); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(34, 1, .01, 100);
  camera.position.set(0, 0, 3.35);
  const sheet = document.createElement("canvas"); sheet.width = CELL * COLS; sheet.height = CELL * ROWS;
  const sheetCtx = sheet.getContext("2d");

  const MODELS = {
    alien: "../assets/deepsea/downloads/alien-fish-animated.glb",
    zorag: "../assets/deepsea/downloads/zorag-mutant-angler.glb",
    manta: "../assets/deepsea/downloads/cartoon-manta-ray.glb",
    tropical: "../assets/deepsea/downloads/tropical-alien-fish.glb",
    clownfish: "../assets/deepsea/downloads/cartoon-clownfish.glb",
    angler: "../assets/deepsea/downloads/cartoon-angler-fish.glb",
    stingray: "../assets/deepsea/downloads/stonewisp-mutant-stingray.glb",
    bluegill: "../assets/deepsea/downloads/animated-blue-gill.glb",
    trout: "../assets/deepsea/downloads/animated-trout.glb",
    sailfish: "../assets/deepsea/downloads/sailfish.glb",
    remora: "../assets/deepsea/downloads/remora.glb",
    mutantfish: "../assets/deepsea/downloads/mutant-deep-sea-fish.glb",
    stylizedray: "../assets/deepsea/downloads/stylized-mutant-stingray.glb",
    jellyfish: "../assets/deepsea/downloads/jellyfish.glb",
    tuna: "../assets/deepsea/downloads/tuna-fish.glb"
  };

  const MAP = {
    silver_scad:["bluegill",.92], sardine:["trout",1], spotted_bream:["clownfish",.88], moon_carp:["tropical",1.02], prism_guppy:["bluegill",.82], lagoon_pike:["sailfish",.9],
    red_snapper:["tropical",.94], grouper:["angler",.88], blue_spotted_ray:["manta",.94], coral_dragon:["tropical",1.06], neon_lionfish:["tropical",.9], crystal_turtle:["stylizedray",.82],
    deep_cod:["trout",.94], bluefin_tuna:["tuna",1], oarfish:["remora",1.08], lanternfish:["zorag",.82], gloom_sword:["sailfish",.96], plasma_manta:["manta",1.02],
    abyss_eel:["remora",1.06], black_sea_bream:["bluegill",.94], ghost_shark:["zorag",.9], starlight_whale:["mutantfish",1.02], nebula_eel:["stingray",1.02], titan_whale:["mutantfish",1.1],
    crystal_smelt:["bluegill",.9], aurora_cod:["trout",.96], phosphor_ray:["manta",.98], cobalt_marlin:["sailfish",1.02], aurora_dragon_eel:["remora",1.05], sky_jelly:["jellyfish",1.05],
    magma_bass:["tropical",.96], blacksmoke_eel:["remora",1.04], flame_marlin:["sailfish",1.02], ember_snapper:["bluegill",.96], lava_goblin_shark:["zorag",.96], primordial_whalefish:["mutantfish",1.08],
    relic_damselfish:["clownfish",.92], titanium_barracuda:["sailfish",1.02], blue_steel_pomfret:["tuna",.96], watcher_swordfish:["sailfish",1.06], mech_ghost_shark:["zorag",1], abyss_core:["mutantfish",1.02],
    stardust_sardine:["trout",.92], phantom_moon_ray:["manta",1.02], void_tuna:["tuna",1.04], gravity_oarfish:["remora",1.08], void_whale:["mutantfish",1.1], genesis_whale:["mutantfish",1.16]
  };

  function tintMaterial(material, config) {
    const next = material.clone();
    if (next.color) next.color.lerp(new THREE.Color(config.body), 0.28);
    if ("roughness" in next) next.roughness = Math.min(.58, Math.max(.24, Number(next.roughness) || .4));
    if ("metalness" in next) next.metalness = Math.min(.2, Number(next.metalness) || 0);
    if (next.emissive) { next.emissive = new THREE.Color(config.glow); next.emissiveIntensity = .045; }
    next.side = THREE.DoubleSide;
    next.toneMapped = false;
    return next;
  }

  function applyTint(root, config, scale) {
    root.updateMatrixWorld(true);
    const staticRoot = new THREE.Group();
    root.traverse((child) => {
      if (!child.isMesh) return;
      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const material = Array.isArray(child.material)
        ? materials.map((entry) => tintMaterial(entry, config))
        : tintMaterial(materials[0], config);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      staticRoot.add(mesh);
    });
    const box = new THREE.Box3().setFromObject(staticRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    staticRoot.position.sub(center);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const wrapper = new THREE.Group();
    wrapper.add(staticRoot);
    if (size.y > Math.max(size.x, size.z) * 1.15) wrapper.rotation.z = -Math.PI / 2;
    else if (size.z > size.x * 1.15) wrapper.rotation.y = Math.PI / 2;
    wrapper.scale.setScalar((1.72 / longest) * scale);
    return wrapper;
  }

  function cleanup(root) {
    root.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose?.();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => { material?.map?.dispose?.(); material?.dispose?.(); });
    });
  }

  async function bakeSpecies(speciesId) {
    const entry = MAP[speciesId];
    if (!entry) throw new Error(`Unknown species ${speciesId}`);
    status.textContent = `loading ${speciesId}`;
    const gltf = await loader.loadAsync(MODELS[entry[0]]);
    const root = gltf.scene;
    const config = window.TideFishArt?.configs?.[speciesId] || { body: "#79dce8", glow: "#70efff" };
    const wrapper = applyTint(root, config, entry[1]);
    scene.add(wrapper);
    const mixer = gltf.animations?.length ? new THREE.AnimationMixer(root) : null;
    const actions = mixer ? gltf.animations.map((clip) => mixer.clipAction(clip)) : [];
    actions.forEach((action) => { action.setLoop(THREE.LoopRepeat, Infinity); action.play(); });
    sheetCtx.clearRect(0, 0, sheet.width, sheet.height);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const phase = col / COLS;
        if (mixer) {
          const clip = gltf.animations[Math.min(row, gltf.animations.length - 1)];
          const action = mixer.clipAction(clip);
          mixer.setTime(clip.duration * (row === 0 ? phase : (.52 + phase * .28)));
          action.paused = false;
        }
        wrapper.rotation.z = Math.sin(phase * Math.PI * 2) * (row ? .09 : .025);
        wrapper.rotation.y = row ? .22 : 0;
        wrapper.position.y = Math.sin(phase * Math.PI * 2) * .035;
        renderer.render(scene, camera);
        sheetCtx.drawImage(renderer.domElement, col * CELL, row * CELL);
      }
    }
    scene.remove(wrapper);
    mixer?.stopAllAction();
    cleanup(wrapper);
    status.textContent = `ready ${speciesId}`;
    return sheet.toDataURL("image/png");
  }

  async function previewSpecies(speciesId) {
    const entry = MAP[speciesId];
    if (!entry) throw new Error("Unknown species");
    const gltf = await loader.loadAsync(MODELS[entry[0]]);
    const root = gltf.scene;
    const config = window.TideFishArt?.configs?.[speciesId] || { body: "#79dce8", glow: "#70efff" };
    const wrapper = applyTint(root, config, entry[1]);
    scene.add(wrapper);
    const box = new THREE.Box3().setFromObject(wrapper);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    renderer.render(scene, camera);
    root.updateMatrixWorld(true);
    const boneBox = new THREE.Box3();
    root.traverse((child) => { if (child.isBone) boneBox.expandByPoint(child.getWorldPosition(new THREE.Vector3())); });
    const meshes = [];
    root.traverse((child) => { if (child.isMesh) { const mats = Array.isArray(child.material) ? child.material : [child.material]; meshes.push({ name: child.name, skinned: child.isSkinnedMesh, bones: child.skeleton?.bones?.length || 0, position: child.position.toArray(), scale: child.scale.toArray(), visible: child.visible, materialTypes: mats.map((m) => m?.type), materialVisible: mats.map((m) => m?.visible !== false), colors: mats.map((m) => m?.color?.getHexString?.() || ""), maps: mats.map((m) => Boolean(m?.map)) }); } });
    const result = { data: renderer.domElement.toDataURL("image/png"), size: size.toArray(), center: center.toArray(), children: root.children.length, sceneChildren: scene.children.length, boneMin: boneBox.isEmpty()?null:boneBox.min.toArray(), boneMax: boneBox.isEmpty()?null:boneBox.max.toArray(), wrapperVisible: wrapper.visible, rootVisible: root.visible, meshes, render: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles } };
    scene.remove(wrapper);
    cleanup(wrapper);
    return result;
  }

  function testRenderer() {
    const testScene = new THREE.Scene();
    const testCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    testCamera.position.z = 2;
    testScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ color: 0xff3366, toneMapped: false })));
    renderer.render(testScene, testCamera);
    return { data: renderer.domElement.toDataURL("image/png"), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  }

  window.DeepSeaBaker = { bakeSpecies, previewSpecies, testRenderer, speciesIds: Object.keys(MAP) };
  status.textContent = "ready";
})();