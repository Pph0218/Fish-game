(() => {
  "use strict";

  const SAVE_KEY = "tideline_fishery_save_v1";
  const CAP_BASE = 50;
  const RARE_BASE_VALUE = 5;
  const LEGENDARY_BASE_VALUE = 20;
  const MANUAL_COOLDOWN = 480;
  const OFFLINE_MIN_SECONDS = 30;
  const EVENT_MIN_MS = 5 * 60 * 1000;
  const EVENT_MAX_MS = 10 * 60 * 1000;
  const MIGRATION_DURATION = 60 * 1000;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  let fxSeed = 0x6d2b79f5;
  function fxRandom() {
    fxSeed = (fxSeed * 1664525 + 1013904223) >>> 0;
    return fxSeed / 4294967296;
  }
  const fxBetween = (min, max) => min + fxRandom() * (max - min);
  function emitTide(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function updateComboVisual() {
    if (!dom.comboHud) return;
    dom.comboText.textContent = String(visualCombo);
    dom.comboFill.style.width = `${Math.min(100, (visualCombo / 20) * 100)}%`;
    dom.comboHud.classList.toggle("active", visualCombo > 0);
    dom.comboHud.classList.toggle("hot", visualCombo >= 10);
    dom.comboHud.classList.toggle("blazing", visualCombo >= 20);
    emitTide("tide:combo", { combo: visualCombo });
  }

  function bumpVisualCombo(success) {
    window.clearTimeout(comboResetTimer);
    visualCombo = success ? Math.min(20, visualCombo + 1) : Math.max(0, visualCombo - 5);
    updateComboVisual();
    comboResetTimer = window.setTimeout(() => {
      visualCombo = 0;
      updateComboVisual();
    }, 1800);
  }

  function toggleMute() {
    state.audioMuted = !state.audioMuted;
    emitTide("tide:mute", { muted: state.audioMuted });
    showToast(state.audioMuted ? "声音已静音" : "声音已开启", "按 M 可随时切换。", "info");
    saveGame(true);
  }

  function updateRailState(side, open, pinned) {
    const rail = document.getElementById(side + "Rail");
    const toggle = document.getElementById(side + "RailToggle");
    const pin = document.getElementById(side + "RailPin");
    const openKey = side === "left" ? "leftPanelOpen" : "rightPanelOpen";
    const pinKey = side === "left" ? "leftPanelPinned" : "rightPanelPinned";
    state.ui[openKey] = Boolean(open);
    if (pinned !== undefined) state.ui[pinKey] = Boolean(pinned);
    rail?.classList.toggle("open", state.ui[openKey]);
    toggle?.setAttribute("aria-expanded", String(state.ui[openKey]));
    pin?.classList.toggle("active", Boolean(state.ui[pinKey]));
    if (pin) pin.textContent = state.ui[pinKey] ? "已固定" : "固定展开";
    if (state.ui[openKey]) {
      const otherSide = side === "left" ? "right" : "left";
      const otherOpenKey = otherSide === "left" ? "leftPanelOpen" : "rightPanelOpen";
      const otherRail = document.getElementById(otherSide + "Rail");
      const otherToggle = document.getElementById(otherSide + "RailToggle");
      state.ui[otherOpenKey] = false;
      otherRail?.classList.remove("open");
      otherToggle?.setAttribute("aria-expanded", "false");
    }
    dom.railBackdrop?.classList.toggle("open", Boolean(state.ui.leftPanelOpen || state.ui.rightPanelOpen));
  }
  function toggleRail(side, forceOpen) {
    const openKey = side === "left" ? "leftPanelOpen" : "rightPanelOpen";
    const next = forceOpen === undefined ? !state.ui[openKey] : Boolean(forceOpen);
    updateRailState(side, next);
    saveGame(true);
  }
  function updateKeyboardGuide() {
    if (!dom.keyboardHint) return;
    if (window.matchMedia?.("(hover: none), (pointer: coarse)").matches) {
      dom.keyboardHint.hidden = true;
      return;
    }
    const collapsed = Boolean(state.ui && state.ui.keyGuideCollapsed);
    dom.keyboardHint.classList.add("visible");
    dom.keyboardHint.classList.toggle("collapsed", collapsed);
    dom.keyboardToggle?.setAttribute("aria-expanded", String(!collapsed));
  }

  function showKeyboardHint(autoCollapse = false) {
    if (!dom.keyboardHint) return;
    if (window.matchMedia?.("(hover: none), (pointer: coarse)").matches) return;
    state.ui.keyGuideCollapsed = false;
    updateKeyboardGuide();
    if (autoCollapse) window.setTimeout(() => {
      state.ui.keyGuideCollapsed = true;
      updateKeyboardGuide();
      saveGame(true);
    }, 8000);
  }

  function toggleKeyboardGuide() {
    state.ui.keyGuideCollapsed = !state.ui.keyGuideCollapsed;
    updateKeyboardGuide();
    saveGame(true);
  }
  function trimFx(container, selector, limit) {
    if (!container) return;
    const nodes = container.querySelectorAll(selector);
    const excess = nodes.length - limit;
    for (let i = 0; i < excess; i += 1) nodes[i].remove();
  }
  const randomEventDelay = () => Math.floor(randomBetween(EVENT_MIN_MS, EVENT_MAX_MS));
  const byId = (items, id) => items.find((item) => item.id === id);

  const dom = {
    app: document.getElementById("app"),
    goldText: document.getElementById("goldText"),
    goldStat: document.getElementById("goldStat"),
    holdText: document.getElementById("holdText"),
    holdStat: document.getElementById("holdStat"),
    incomeText: document.getElementById("incomeText"),
    zoneTabs: document.getElementById("zoneTabs"),
    upgradeToggle: document.getElementById("upgradeToggle"),
    upgradeDot: document.getElementById("upgradeDot"),
    sellButton: document.getElementById("sellButton"),
    sellValueText: document.getElementById("sellValueText"),
    processButton: document.getElementById("processButton"),
    processText: document.getElementById("processText"),
    processChip: document.getElementById("processChip"),
    eventCard: document.getElementById("eventCard"),
    eventIcon: document.getElementById("eventIcon"),
    eventTitle: document.getElementById("eventTitle"),
    eventText: document.getElementById("eventText"),
    eventTimer: document.getElementById("eventTimer"),
    seaPanel: document.getElementById("seaPanel"),
    sonarLayer: document.getElementById("sonarLayer"),
    bossHud: document.getElementById("bossHud"),
    ecologyHud: document.getElementById("ecologyHud"),
    ecoDensity: document.getElementById("ecoDensity"),
    ecoPressure: document.getElementById("ecoPressure"),
    ecoMorale: document.getElementById("ecoMorale"),
    ecoModifier: document.getElementById("ecoModifier"),
    gearSkillHud: document.getElementById("gearSkillHud"),
    gearSkillMode: document.getElementById("gearSkillMode"),
    oceanCanvas: document.getElementById("oceanCanvas"),
    splashField: document.getElementById("splashField"),
    seaButton: document.getElementById("seaButton"),
    castConsole: document.getElementById("castConsole"),
    castButton: document.getElementById("castButton"),
    lastCastText: document.getElementById("lastCastText"),
    castPrompt: document.getElementById("castPrompt"),
    castEstimate: document.getElementById("castEstimate"),
    zoneName: document.getElementById("zoneName"),
    emptyRateText: document.getElementById("emptyRateText"),
    rareRateText: document.getElementById("rareRateText"),
    doubleRateText: document.getElementById("doubleRateText"),
    catchLayer: document.getElementById("catchLayer"),
    seaTip: document.getElementById("seaTip"),
    comboHud: document.getElementById("comboHud"),
    comboText: document.getElementById("comboText"),
    comboFill: document.getElementById("comboFill"),
    keyboardHint: document.getElementById("keyboardHint"),
    railBackdrop: document.getElementById("railBackdrop"),
    fishField: document.getElementById("fishField"),
    bubbleField: document.getElementById("bubbleField"),
    shimmerField: document.getElementById("shimmerField"),
    autoRateText: document.getElementById("autoRateText"),
    catchMultiplierText: document.getElementById("catchMultiplierText"),
    saleMultiplierText: document.getElementById("saleMultiplierText"),
    speciesText: document.getElementById("speciesText"),
    capacityFill: document.getElementById("capacityFill"),
    progressTip: document.getElementById("progressTip"),
    achievementCount: document.getElementById("achievementCount"),
    speciesDockCount: document.getElementById("speciesDockCount"),
    achievementsButton: document.getElementById("achievementsButton"),
    encyclopediaButton: document.getElementById("encyclopediaButton"),
    creditsButton: document.getElementById("creditsButton"),
    leaderboardButton: document.getElementById("leaderboardButton"),
    profileButton: document.getElementById("profileButton"),
    contractsButton: document.getElementById("contractsButton"),
    guideButton: document.getElementById("guideButton"),
    expeditionButton: document.getElementById("expeditionButton"),
    expeditionStatus: document.getElementById("expeditionStatus"),
    bossButton: document.getElementById("bossButton"),
    equipmentButton: document.getElementById("equipmentButton"),
    ascensionButton: document.getElementById("ascensionButton"),
    keyboardToggle: document.getElementById("keyboardToggle"),
    keyboardList: document.getElementById("keyboardList"),
    saveText: document.getElementById("saveText"),
    dockZoneProgress: document.getElementById("dockZoneProgress"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    upgradeDrawer: document.getElementById("upgradeDrawer"),
    closeDrawerButton: document.getElementById("closeDrawerButton"),
    drawerGoldText: document.getElementById("drawerGoldText"),
    upgradeTree: document.getElementById("upgradeTree"),
    effectRoot: document.getElementById("effectRoot"),
    screenFlash: document.getElementById("screenFlash"),
    edgeGlow: document.getElementById("edgeGlow"),
    eventBanner: document.getElementById("eventBanner"),
    eventBannerIcon: document.getElementById("eventBannerIcon"),
    eventBannerTitle: document.getElementById("eventBannerTitle"),
    eventBannerText: document.getElementById("eventBannerText"),
    modalLayer: document.getElementById("modalLayer"),
    toastRoot: document.getElementById("toastRoot")
  };

  const zones = [
    { id: "shallow", name: "岸边浅滩", short: "浅滩", subtitle: "第 1 海域", cost: 0, priceMult: 1, rareChance: 0.035, legendaryChance: 0.002, emptyChance: 0.32, description: "水流平缓，普通鱼群密集，是渔场起步的可靠水域。" },
    { id: "reef", name: "近海礁区", short: "礁区", subtitle: "第 2 海域", cost: 450, priceMult: 2.35, rareChance: 0.09, legendaryChance: 0.006, emptyChance: 0.25, description: "礁石间藏有高价鱼种，稀有鱼出现率明显提升。" },
    { id: "deep", name: "深海渔场", short: "深海", subtitle: "第 3 海域", cost: 6000, priceMult: 4.5, rareChance: 0.16, legendaryChance: 0.015, emptyChance: 0.2, description: "深水鱼群价值更高，但撒网需要更成熟的渔具。" },
    { id: "abyss", name: "远洋深渊", short: "深渊", subtitle: "第 4 海域", cost: 60000, priceMult: 8.5, rareChance: 0.24, legendaryChance: 0.032, emptyChance: 0.15, description: "深渊生物发出幽冷荧光，稀有鱼与高价值渔获在这里最为常见。" },
    { id: "aurora", name: "极光海沟", short: "极光", subtitle: "第 5 海域", cost: 750000, priceMult: 16.5, rareChance: 0.31, legendaryChance: 0.052, emptyChance: 0.13, description: "冰晶与极光沉入海沟，鱼体折射出虹彩光辉。" },
    { id: "rift", name: "热泉裂谷", short: "热泉", subtitle: "第 6 海域", cost: 8000000, priceMult: 30, rareChance: 0.37, legendaryChance: 0.075, emptyChance: 0.12, description: "黑烟热泉托起高密度鱼群，火山能量催生巨型生命。" },
    { id: "city", name: "沉没观测城", short: "观测城", subtitle: "第 7 海域", cost: 80000000, priceMult: 58, rareChance: 0.43, legendaryChance: 0.1, emptyChance: 0.11, description: "失落观测站仍在运行，机械鱼影与巨兽信号交错。", unlockRequirements: { bosses: 4, research: 12 } },
    { id: "void", name: "星海归墟", short: "归墟", subtitle: "第 8 海域", cost: 1200000000, priceMult: 108, rareChance: 0.49, legendaryChance: 0.14, emptyChance: 0.1, description: "星海与深海交界，重力潮汐孕育最终虚空生物。", unlockRequirements: { bosses: 6, ascension: 1, protocol: "deep_start" } }
  ];

  const species = [
    { id: "silver_scad", zone: "shallow", name: "银鲹", tier: "normal", basePrice: 1, color: "#a8edf2", image: "assets/fish/kenney/Vector/fish_grey_long_a.svg", imageScale: 1.65, flip: false, accent: "#eaffff", pattern: "stripe", motion: "slim" },
    { id: "sardine", zone: "shallow", name: "沙丁鱼", tier: "normal", basePrice: 1, color: "#88dce8", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.52, flip: false, accent: "#f4ffff", pattern: "none", motion: "school" },
    { id: "spotted_bream", zone: "shallow", name: "斑石鲷", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#68e1c1", image: "assets/fish/kenney/Vector/fish_green.svg", imageScale: 1.68, flip: true, accent: "#baffdf", pattern: "spots", motion: "steady" },
    { id: "moon_carp", zone: "shallow", name: "月光鲤", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#ffe28f", image: "assets/fish/detail/aqua-fish-card.png", imageScale: 1.92, flip: false, accent: "#fff1a6", pattern: "moon", motion: "hero", detail: true },
    { id: "red_snapper", zone: "reef", name: "红鳍笛鲷", tier: "normal", basePrice: 1, color: "#ff9e82", image: "assets/fish/kenney/Vector/fish_red.svg", imageScale: 1.68, flip: true, accent: "#ffd2c2", pattern: "scales", motion: "steady" },
    { id: "grouper", zone: "reef", name: "礁石斑鱼", tier: "normal", basePrice: 1, color: "#c6a57c", image: "assets/fish/kenney/Vector/fish_brown.svg", imageScale: 1.82, flip: false, accent: "#f2d6a8", pattern: "spots", motion: "heavy" },
    { id: "blue_spotted_ray", zone: "reef", name: "蓝点鲛", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#63b9ff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 1.92, flip: true, accent: "#c4ecff", pattern: "spots", motion: "glide" },
    { id: "coral_dragon", zone: "reef", name: "珊瑚龙鱼", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#ffb5d0", image: "assets/fish/detail/purple-fish-card.png", imageScale: 1.3, flip: true, accent: "#ffd9e7", pattern: "coral", motion: "hero", detail: true },
    { id: "deep_cod", zone: "deep", name: "深海鳕", tier: "normal", basePrice: 1, color: "#9cb7c9", image: "assets/fish/kenney/Vector/fish_grey_long_a.svg", imageScale: 1.08, flip: false, accent: "#d9f3ff", pattern: "none", motion: "steady" },
    { id: "bluefin_tuna", zone: "deep", name: "蓝鳍金枪鱼", tier: "normal", basePrice: 1, color: "#6ba9d7", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 1.92, flip: true, accent: "#bde8ff", pattern: "stripe", motion: "fast" },
    { id: "oarfish", zone: "deep", name: "皇带鱼", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#c8e7f5", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.92, flip: false, accent: "#f5fbff", pattern: "ribbon", motion: "ribbon", stretch: 1.28 },
    { id: "lanternfish", zone: "deep", name: "灯笼巨口鱼", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#b6ff8f", image: "assets/fish/detail/aqua-fish-card.png", imageScale: 1.4, flip: true, accent: "#d8ffb4", pattern: "glow", motion: "hero", detail: true },
    { id: "abyss_eel", zone: "abyss", name: "深渊鳗", tier: "normal", basePrice: 1, color: "#7286ad", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.4, flip: false, accent: "#b8c6ef", pattern: "ribbon", motion: "ribbon", stretch: 1.35 },
    { id: "black_sea_bream", zone: "abyss", name: "黑棘鲷", tier: "normal", basePrice: 1, color: "#8994ad", image: "assets/fish/kenney/Vector/fish_grey.svg", imageScale: 1.92, flip: true, accent: "#c2cce6", pattern: "scales", motion: "heavy" },
    { id: "ghost_shark", zone: "abyss", name: "幽灵鲨", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#93b6ff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2, flip: false, accent: "#d8e6ff", pattern: "ghost", motion: "glide", stretch: 1.18 },
    { id: "starlight_whale", zone: "abyss", name: "星辉鲸", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#e4d5ff", image: "assets/fish/detail/purple-fish-card.png", imageScale: 1.7, flip: true, accent: "#ffffff", pattern: "stars", motion: "hero", detail: true },
    { id: "prism_guppy", zone: "shallow", name: "棱镜鳉鱼", tier: "normal", basePrice: 1, color: "#7debc6", image: "assets/fish/kenney/Vector/fish_green.svg", imageScale: 1.6, flip: false, accent: "#d8fff2", pattern: "stripe", motion: "school" },
    { id: "lagoon_pike", zone: "shallow", name: "潟湖狗鱼", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#8ad4ff", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.72, flip: true, accent: "#dff7ff", pattern: "spots", motion: "fast", stretch: 1.18 },
    { id: "neon_lionfish", zone: "reef", name: "霓虹狮子鱼", tier: "normal", basePrice: 1, color: "#ff9a62", image: "assets/fish/kenney/Vector/fish_orange.svg", imageScale: 1.68, flip: false, accent: "#ffe0a0", pattern: "stripe", motion: "steady" },
    { id: "crystal_turtle", zone: "reef", name: "水晶海龟", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#72e3ca", image: "assets/fish/kenney/Vector/fish_green.svg", imageScale: 1.74, flip: true, accent: "#d9fff8", pattern: "scales", motion: "heavy" },
    { id: "gloom_sword", zone: "deep", name: "幽暗剑鱼", tier: "normal", basePrice: 1, color: "#7ea8c8", image: "assets/fish/kenney/Vector/fish_grey.svg", imageScale: 1.82, flip: false, accent: "#cfefff", pattern: "stripe", motion: "fast", stretch: 1.2 },
    { id: "plasma_manta", zone: "deep", name: "等离子鳐", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#997eff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.05, flip: true, accent: "#ddd4ff", pattern: "glow", motion: "glide", stretch: 1.28 },
    { id: "nebula_eel", zone: "abyss", name: "星云鳗", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#825fff", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.9, flip: false, accent: "#e3dcff", pattern: "stars", motion: "ribbon", stretch: 1.35 },
    { id: "titan_whale", zone: "abyss", name: "泰坦鲸", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#78a7e8", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.25, flip: true, accent: "#dceaff", pattern: "scales", motion: "hero", stretch: 1.25 },
    { id: "crystal_smelt", zone: "aurora", name: "冰晶银鱼", tier: "normal", basePrice: 1, color: "#a8f4ff", image: "assets/fish/kenney/Vector/fish_grey_long_a.svg", imageScale: 1.62, flip: false, accent: "#f2ffff", pattern: "crystal", motion: "school", glow: 0.25 },
    { id: "aurora_cod", zone: "aurora", name: "极光鳕", tier: "normal", basePrice: 1, color: "#71d8d1", image: "assets/fish/kenney/Vector/fish_green.svg", imageScale: 1.8, flip: true, accent: "#bdfff3", pattern: "aurora", motion: "steady", glow: 0.2 },
    { id: "phosphor_ray", zone: "aurora", name: "磷光魟", tier: "normal", basePrice: 1, color: "#70b9ff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.02, flip: false, accent: "#d8f4ff", pattern: "glow", motion: "glide", glow: 0.35 },
    { id: "cobalt_marlin", zone: "aurora", name: "幽蓝旗鱼", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#3f91ff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.08, flip: true, accent: "#b9e4ff", pattern: "stripe", motion: "fast", stretch: 1.26, glow: 0.45 },
    { id: "aurora_dragon_eel", zone: "aurora", name: "极光龙鳗", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#71f2cd", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 2.02, flip: false, accent: "#e0fff6", pattern: "aurora", motion: "ribbon", stretch: 1.42, glow: 0.5 },
    { id: "sky_jelly", zone: "aurora", name: "天穹水母", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#d7b8ff", image: "assets/fish/detail/purple-fish-card.png", imageScale: 1.48, flip: true, accent: "#ffffff", pattern: "stars", motion: "drift", glow: 0.8, detail: true },
    { id: "magma_bass", zone: "rift", name: "熔纹鲈", tier: "normal", basePrice: 1, color: "#e2774a", image: "assets/fish/kenney/Vector/fish_orange.svg", imageScale: 1.72, flip: false, accent: "#ffd29a", pattern: "lava", motion: "steady", glow: 0.28 },
    { id: "blacksmoke_eel", zone: "rift", name: "黑烟鳗", tier: "normal", basePrice: 1, color: "#7b6787", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 1.88, flip: true, accent: "#d4cae2", pattern: "smoke", motion: "ribbon", stretch: 1.38 },
    { id: "flame_marlin", zone: "rift", name: "火纹马林", tier: "normal", basePrice: 1, color: "#ff8757", image: "assets/fish/kenney/Vector/fish_red.svg", imageScale: 2.05, flip: false, accent: "#ffe0b0", pattern: "lava", motion: "fast", stretch: 1.25, glow: 0.34 },
    { id: "ember_snapper", zone: "rift", name: "熔心鲷", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#ff6745", image: "assets/fish/kenney/Vector/fish_red.svg", imageScale: 1.92, flip: true, accent: "#fff0bf", pattern: "ember", motion: "steady", glow: 0.55 },
    { id: "lava_goblin_shark", zone: "rift", name: "熔岩鬼鲛", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#c64d35", image: "assets/fish/kenney/Vector/fish_brown.svg", imageScale: 2.12, flip: false, accent: "#ffd27d", pattern: "lava", motion: "glide", stretch: 1.2, glow: 0.62 },
    { id: "primordial_whalefish", zone: "rift", name: "太古炎鲸", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#ffb15c", image: "assets/fish/detail/aqua-fish-card.png", imageScale: 2.18, flip: true, accent: "#fff0c8", pattern: "ember", motion: "hero", stretch: 1.3, glow: 0.9, detail: true },
    { id: "relic_damselfish", zone: "city", name: "遗迹雀鲷", tier: "normal", basePrice: 1, color: "#7dc6b8", image: "assets/fish/kenney/Vector/fish_green.svg", imageScale: 1.72, flip: false, accent: "#d9fff4", pattern: "scales", motion: "steady" },
    { id: "titanium_barracuda", zone: "city", name: "钛壳梭鱼", tier: "normal", basePrice: 1, color: "#9fb4c9", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 2.04, flip: true, accent: "#f0fbff", pattern: "circuit", motion: "fast", stretch: 1.34, glow: 0.35 },
    { id: "blue_steel_pomfret", zone: "city", name: "蓝钢鲳", tier: "normal", basePrice: 1, color: "#769fe5", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 1.96, flip: false, accent: "#dceaff", pattern: "scales", motion: "heavy", glow: 0.25 },
    { id: "watcher_swordfish", zone: "city", name: "守望剑鱼", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#5fb5e8", image: "assets/fish/kenney/Vector/fish_grey.svg", imageScale: 2.16, flip: true, accent: "#d9f5ff", pattern: "circuit", motion: "fast", stretch: 1.38, glow: 0.55 },
    { id: "mech_ghost_shark", zone: "city", name: "机械幽灵鲨", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#7f88b8", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.24, flip: false, accent: "#d8ddff", pattern: "circuit", motion: "glide", stretch: 1.28, glow: 0.62 },
    { id: "abyss_core", zone: "city", name: "深海智核", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#88ffe8", image: "assets/fish/detail/aqua-fish-card.png", imageScale: 1.62, flip: true, accent: "#ffffff", pattern: "core", motion: "drift", glow: 1.0, detail: true },
    { id: "stardust_sardine", zone: "void", name: "星尘沙丁", tier: "normal", basePrice: 1, color: "#b7d0ff", image: "assets/fish/kenney/Vector/fish_grey_long_a.svg", imageScale: 1.54, flip: false, accent: "#ffffff", pattern: "stars", motion: "school", glow: 0.38 },
    { id: "phantom_moon_ray", zone: "void", name: "幻月鳐", tier: "normal", basePrice: 1, color: "#b69cff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.08, flip: true, accent: "#f3ecff", pattern: "moon", motion: "glide", stretch: 1.1, glow: 0.45 },
    { id: "void_tuna", zone: "void", name: "虚空金枪", tier: "normal", basePrice: 1, color: "#6f7dff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.02, flip: false, accent: "#e5e8ff", pattern: "void", motion: "fast", stretch: 1.26, glow: 0.5 },
    { id: "gravity_oarfish", zone: "void", name: "重力皇带", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#c9b8ff", image: "assets/fish/kenney/Vector/fish_grey_long_b.svg", imageScale: 2.28, flip: true, accent: "#ffffff", pattern: "gravity", motion: "ribbon", stretch: 1.5, glow: 0.7 },
    { id: "void_whale", zone: "void", name: "归墟龙鲸", tier: "rare", basePrice: RARE_BASE_VALUE, color: "#728cff", image: "assets/fish/kenney/Vector/fish_blue.svg", imageScale: 2.3, flip: false, accent: "#dce6ff", pattern: "void", motion: "hero", stretch: 1.32, glow: 0.75 },
    { id: "genesis_whale", zone: "void", name: "创世星鲸", tier: "legendary", basePrice: LEGENDARY_BASE_VALUE, color: "#e8ddff", image: "assets/fish/detail/purple-fish-card.png", imageScale: 2.45, flip: true, accent: "#ffffff", pattern: "constellation", motion: "hero", stretch: 1.38, glow: 1.0, detail: true }
  ];

  const branches = [
    {
      id: "net_mastery",
      name: "手撒网精通",
      label: "手撒网",
      color: "#67e8f9",
      nodes: [
        {
          id: "wide_net",
          tier: 1,
          name: "阔口渔网",
          max: 10,
          baseCost: 12,
          prerequisite: null,
          description: "扩大网口，提高每次撒网的捕获数量。",
          effect: (level) => `当前单网捕获 +${level * 15}%；升级后 +${(level + 1) * 15}%`
        },
        {
          id: "fine_mesh",
          tier: 2,
          name: "密眼渔网",
          max: 10,
          baseCost: 36,
          prerequisite: { id: "wide_net", level: 2 },
          description: "减少鱼从网眼逃逸，降低空网概率。",
          effect: (level) => `当前空网率 -${level * 8}%；升级后再降 8%`
        },
        {
          id: "tough_rope",
          tier: 3,
          name: "坚韧网绳",
          max: 10,
          baseCost: 95,
          prerequisite: { id: "fine_mesh", level: 3 },
          description: "强化网绳结构，增加单次双倍捕获几率。",
          effect: (level) => `当前双倍概率 ${level * 5}%；升级后 +5%`
        },
        {
          id: "sky_net",
          tier: 4,
          name: "天罗地网",
          max: 1,
          baseCost: 1200,
          prerequisite: { id: "tough_rope", level: 5 },
          description: "终极技能：覆盖全屏海面，并使单次捕量翻倍。",
          effect: (level) => level ? "已生效：全屏撒网，单次捕量 +100%" : "升级后：全屏撒网，单次捕量 +100%"
        }
      ]
    },
    {
      id: "automation",
      name: "自动化渔场",
      label: "AUTOMATION",
      color: "#63e6a6",
      nodes: [
        {
          id: "trawler",
          tier: 1,
          name: "小型拖网船",
          max: 10,
          baseCost: 20,
          prerequisite: null,
          description: "派遣拖网船自动撒网，持续产出渔获。",
          effect: (level) => `当前自动撒网 ${(level * 0.15).toFixed(2)} 次/秒；升级后 +0.15`
        },
        {
          id: "cold_storage",
          tier: 2,
          name: "冷藏鱼舱",
          max: 10,
          baseCost: 55,
          prerequisite: { id: "trawler", level: 1 },
          description: "扩建冷藏空间，提高鱼舱总容量。",
          effect: (level) => `当前容量 ${CAP_BASE + level * 30}；升级后 +30`
        },
        {
          id: "vending_machine",
          tier: 3,
          name: "自动售卖机",
          max: 10,
          baseCost: 135,
          prerequisite: { id: "cold_storage", level: 3 },
          description: "鱼舱满时自动出售，并提高全部渔获售价。",
          effect: (level) => level ? `自动售卖已解锁，当前溢价 +${level * 5}%` : "升级后：鱼舱满自动出售，每级售价 +5%"
        },
        {
          id: "ocean_fleet",
          tier: 4,
          name: "远洋捕捞队",
          max: 1,
          baseCost: 1800,
          prerequisite: { id: "vending_machine", level: 3 },
          description: "终极技能：自动撒网速度翻倍，离线收益上限提升至 12 小时。",
          effect: (level) => level ? "已生效：自动速度 ×2，离线上限 12 小时" : "升级后：自动速度 ×2，离线上限 12 小时"
        }
      ]
    },
    {
      id: "detection",
      name: "探鱼增益",
      label: "DETECTION",
      color: "#ffd166",
      nodes: [
        {
          id: "sonar",
          tier: 1,
          name: "声呐探鱼器",
          max: 10,
          baseCost: 18,
          prerequisite: null,
          description: "探测高价值鱼群，提升稀有鱼出现概率。",
          effect: (level) => `当前稀有鱼概率 +${level * 3}%；升级后 +3%`
        },
        {
          id: "processing_workshop",
          tier: 2,
          name: "渔获加工坊",
          max: 10,
          baseCost: 48,
          prerequisite: { id: "sonar", level: 1 },
          description: "解锁渔获加工；加工后的鱼售价翻倍，等级提高加工速度。",
          effect: (level) => level ? `可加工 ${level * 5} 条/次，加工售价 ×2` : "升级后：解锁加工，每次可加工 5 条鱼"
        },
        {
          id: "golden_lure",
          tier: 3,
          name: "黄金鱼诱",
          max: 10,
          baseCost: 120,
          prerequisite: { id: "processing_workshop", level: 3 },
          description: "用金色诱饵吸引传说鱼，每级提高传说鱼概率。",
          effect: (level) => `当前传说鱼概率 +${level}%；升级后 +1%`
        },
        {
          id: "school_beacon",
          tier: 4,
          name: "鱼群信标",
          max: 1,
          baseCost: 1600,
          prerequisite: { id: "golden_lure", level: 5 },
          description: "终极技能：鱼群密度翻倍，并使全部渔获售价提高 50%。",
          effect: (level) => level ? "已生效：捕获数量 ×2，全鱼售价 +50%" : "升级后：捕获数量 ×2，全鱼售价 +50%"
        }
      ]
    }
  ];

  branches.push(
    { id: "fleet_synergy", name: "舰队协同", label: "舰队协同", color: "#52e0d0", nodes: [] },
    { id: "leviathan", name: "巨兽科研", label: "巨兽科研", color: "#ffb35c", nodes: [] }
  );

  const extraNodes = [
    { branch: "net_mastery", node: { ...{"id":"deep_winch","tier":2,"name":"深海绞盘","max":10,"baseCost":72,"prerequisite":{"id":"wide_net","level":4},"description":"液压绞盘扩大有效收网范围并提高捕获数量。"}, effect: (level) => `当前捕获数量 +${level * 5}%；升级后 +5%` } },
    { branch: "net_mastery", node: { ...{"id":"resonance_mesh","tier":3,"name":"共鸣网阵","max":10,"baseCost":180,"prerequisites":[{"id":"deep_winch","level":3},{"id":"sonar","level":2}],"description":"跨系统共振网阵，稳定提高传说鱼概率。"}, effect: (level) => `当前传说鱼概率 +${(level * 0.5).toFixed(1)}%；升级后 +0.5%` } },
    { branch: "automation", node: { ...{"id":"nav_module","tier":2,"name":"量子导航仪","max":10,"baseCost":76,"prerequisite":{"id":"trawler","level":2},"description":"自动追踪鱼群，提高拖网船的可持续运转速度。"}, effect: (level) => `自动速度 +${level * 4}%；升级后 +4%` } },
    { branch: "automation", node: { ...{"id":"deep_exchange","tier":3,"name":"深蓝交易所","max":10,"baseCost":170,"prerequisites":[{"id":"vending_machine","level":1},{"id":"nav_module","level":2}],"description":"建立深海贸易链路，提高所有出售收益。"}, effect: (level) => `全鱼售价 +${level * 2}%；升级后 +2%` } },
    { branch: "detection", node: { ...{"id":"fish_radar","tier":2,"name":"鱼群雷达","max":10,"baseCost":68,"prerequisite":{"id":"sonar","level":2},"description":"锁定鱼群热区，提高稀有鱼出现概率。"}, effect: (level) => `稀有鱼概率 +${level}%；升级后 +1%` } },
    { branch: "detection", node: { ...{"id":"bio_light","tier":3,"name":"生物光源","max":10,"baseCost":155,"prerequisites":[{"id":"processing_workshop","level":1},{"id":"fish_radar","level":2}],"description":"用仿生光源提升加工渔获的价值。"}, effect: (level) => `加工售价加成 +${(level * 2.5).toFixed(1)}%；升级后 +2.5%` } }
  ];

  const nodeEffect = (label) => (level) => `当前${label} ${level} 层；升级后增加一层效果`;

  extraNodes.push(
    { branch: "net_mastery", node: { ...{"id":"hydraulic_buoy","tier":2,"name":"液压浮标","max":10,"baseCost":80,"stat":{"emptyPct":0.01},"prerequisite":{"id":"wide_net","level":5},"description":"以液压浮标稳定网口，降低空网率。"}, effect: nodeEffect("空网率降低") } },
    { branch: "net_mastery", node: { ...{"id":"parallel_mesh","tier":3,"name":"并联网阵","max":10,"baseCost":150,"stat":{"catchPct":0.03},"prerequisite":{"id":"deep_winch","level":4},"description":"双层并联网扩大有效捕捞量。"}, effect: nodeEffect("捕获量") } },
    { branch: "net_mastery", node: { ...{"id":"magnetic_reel","tier":4,"name":"磁力收网","max":10,"baseCost":300,"stat":{"doubleChance":0.02},"prerequisite":{"id":"tough_rope","level":4},"description":"磁力牵引收网，提高双倍捕获概率。"}, effect: nodeEffect("双倍概率") } },
    { branch: "net_mastery", node: { ...{"id":"alloy_net","tier":4,"name":"合金网衣","max":10,"baseCost":320,"stat":{"rareValuePct":0.05},"prerequisites":[{"id":"resonance_mesh","level":3},{"id":"fine_mesh","level":5}],"description":"合金网衣提高稀有渔获价值。"}, effect: nodeEffect("稀有鱼售价") } },
    { branch: "net_mastery", node: { ...{"id":"abyss_guide","tier":5,"name":"深渊导网","max":10,"baseCost":720,"stat":{"catchPct":0.05},"prerequisites":[{"id":"magnetic_reel","level":3},{"id":"fish_radar","level":3}],"description":"深渊导引网自动追踪密集鱼群。"}, effect: nodeEffect("全局捕获量") } },
    { branch: "net_mastery", node: { ...{"id":"void_harvest","tier":6,"name":"虚空渔获","max":10,"baseCost":1500,"stat":{"catchPct":0.07,"sellPct":0.01},"prerequisites":[{"id":"abyss_guide","level":4},{"id":"ocean_fleet","level":2}],"description":"虚空渔获协议同时增加捕获与售价。"}, effect: nodeEffect("捕获与售价") } },
    { branch: "automation", node: { ...{"id":"auto_sonar","tier":2,"name":"自动声呐","max":10,"baseCost":85,"stat":{"autoRate":0.02},"prerequisite":{"id":"trawler","level":3},"description":"自动声呐提升拖网船撒网频率。"}, effect: nodeEffect("自动频率") } },
    { branch: "automation", node: { ...{"id":"cargo_ai","tier":3,"name":"货舱 AI","max":10,"baseCost":160,"stat":{"capacity":20},"prerequisite":{"id":"cold_storage","level":3},"description":"货舱 AI 优化空间分配，扩大鱼舱。"}, effect: nodeEffect("鱼舱容量") } },
    { branch: "automation", node: { ...{"id":"route_planner","tier":4,"name":"航线规划","max":10,"baseCost":300,"stat":{"autoRatePct":0.03},"prerequisite":{"id":"nav_module","level":3},"description":"规划更高效的自动捕捞航线。"}, effect: nodeEffect("自动速度") } },
    { branch: "automation", node: { ...{"id":"trade_ai","tier":4,"name":"贸易 AI","max":10,"baseCost":310,"stat":{"sellPct":0.01},"prerequisite":{"id":"deep_exchange","level":3},"description":"贸易 AI 自动寻找更高售价。"}, effect: nodeEffect("全部售价") } },
    { branch: "automation", node: { ...{"id":"drone_swarm","tier":5,"name":"无人机群","max":10,"baseCost":720,"stat":{"autoDouble":0.02},"prerequisites":[{"id":"deep_exchange","level":4},{"id":"vending_machine","level":4}],"description":"无人机群提高自动撒网双倍概率。"}, effect: nodeEffect("自动双倍概率") } },
    { branch: "automation", node: { ...{"id":"abyss_armada","tier":6,"name":"深渊舰队","max":10,"baseCost":1500,"stat":{"autoRatePct":0.15,"offlineHours":2},"prerequisites":[{"id":"drone_swarm","level":4},{"id":"ocean_fleet","level":1}],"description":"深渊舰队提升自动效率和离线上限。"}, effect: nodeEffect("自动与离线收益") } },
    { branch: "detection", node: { ...{"id":"thermal_scope","tier":2,"name":"热成像仪","max":10,"baseCost":75,"stat":{"rareChance":0.005},"prerequisite":{"id":"sonar","level":3},"description":"热成像锁定稀有鱼群。"}, effect: nodeEffect("稀有鱼概率") } },
    { branch: "detection", node: { ...{"id":"bio_sonar","tier":3,"name":"生物声呐","max":10,"baseCost":155,"stat":{"processPct":0.015},"prerequisite":{"id":"processing_workshop","level":3},"description":"生物声呐提高加工渔获价值。"}, effect: nodeEffect("加工价值") } },
    { branch: "detection", node: { ...{"id":"deep_tracker","tier":4,"name":"深海追踪器","max":10,"baseCost":300,"stat":{"legendChance":0.004},"prerequisite":{"id":"golden_lure","level":3},"description":"追踪深海传说鱼群。"}, effect: nodeEffect("传说鱼概率") } },
    { branch: "detection", node: { ...{"id":"school_sync","tier":4,"name":"鱼群同步","max":10,"baseCost":320,"stat":{"catchPct":0.03},"prerequisite":{"id":"fish_radar","level":3},"description":"同步鱼群运动轨迹，提高捕获量。"}, effect: nodeEffect("全局捕获量") } },
    { branch: "detection", node: { ...{"id":"anomaly_ai","tier":5,"name":"异常预测 AI","max":10,"baseCost":700,"stat":{"eventRate":0.08},"prerequisites":[{"id":"bio_light","level":4},{"id":"fish_radar","level":4}],"description":"预测异常海况，提高事件触发频率。"}, effect: nodeEffect("事件频率") } },
    { branch: "detection", node: { ...{"id":"leviathan_codex","tier":6,"name":"巨兽图鉴","max":10,"baseCost":1500,"stat":{"sellPct":0.1},"prerequisites":[{"id":"anomaly_ai","level":4},{"id":"abyss_guide","level":3}],"description":"完成巨兽图鉴获得巨额售价加成。"}, effect: nodeEffect("全部售价") } },
    { branch: "net_mastery", node: { ...{"id":"echo_hull","tier":7,"name":"回声网舱","max":10,"baseCost":4200,"stat":{"catchPct":0.06},"prerequisite":{"id":"void_harvest","level":3},"description":"回声网舱让每一层网面独立追踪鱼群。"}, effect: (level) => `当前捕获数量 +${level * 6}%；升级后 +6%` } },
    { branch: "net_mastery", node: { ...{"id":"void_drive","tier":8,"name":"虚空驱动","max":10,"baseCost":12000,"stat":{"allYieldPct":0.04,"catchPct":0.04},"prerequisites":[{"id":"echo_hull","level":5},{"id":"singularity_fleet","level":2}],"description":"将深渊能量注入收网驱动，提升整体渔获。"}, effect: (level) => `全收益 +${level * 4}%；升级后 +4%` } },
    { branch: "automation", node: { ...{"id":"fleet_ai","tier":7,"name":"舰队 AI","max":10,"baseCost":4200,"stat":{"autoRatePct":0.08,"autoDouble":0.01},"prerequisite":{"id":"abyss_armada","level":3},"description":"舰队 AI 协调整支船队并自动修正航线。"}, effect: (level) => `自动速度 +${level * 8}%；升级后 +8%` } },
    { branch: "automation", node: { ...{"id":"singularity_dock","tier":8,"name":"奇点船坞","max":10,"baseCost":12000,"stat":{"autoRatePct":0.1,"offlineHours":3},"prerequisites":[{"id":"fleet_ai","level":5},{"id":"deep_dock","level":2}],"description":"奇点船坞延长离线续航并提高舰队上限。"}, effect: (level) => `自动与离线效率 +${level * 10}%；升级后 +10%` } },
    { branch: "detection", node: { ...{"id":"bio_radar","tier":7,"name":"生态雷达","max":10,"baseCost":4200,"stat":{"rareChance":0.008,"hotspotRadiusPct":0.04},"prerequisite":{"id":"leviathan_codex","level":3},"description":"生态雷达读取鱼群密度与捕食压力。"}, effect: (level) => `稀有率 +${(level * 0.8).toFixed(1)}%；升级后 +0.8%` } },
    { branch: "detection", node: { ...{"id":"leviathan_echo","tier":8,"name":"巨兽回声","max":10,"baseCost":12000,"stat":{"legendChance":0.003,"bossRewardPct":0.08},"prerequisites":[{"id":"bio_radar","level":5},{"id":"weakpoint_lens","level":3}],"description":"巨兽回声记录首领弱点与传说信号。"}, effect: (level) => `首领奖励 +${level * 8}%；升级后 +8%` } },
    { branch: "fleet_synergy", node: { ...{"id":"gear_interface","tier":1,"name":"装备接口","max":10,"baseCost":120,"stat":{"skillHastePct":0.03},"description":"标准化装备接口降低主动技冷却。"}, effect: (level) => `技能急速 +${level * 3}%；升级后 +3%` } },
    { branch: "fleet_synergy", node: { ...{"id":"autoloader","tier":1,"name":"自动装填","max":10,"baseCost":140,"stat":{"autoRatePct":0.025},"description":"自动装填系统提高自动撒网效率。"}, effect: (level) => `自动速度 +${(level * 2.5).toFixed(1)}%；升级后 +2.5%` } },
    { branch: "fleet_synergy", node: { ...{"id":"skill_capacitor","tier":2,"name":"技能电容","max":10,"baseCost":260,"stat":{"skillHastePct":0.04},"prerequisite":{"id":"gear_interface","level":2},"description":"技能电容缩短主动技能冷却。"}, effect: (level) => `技能急速 +${level * 4}%；升级后 +4%` } },
    { branch: "fleet_synergy", node: { ...{"id":"set_resonance","tier":2,"name":"套装共振","max":10,"baseCost":300,"stat":{"allYieldPct":0.02,"gearDropPct":0.01},"prerequisite":{"id":"autoloader","level":2},"description":"套装共振提高装备掉落和全收益。"}, effect: (level) => `全收益 +${level * 2}%；升级后 +2%` } },
    { branch: "fleet_synergy", node: { ...{"id":"drone_targeting","tier":3,"name":"无人机瞄准","max":10,"baseCost":560,"stat":{"catchPct":0.04,"bossPowerPct":0.02},"prerequisite":{"id":"skill_capacitor","level":3},"description":"无人机标定弱点与密集鱼群。"}, effect: (level) => `捕获量 +${level * 4}%；升级后 +4%` } },
    { branch: "fleet_synergy", node: { ...{"id":"alloy_loop","tier":3,"name":"合金闭环","max":10,"baseCost":620,"stat":{"gearDropPct":0.02},"prerequisite":{"id":"set_resonance","level":3},"description":"回收重复装备形成合金闭环。"}, effect: (level) => `装备保底 +${level * 2}%；升级后 +2%` } },
    { branch: "fleet_synergy", node: { ...{"id":"overclock_core","tier":4,"name":"超频核心","max":10,"baseCost":1100,"stat":{"skillHastePct":0.05,"autoRatePct":0.04},"prerequisite":{"id":"drone_targeting","level":3},"description":"核心超频让技能与自动网同步运转。"}, effect: (level) => `技能急速 +${level * 5}%；升级后 +5%` } },
    { branch: "fleet_synergy", node: { ...{"id":"fleet_ai_link","tier":4,"name":"舰队链路","max":10,"baseCost":1200,"stat":{"autoRatePct":0.06,"allYieldPct":0.02},"prerequisite":{"id":"alloy_loop","level":3},"description":"舰队数据链提升自动与出售效率。"}, effect: (level) => `自动速度 +${level * 6}%；升级后 +6%` } },
    { branch: "fleet_synergy", node: { ...{"id":"deep_dock","tier":5,"name":"深潜船坞","max":10,"baseCost":2400,"stat":{"offlineHours":2,"startingGold":2500},"prerequisites":[{"id":"overclock_core","level":4},{"id":"fleet_ai_link","level":3}],"description":"扩展离线收益和下一轮启动资金。"}, effect: (level) => `离线上限 +${level * 2} 小时；升级后 +2` } },
    { branch: "fleet_synergy", node: { ...{"id":"kinetic_engine","tier":5,"name":"动能引擎","max":10,"baseCost":2600,"stat":{"autoRatePct":0.09},"prerequisite":{"id":"fleet_ai_link","level":4},"description":"把潮汐转化为持续推力。"}, effect: (level) => `自动速度 +${level * 9}%；升级后 +9%` } },
    { branch: "fleet_synergy", node: { ...{"id":"flagship_core","tier":6,"name":"旗舰核心","max":10,"baseCost":5200,"stat":{"allYieldPct":0.05,"skillHastePct":0.04},"prerequisites":[{"id":"deep_dock","level":4},{"id":"kinetic_engine","level":4}],"description":"连接全部装备系统。"}, effect: (level) => `全收益 +${level * 5}%；升级后 +5%` } },
    { branch: "fleet_synergy", node: { ...{"id":"set_overdrive","tier":6,"name":"套装超载","max":10,"baseCost":5600,"stat":{"catchPct":0.06,"bossPowerPct":0.04},"prerequisite":{"id":"flagship_core","level":3},"description":"让套装效果作用于首领战。"}, effect: (level) => `首领效率 +${level * 4}%；升级后 +4%` } },
    { branch: "fleet_synergy", node: { ...{"id":"quantum_cargo","tier":7,"name":"量子货舱","max":10,"baseCost":11000,"stat":{"capacity":70,"allYieldPct":0.03},"prerequisites":[{"id":"flagship_core","level":5},{"id":"set_overdrive","level":4}],"description":"折叠空间，扩大鱼舱容量。"}, effect: (level) => `鱼舱容量 +${level * 70}；升级后 +70` } },
    { branch: "fleet_synergy", node: { ...{"id":"phase_harvester","tier":7,"name":"相位收割","max":10,"baseCost":13000,"stat":{"catchPct":0.08,"doubleChance":0.005},"prerequisite":{"id":"set_overdrive","level":5},"description":"提高双倍捕获和全局收益。"}, effect: (level) => `捕获量 +${level * 8}%；升级后 +8%` } },
    { branch: "fleet_synergy", node: { ...{"id":"singularity_fleet","tier":8,"name":"奇点舰队","max":10,"baseCost":32000,"stat":{"allYieldPct":0.08,"autoRatePct":0.08},"prerequisites":[{"id":"quantum_cargo","level":5},{"id":"phase_harvester","level":5}],"description":"整合所有自动化与收益模块。"}, effect: (level) => `全收益 +${level * 8}%；升级后 +8%` } },
    { branch: "fleet_synergy", node: { ...{"id":"aegis_network","tier":8,"name":"神盾网络","max":10,"baseCost":36000,"stat":{"offlineHours":3,"bossRewardPct":0.1},"prerequisite":{"id":"singularity_fleet","level":3},"description":"保护离线收益和首领奖励。"}, effect: (level) => `首领奖励 +${level * 10}%；升级后 +10%` } },
    { branch: "leviathan", node: { ...{"id":"sonar_archive","tier":1,"name":"声呐档案","max":10,"baseCost":130,"stat":{"hotspotDurationPct":0.05},"description":"记录声呐回声，延长热点持续时间。"}, effect: (level) => `热点持续 +${level * 5}%；升级后 +5%` } },
    { branch: "leviathan", node: { ...{"id":"weakpoint_lens","tier":1,"name":"弱点透镜","max":10,"baseCost":150,"stat":{"bossPowerPct":0.04},"description":"识别首领弱点并提高猎杀效率。"}, effect: (level) => `首领效率 +${level * 4}%；升级后 +4%` } },
    { branch: "leviathan", node: { ...{"id":"phase_breaker","tier":2,"name":"阶段破译","max":10,"baseCost":280,"stat":{"bossPowerPct":0.05},"prerequisite":{"id":"weakpoint_lens","level":2},"description":"解析阶段变化，破甲更快。"}, effect: (level) => `首领效率 +${level * 5}%；升级后 +5%` } },
    { branch: "leviathan", node: { ...{"id":"trophy_analyzer","tier":2,"name":"奖杯解析","max":10,"baseCost":320,"stat":{"bossRewardPct":0.04},"prerequisite":{"id":"sonar_archive","level":2},"description":"提高首领奖杯与奖励品质。"}, effect: (level) => `首领奖励 +${level * 4}%；升级后 +4%` } },
    { branch: "leviathan", node: { ...{"id":"boss_armor","tier":3,"name":"巨兽装甲","max":10,"baseCost":620,"stat":{"bossPowerPct":0.06,"allYieldPct":0.01},"prerequisite":{"id":"phase_breaker","level":3},"description":"强化船队承受首领战。"}, effect: (level) => `首领效率 +${level * 6}%；升级后 +6%` } },
    { branch: "leviathan", node: { ...{"id":"hunt_contract","tier":3,"name":"猎杀契约","max":10,"baseCost":650,"stat":{"bossRewardPct":0.05},"prerequisite":{"id":"trophy_analyzer","level":3},"description":"提升首领掉落和保底奖励。"}, effect: (level) => `首领奖励 +${level * 5}%；升级后 +5%` } },
    { branch: "leviathan", node: { ...{"id":"apex_sonar","tier":4,"name":"顶级声呐","max":10,"baseCost":1200,"stat":{"hotspotRadiusPct":0.05,"rareChance":0.004},"prerequisite":{"id":"boss_armor","level":3},"description":"扩大弱点搜索范围。"}, effect: (level) => `热点范围 +${level * 5}%；升级后 +5%` } },
    { branch: "leviathan", node: { ...{"id":"loot_resonance","tier":4,"name":"奖励共振","max":10,"baseCost":1300,"stat":{"gearDropPct":0.03,"allYieldPct":0.02},"prerequisite":{"id":"hunt_contract","level":3},"description":"提高装备与金币产出。"}, effect: (level) => `装备掉落 +${level * 3}%；升级后 +3%` } },
    { branch: "leviathan", node: { ...{"id":"leviathan_lure","tier":5,"name":"巨兽诱饵","max":10,"baseCost":2600,"stat":{"legendChance":0.004},"prerequisites":[{"id":"apex_sonar","level":4},{"id":"golden_lure","level":4}],"description":"让传说鱼回应声呐。"}, effect: (level) => `传说率 +${(level * 0.4).toFixed(1)}%；升级后 +0.4%` } },
    { branch: "leviathan", node: { ...{"id":"deep_strike","tier":5,"name":"深潜打击","max":10,"baseCost":2800,"stat":{"bossPowerPct":0.08},"prerequisite":{"id":"loot_resonance","level":4},"description":"提高终结阶段输出。"}, effect: (level) => `首领效率 +${level * 8}%；升级后 +8%` } },
    { branch: "leviathan", node: { ...{"id":"boss_guarantee","tier":6,"name":"首领保底","max":10,"baseCost":5600,"stat":{"bossRewardPct":0.08},"prerequisites":[{"id":"leviathan_lure","level":3},{"id":"deep_strike","level":3}],"description":"让首领奖励保底累计更稳定。"}, effect: (level) => `首领奖励 +${level * 8}%；升级后 +8%` } },
    { branch: "leviathan", node: { ...{"id":"titan_slayer","tier":6,"name":"泰坦猎手","max":10,"baseCost":6000,"stat":{"bossPowerPct":0.1,"catchPct":0.03},"prerequisite":{"id":"deep_strike","level":4},"description":"提高所有阶段伤害。"}, effect: (level) => `首领效率 +${level * 10}%；升级后 +10%` } },
    { branch: "leviathan", node: { ...{"id":"abyss_intel","tier":7,"name":"深渊情报","max":10,"baseCost":12000,"stat":{"bossRewardPct":0.1,"skillHastePct":0.03},"prerequisites":[{"id":"boss_guarantee","level":5},{"id":"titan_slayer","level":4}],"description":"让首领行动提前可视化。"}, effect: (level) => `首领奖励 +${level * 10}%；升级后 +10%` } },
    { branch: "leviathan", node: { ...{"id":"protocol_memory","tier":7,"name":"协议记忆","max":10,"baseCost":14000,"stat":{"startingGold":5000,"startingTalent":1},"prerequisite":{"id":"titan_slayer","level":5},"description":"保留更多跃迁后的启动资源。"}, effect: (level) => `初始金币 +${level * 5000}；升级后 +5000` } },
    { branch: "leviathan", node: { ...{"id":"leviathan_mastery","tier":8,"name":"巨兽精通","max":10,"baseCost":34000,"stat":{"bossPowerPct":0.15,"bossRewardPct":0.15},"prerequisites":[{"id":"abyss_intel","level":5},{"id":"protocol_memory","level":5}],"description":"同时强化所有首领阶段。"}, effect: (level) => `首领效率 +${level * 15}%；升级后 +15%` } },
    { branch: "leviathan", node: { ...{"id":"ascension_archive","tier":8,"name":"跃迁档案","max":10,"baseCost":38000,"stat":{"allYieldPct":0.06,"skillHastePct":0.05},"prerequisite":{"id":"leviathan_mastery","level":3},"description":"把猎杀数据转化为永久战力。"}, effect: (level) => `全收益 +${level * 6}%；升级后 +6%` } }
  );

  let allNodes = branches.flatMap((branch) => branch.nodes);
  const nodeLayouts = {
    wide_net: { col: 1, row: 1 }, fine_mesh: { col: 0, row: 2 }, tough_rope: { col: 2, row: 3 }, sky_net: { col: 1, row: 4 },
    deep_winch: { col: 2, row: 2 }, resonance_mesh: { col: 0, row: 3 },
    trawler: { col: 1, row: 1 }, cold_storage: { col: 0, row: 2 }, vending_machine: { col: 2, row: 3 }, ocean_fleet: { col: 1, row: 4 },
    nav_module: { col: 2, row: 2 }, deep_exchange: { col: 0, row: 3 },
    sonar: { col: 1, row: 1 }, processing_workshop: { col: 0, row: 2 }, golden_lure: { col: 2, row: 3 }, school_beacon: { col: 1, row: 4 },
    fish_radar: { col: 2, row: 2 }, bio_light: { col: 0, row: 3 }
  };
  const nodeIcons = { wide_net: "◎", fine_mesh: "∴", tough_rope: "⌁", sky_net: "✶", deep_winch: "⚓", resonance_mesh: "◈", trawler: "▰", cold_storage: "▣", vending_machine: "◆", ocean_fleet: "➤", nav_module: "⌖", deep_exchange: "◇", sonar: "◉", processing_workshop: "⚙", golden_lure: "✦", school_beacon: "◎", fish_radar: "◌", bio_light: "✧" };
  Object.assign(nodeIcons, { hydraulic_buoy: "◍", parallel_mesh: "▦", magnetic_reel: "⌾", alloy_net: "⬡", abyss_guide: "◈", void_harvest: "✦", auto_sonar: "◌", cargo_ai: "▣", route_planner: "↗", trade_ai: "◈", drone_swarm: "⦿", abyss_armada: "➤", thermal_scope: "◉", bio_sonar: "◍", deep_tracker: "⌖", school_sync: "≈", anomaly_ai: "◬", leviathan_codex: "✧", echo_hull: "◍", void_drive: "✶", fleet_ai: "⌬", singularity_dock: "⬢", bio_radar: "◌", leviathan_echo: "✹", gear_interface: "⬡", autoloader: "↻", skill_capacitor: "⌁", set_resonance: "◈", drone_targeting: "⌖", alloy_loop: "♻", overclock_core: "⚡", fleet_ai_link: "⌘", deep_dock: "⚓", kinetic_engine: "➤", flagship_core: "✶", set_overdrive: "✦", quantum_cargo: "▣", phase_harvester: "◒", singularity_fleet: "⬢", aegis_network: "⬡", sonar_archive: "▤", weakpoint_lens: "◎", phase_breaker: "⌁", trophy_analyzer: "◆", boss_armor: "▰", hunt_contract: "☠", apex_sonar: "◉", loot_resonance: "◇", leviathan_lure: "✦", deep_strike: "⌖", boss_guarantee: "⬡", titan_slayer: "⚔", abyss_intel: "◬", protocol_memory: "⟲", leviathan_mastery: "✹", ascension_archive: "✧", abyss_singularity: "◉", world_net: "◍", ghost_fleet: "⌘", dyson_dock: "⬢", omniscient_sonar: "◌", origin_codex: "✦" });
  const nodeStats = {
    deep_winch: { catchPct: 0.05 }, resonance_mesh: { legendChance: 0.005 },
    nav_module: { autoRatePct: 0.04 }, deep_exchange: { sellPct: 0.02 },
    fish_radar: { rareChance: 0.01 }, bio_light: { processPct: 0.025 }
  };  allNodes.forEach((node) => {
    node.layout = node.layout || nodeLayouts[node.id] || { col: node.tier % 3, row: node.tier };
    node.icon = node.icon || nodeIcons[node.id] || "•";
    node.stat = { ...(node.stat || {}), ...(nodeStats[node.id] || {}) };
  });
  extraNodes.push(
    { branch: "net_mastery", node: { ...{"id":"abyss_singularity","tier":8,"name":"深渊奇点","max":10,"baseCost":14500,"prerequisites":[{"id":"echo_hull","level":5},{"id":"void_drive","level":3}],"stat":{"catchPct":0.09,"doubleChance":0.004},"description":"将深渊奇点封入网舱，扩大双倍捕获。"}, effect: (level) => `捕获量 +${level * 9}%；升级后 +9%` } },
    { branch: "net_mastery", node: { ...{"id":"world_net","tier":8,"name":"世界网","max":10,"baseCost":39000,"prerequisite":{"id":"abyss_singularity","level":5},"stat":{"catchPct":0.12,"allYieldPct":0.05},"description":"世界网覆盖整片海域，将所有捕获转为稳定收益。"}, effect: (level) => `全收益 +${level * 5}%；升级后 +5%` } },
    { branch: "automation", node: { ...{"id":"ghost_fleet","tier":8,"name":"幽灵舰队","max":10,"baseCost":14500,"prerequisites":[{"id":"fleet_ai","level":5},{"id":"singularity_dock","level":3}],"stat":{"autoRatePct":0.12,"autoDouble":0.02},"description":"无人舰队在暗处持续捕捞。"}, effect: (level) => `自动速度 +${level * 12}%；升级后 +12%` } },
    { branch: "automation", node: { ...{"id":"dyson_dock","tier":8,"name":"戴森船坞",max:10,"baseCost":39000,"prerequisite":{"id":"ghost_fleet","level":5},"stat":{"autoRatePct":0.15,"offlineHours":4},"description":"围绕深海能量构建永不熄火的自动船坞。"}, effect: (level) => `自动与离线 +${level * 15}%；升级后 +15%` } },
    { branch: "detection", node: { ...{"id":"omniscient_sonar","tier":8,"name":"全知声呐","max":10,"baseCost":14500,"prerequisites":[{"id":"bio_radar","level":5},{"id":"leviathan_echo","level":3}],"stat":{"rareChance":0.01,"hotspotDurationPct":0.08},"description":"全知声呐提前显示每一次鱼群和首领移动。"}, effect: (level) => `稀有率 +${level}%；升级后 +1%` } },
    { branch: "detection", node: { ...{"id":"origin_codex","tier":8,"name":"起源图鉴","max":10,"baseCost":39000,"prerequisite":{"id":"omniscient_sonar","level":5},"stat":{"legendChance":0.006,"codexYieldPct":0.12},"description":"记录深海起源，图鉴收益永久提升。"}, effect: (level) => `图鉴收益 +${level * 12}%；升级后 +12%` } }
  );
  extraNodes.forEach((entry) => {
    const branch = byId(branches, entry.branch);
    if (branch) branch.nodes.push(entry.node);
  });
  allNodes = branches.flatMap((branch) => branch.nodes);
  allNodes.forEach((node) => {
    node.layout = node.layout || nodeLayouts[node.id] || { col: node.tier % 3, row: node.tier };
    node.icon = node.icon || nodeIcons[node.id] || "•";
    node.stat = { ...(node.stat || {}), ...(nodeStats[node.id] || {}) };
    node.description = node.description || "升级后增强当前模块。";
    if (typeof node.effect !== "function") node.effect = (level) => `当前等级 ${level}；升级后增强效果`;
  });
  branches.forEach((branch) => branch.nodes.forEach((node, index) => {
    node.layout = { col: index % 2 === 0 ? 0 : 2, row: Math.floor(index / 2) + 1 };
  }));
  ["sky_net", "ocean_fleet", "school_beacon"].forEach((id) => { const node = getNode(id); if (node) node.ultimate = true; });
  const skyNet = getNode("sky_net");
  const oceanFleet = getNode("ocean_fleet");
  const schoolBeacon = getNode("school_beacon");
  if (skyNet) { skyNet.prerequisites = [{ id: "tough_rope", level: 5 }, { id: "deep_winch", level: 4 }]; delete skyNet.prerequisite; }
  if (oceanFleet) { oceanFleet.prerequisites = [{ id: "vending_machine", level: 3 }, { id: "nav_module", level: 4 }]; delete oceanFleet.prerequisite; }
  if (schoolBeacon) { schoolBeacon.prerequisites = [{ id: "golden_lure", level: 5 }, { id: "bio_light", level: 4 }]; delete schoolBeacon.prerequisite; }

  const achievements = [
    { id: "first_cast", name: "第一网", description: "累计撒网 1 次", reward: "金币收益 +5%", rewardData: { gold: 0.05 }, check: (s) => s.totalCasts >= 1 },
    { id: "first_fifty", name: "小有收获", description: "累计捕获 5,000 条鱼", reward: "金币收益 +5%", rewardData: { gold: 0.05 }, check: (s) => s.totalFish >= 5000 },
    { id: "full_hold", name: "满舱而归", description: "让鱼舱达到一次满载", reward: "鱼舱容量 +10", rewardData: { capacity: 10 }, check: (s) => s.everFull },
    { id: "hundred_sold", name: "码头常客", description: "累计售出 50,000 条鱼", reward: "金币收益 +5%", rewardData: { gold: 0.05 }, check: (s) => s.totalSold >= 50000 },
    { id: "thousand_gold", name: "千枚金币", description: "累计获得 250,000 金币", reward: "金币收益 +10%", rewardData: { gold: 0.1 }, check: (s) => s.totalGoldEarned >= 250000 },
    { id: "ten_thousand_gold", name: "码头大亨", description: "累计获得 10,000,000 金币", reward: "金币收益 +15%", rewardData: { gold: 0.15 }, check: (s) => s.totalGoldEarned >= 2500000 },
    { id: "trawler_start", name: "船队启航", description: "将小型拖网船升至 Lv.1", reward: "自动速度 +10%", rewardData: { auto: 0.1 }, check: (s) => (s.upgrades.trawler || 0) >= 1 },
    { id: "trawler_max", name: "自动渔场", description: "将小型拖网船升至 Lv.10", reward: "自动速度 +25%", rewardData: { auto: 0.25 }, check: (s) => (s.upgrades.trawler || 0) >= 10 },
    { id: "cold_master", name: "冷藏专家", description: "将冷藏鱼舱升至 Lv.5", reward: "鱼舱容量 +20", rewardData: { capacity: 20 }, check: (s) => (s.upgrades.cold_storage || 0) >= 5 },
    { id: "rare_hunter", name: "稀有猎手", description: "累计捕获 5,000 条稀有鱼", reward: "稀有鱼概率 +10%", rewardData: { rare: 0.1 }, check: (s) => s.rareCaught >= 5000 },
    { id: "deep_sea", name: "深海来客", description: "解锁深海渔场", reward: "捕获数量 +10%", rewardData: { amount: 0.1 }, check: (s) => s.unlockedZones.includes("deep") },
    { id: "abyss_eye", name: "深渊之眼", description: "解锁远洋深渊", reward: "金币收益 +20%", rewardData: { gold: 0.2 }, check: (s) => s.unlockedZones.includes("abyss") },
    { id: "half_codex", name: "图鉴半满", description: "发现 24 种鱼类", reward: "金币收益 +10%", rewardData: { gold: 0.1 }, check: (s) => Object.keys(s.discovered).length >= 24 },
    { id: "full_codex", name: "海洋百科", description: "发现全部 48 种鱼类", reward: "金币收益 +25%", rewardData: { gold: 0.25 }, check: (s) => Object.keys(s.discovered).length >= species.length },
    { id: "legend_keeper", name: "传说钓手", description: "累计捕获 500 条传说鱼", reward: "金币收益 +20%", rewardData: { gold: 0.2 }, check: (s) => s.legendaryCaught >= 500 },
    { id: "iron_arm", name: "千锤百炼", description: "累计手动与自动撒网 100,000 次", reward: "金币收益 +25%", rewardData: { gold: 0.25 }, check: (s) => s.totalCasts >= 100000 },
    { id: "deep_harvest", name: "深海丰收", description: "累计捕获 500,000 条鱼", reward: "自动速度 +50%", rewardData: { auto: 0.5 }, check: (s) => s.totalFish >= 500000 },
    { id: "billion_tycoon", name: "十亿航迹", description: "累计获得 1,000,000,000 金币", reward: "金币收益 +50%", rewardData: { gold: 0.5 }, check: (s) => s.totalGoldEarned >= 1000000000 },
    { id: "tree_complete", name: "八十星图", description: "将 80 个天赋节点全部升至满级", reward: "自动速度 +50%，金币收益 +25%", rewardData: { auto: 0.5, gold: 0.25 }, check: (s) => allNodes.every((node) => (s.upgrades[node.id] || 0) >= node.max) },
    { id: "three_ultimates", name: "深海支配者", description: "激活三个终极技能", reward: "金币收益 +50%", rewardData: { gold: 0.5 }, check: (s) => ["sky_net", "ocean_fleet", "school_beacon"].every((id) => (s.upgrades[id] || 0) >= 1) },
    { id: "first_ascension", name: "第一次跃迁", description: "完成 1 次深渊跃迁", reward: "金币收益 +25%", rewardData: { gold: 0.25 }, check: (s) => s.ascension.count >= 1 },
    { id: "ascension_three", name: "循环航路", description: "完成 3 次深渊跃迁", reward: "自动速度 +35%", rewardData: { auto: 0.35 }, check: (s) => s.ascension.count >= 3 },
    { id: "ascension_ten", name: "深海轮回", description: "完成 10 次深渊跃迁", reward: "金币收益 +75%", rewardData: { gold: 0.75 }, check: (s) => s.ascension.count >= 10 },
    { id: "collector_12", name: "装备收藏家", description: "收藏 12 件不同装备", reward: "鱼舱容量 +50", rewardData: { capacity: 50 }, check: (s) => Object.keys(s.equipment.owned).length >= 12 },
    { id: "legendary_equipment", name: "传说铸装", description: "获得一件传说品质装备", reward: "金币收益 +25%", rewardData: { gold: 0.25 }, check: (s) => Object.values(s.equipment.owned).some((item) => item.rarity === "legendary") },
    { id: "set_four", name: "四件共鸣", description: "装备 4 件同套装装备", reward: "自动速度 +50%，金币收益 +25%", rewardData: { auto: 0.5, gold: 0.25 }, check: (s) => { const counts = {}; Object.values(s.equipment.equipped).forEach((id) => { const item = id && s.equipment.owned[id]; if (item) counts[item.set] = (counts[item.set] || 0) + 1; }); return Object.values(counts).some((count) => count >= 4); } },
    { id: "trillion_gold", name: "万亿航迹", description: "累计获得 1,000,000,000,000 金币", reward: "金币收益 +100%", rewardData: { gold: 1 }, check: (s) => s.totalGoldEarned >= 1000000000000 },
    { id: "crystal_keeper", name: "结晶守望者", description: "累计拥有 1,000 枚深渊结晶", reward: "自动速度 +75%", rewardData: { auto: 0.75 }, check: (s) => s.ascension.crystals >= 1000 }
  ];

  const EQUIPMENT_SLOTS = {
    net: { name: "渔网", icon: "◎", stat: "catchPct", base: 0.05, description: "决定单次捕获上限与撒网输出。" },
    sonar: { name: "声呐", icon: "◉", stat: "rareChance", base: 0.015, description: "扩大热点感知并提高稀有机会。" },
    hull: { name: "船体", icon: "▰", stat: "capacity", base: 22, description: "提供鱼舱空间与离线基础能力。" },
    engine: { name: "引擎", icon: "➤", stat: "autoRatePct", base: 0.04, description: "提高自动撒网频率和航行效率。" },
    lure: { name: "诱饵", icon: "✦", stat: "legendChance", base: 0.003, description: "改变稀有与传说鱼信号质量。" },
    beacon: { name: "信标", icon: "⌖", stat: "sellPct", base: 0.05, description: "强化出售、贸易与首领奖励。" },
    armor: { name: "护甲", icon: "⬡", stat: "processPct", base: 0.02, description: "保护渔获并提高加工稳定性。" },
    core: { name: "核心", icon: "◈", stat: "skillHastePct", base: 0.04, description: "为装备主动技提供能量与冷却恢复。" }
  };

  const EQUIPMENT_RARITIES = {
    common: { name: "普通", multiplier: 1, color: "#9fb4c5" },
    rare: { name: "稀有", multiplier: 2, color: "#56d8ff" },
    epic: { name: "史诗", multiplier: 3.5, color: "#a98cff" },
    legendary: { name: "传说", multiplier: 5, color: "#ffd36a" }
  };

  const EQUIPMENT_ARCHETYPES = {
    net: [
      { id: "vortex_net", name: "涡流网", icon: "◉", passive: "空网率降低", stat: { emptyPct: 0.01 } },
      { id: "resonant_net", name: "共振网", icon: "⌁", passive: "双倍捕获概率", stat: { doubleChance: 0.015 } },
      { id: "skynet", name: "天罗网", icon: "✶", passive: "全局捕获量", stat: { catchPct: 0.04 } },
      { id: "void_net", name: "虚空网", icon: "✦", passive: "技能释放后天罗脉冲", stat: { catchPct: 0.03 }, activeSkill: "sky_pulse" },
      { id: "tidejaw_net", name: "触礁巨颚网", icon: "◍", passive: "巨兽熔铸 · 捕获量", stat: { catchPct: 0.06 }, bossOnly: true }
    ],
    sonar: [
      { id: "thermal_sonar", name: "热成像声呐", icon: "◉", passive: "稀有鱼概率", stat: { rareChance: 0.008 } },
      { id: "spectral_sonar", name: "声谱声呐", icon: "◌", passive: "热点持续时间", stat: { hotspotDurationPct: 0.08 } },
      { id: "quantum_sonar", name: "量子声呐", icon: "⌬", passive: "首领动力", stat: { bossPowerPct: 0.04 } },
      { id: "abyss_sonar", name: "深渊声呐", icon: "◈", passive: "传说鱼概率", stat: { legendChance: 0.002 } },
      { id: "coral_watcher", name: "珊瑚守望声呐", icon: "◉", passive: "巨兽熔铸 · 稀有与热点", stat: { rareChance: 0.015, hotspotDurationPct: 0.06 }, bossOnly: true }
    ],
    hull: [
      { id: "cold_hull", name: "冷藏船体", icon: "▣", passive: "加工鱼价", stat: { processPct: 0.04 } },
      { id: "expanded_hull", name: "扩容船体", icon: "⬢", passive: "鱼舱容量", stat: { capacity: 35 } },
      { id: "armored_hull", name: "装甲船体", icon: "▰", passive: "离线收益", stat: { offlineHours: 1 } },
      { id: "bio_hull", name: "生态船体", icon: "⌘", passive: "全收益", stat: { allYieldPct: 0.025 } },
      { id: "oarfish_hull", name: "皇带龙骨船体", icon: "⌁", passive: "巨兽熔铸 · 容量与全收益", stat: { capacity: 40, allYieldPct: 0.012 }, bossOnly: true }
    ],
    engine: [
      { id: "tidal_engine", name: "潮汐引擎", icon: "≈", passive: "自动速度", stat: { autoRatePct: 0.06 } },
      { id: "ion_engine", name: "离子引擎", icon: "➤", passive: "自动双倍", stat: { autoDouble: 0.01 } },
      { id: "overdrive_engine", name: "超载引擎", icon: "⚡", passive: "超载航行主动技", stat: { autoRatePct: 0.04 }, activeSkill: "overdrive" },
      { id: "curve_engine", name: "曲率引擎", icon: "◒", passive: "离线续航", stat: { offlineHours: 2 } },
      { id: "starwhale_engine", name: "星辉鲸流引擎", icon: "✦", passive: "巨兽熔铸 · 自动与全收益", stat: { autoRatePct: 0.08, allYieldPct: 0.012 }, bossOnly: true }
    ],
    lure: [
      { id: "phosphor_lure", name: "磷光诱饵", icon: "✦", passive: "稀有鱼概率", stat: { rareChance: 0.01 } },
      { id: "golden_lure", name: "黄金诱饵", icon: "◆", passive: "黄金诱爆主动技", stat: { legendChance: 0.002 }, activeSkill: "golden_explosion" },
      { id: "dream_lure", name: "幻梦诱饵", icon: "◌", passive: "事件频率", stat: { eventRate: 0.06 } },
      { id: "beast_lure", name: "巨兽诱饵", icon: "☠", passive: "首领奖励", stat: { bossRewardPct: 0.08 } },
      { id: "aurora_lure", name: "极光龙鳍诱饵", icon: "✧", passive: "巨兽熔铸 · 稀有与传说", stat: { rareChance: 0.012, legendChance: 0.003 }, bossOnly: true }
    ],
    beacon: [
      { id: "trade_beacon", name: "贸易信标", icon: "◇", passive: "全部售价", stat: { sellPct: 0.04 } },
      { id: "star_beacon", name: "星链信标", icon: "✧", passive: "全收益", stat: { allYieldPct: 0.03 } },
      { id: "hunt_beacon", name: "猎杀信标", icon: "⌖", passive: "首领动力", stat: { bossPowerPct: 0.06 } },
      { id: "return_beacon", name: "归航信标", icon: "⟲", passive: "离线时长", stat: { offlineHours: 1 } },
      { id: "magma_beacon", name: "熔核信标", icon: "☄", passive: "巨兽熔铸 · 首领奖励", stat: { bossRewardPct: 0.12 }, bossOnly: true }
    ],
    armor: [
      { id: "ceramic_armor", name: "陶瓷护甲", icon: "⬡", passive: "加工价值", stat: { processPct: 0.06 } },
      { id: "bio_armor", name: "生物护甲", icon: "✹", passive: "稀有鱼概率", stat: { rareChance: 0.008 } },
      { id: "energy_armor", name: "能量护甲", icon: "◈", passive: "技能急速", stat: { skillHastePct: 0.05 } },
      { id: "abyss_armor", name: "深渊护甲", icon: "⬢", passive: "首领奖励", stat: { bossRewardPct: 0.1 } },
      { id: "observer_armor", name: "观测者甲壳", icon: "⌬", passive: "巨兽熔铸 · 掉落与首领", stat: { gearDropPct: 0.03, bossPowerPct: 0.05 }, bossOnly: true }
    ],
    core: [
      { id: "time_core", name: "时滞核心", icon: "⌛", passive: "时滞领域主动技", stat: { skillHastePct: 0.05 }, activeSkill: "time_field" },
      { id: "resonance_core", name: "共鸣核心", icon: "◈", passive: "全收益", stat: { allYieldPct: 0.04 } },
      { id: "void_core", name: "虚空核心", icon: "✦", passive: "捕获量", stat: { catchPct: 0.05 } },
      { id: "star_core", name: "星核", icon: "✶", passive: "稀有机会与售价", stat: { rareChance: 0.006, sellPct: 0.03 } },
      { id: "void_orbit_core", name: "归墟星盘旋核", icon: "✹", passive: "巨兽熔铸 · 全收益与技能", stat: { allYieldPct: 0.06, skillHastePct: 0.05 }, bossOnly: true }
    ]
  };

  const EQUIPMENT_SETS = {
    tide: { name: "潮汐", color: "#52d9ee", bonuses: { 2: { sellPct: 0.08 }, 4: { catchPct: 0.12, autoRatePct: 0.1 }, 6: { allYieldPct: 0.12 }, 8: { catchPct: 0.25, sellPct: 0.2 } } },
    abyss: { name: "深渊", color: "#8e73ff", bonuses: { 2: { rareChance: 0.01 }, 4: { legendChance: 0.004, bossPowerPct: 0.08 }, 6: { skillHastePct: 0.12 }, 8: { allYieldPct: 0.2, bossRewardPct: 0.25 } } },
    phantom: { name: "幽影", color: "#ff7fb8", bonuses: { 2: { doubleChance: 0.02 }, 4: { catchPct: 0.15 }, 6: { skillHastePct: 0.1 }, 8: { catchPct: 0.3, allYieldPct: 0.15 } } },
    aurora: { name: "极光", color: "#71f2cd", bonuses: { 2: { rareChance: 0.012 }, 4: { legendChance: 0.005 }, 6: { sellPct: 0.16 }, 8: { allYieldPct: 0.22 } } },
    leviathan: { name: "利维坦", color: "#ffb35c", bonuses: { 2: { bossPowerPct: 0.08 }, 4: { bossRewardPct: 0.12 }, 6: { catchPct: 0.18 }, 8: { bossPowerPct: 0.25, bossRewardPct: 0.3 } } }
  };

  const BOSS_MATERIALS = {
    sonarShard: { name: "声呐核心碎片", icon: "◉", color: "#62e7f0" },
    armorPlate: { name: "巨兽护甲片", icon: "⬡", color: "#ffd36a" },
    voidHeart: { name: "虚空心脏核", icon: "✦", color: "#b58cff" }
  };

  const BOSS_FORGE_RECIPES = [
    { zone: "shallow", slot: "net", archetype: "tidejaw_net", cost: { sonarShard: 2, armorPlate: 1, voidHeart: 0, alloy: 12 }, description: "提高基础捕获量，适合稳定刷图。" },
    { zone: "reef", slot: "sonar", archetype: "coral_watcher", cost: { sonarShard: 1, armorPlate: 1, voidHeart: 0, alloy: 16 }, description: "强化稀有率与声呐热点持续时间。" },
    { zone: "deep", slot: "hull", archetype: "oarfish_hull", cost: { sonarShard: 0, armorPlate: 2, voidHeart: 0, alloy: 18 }, description: "扩充鱼舱并提高长期全收益。" },
    { zone: "abyss", slot: "engine", archetype: "starwhale_engine", cost: { sonarShard: 0, armorPlate: 2, voidHeart: 1, alloy: 22 }, description: "让自动船队与全收益同时提速。" },
    { zone: "aurora", slot: "lure", archetype: "aurora_lure", cost: { sonarShard: 2, armorPlate: 0, voidHeart: 1, alloy: 24 }, description: "提升稀有与传说鱼信号质量。" },
    { zone: "rift", slot: "beacon", archetype: "magma_beacon", cost: { sonarShard: 0, armorPlate: 3, voidHeart: 1, alloy: 28 }, description: "提高首领阶段奖励与熔铸收益。" },
    { zone: "city", slot: "armor", archetype: "observer_armor", cost: { sonarShard: 3, armorPlate: 3, voidHeart: 1, alloy: 34 }, description: "强化装备掉落与首领阶段进度。" },
    { zone: "void", slot: "core", archetype: "void_orbit_core", cost: { sonarShard: 0, armorPlate: 4, voidHeart: 2, alloy: 40 }, description: "终点核心，同时提高全收益与技能急速。" }
  ];
  const GEAR_SKILLS = {
    sky_pulse: { key: "R", name: "天罗脉冲", icon: "✶", cooldown: 45, duration: 8, color: "#74efff", description: "8 秒内捕获量 +80%，网面展开范围扩大。" },
    overdrive: { key: "T", name: "超载航行", icon: "⚡", cooldown: 50, duration: 10, color: "#ffd36a", description: "10 秒内自动撒网速度 ×2.5。" },
    golden_explosion: { key: "Y", name: "黄金诱爆", icon: "◆", cooldown: 55, duration: 8, color: "#ffbd54", description: "8 秒内稀有率 +12%，传说率 +2%。" },
    time_field: { key: "C", name: "时滞领域", icon: "⌛", cooldown: 60, duration: 8, color: "#b18cff", description: "8 秒内技能急速 +30%，手动撒网冷却降低。" }
  };

  const RESEARCH_DEFS = {
    catch: { name: "捕捞科研", stat: "catchPct", value: 0.05, description: "提高所有捕获量。" },
    sale: { name: "贸易科研", stat: "sellPct", value: 0.05, description: "提高所有出售收益。" },
    auto: { name: "自动化科研", stat: "autoRatePct", value: 0.04, description: "提高自动撒网频率。" },
    offline: { name: "续航科研", stat: "offlineHours", value: 1, description: "延长离线收益上限。" },
    rare: { name: "稀有科研", stat: "rareChance", value: 0.004, description: "提高稀有鱼概率。" },
    legend: { name: "传说科研", stat: "legendChance", value: 0.0015, description: "提高传说鱼概率。" },
    boss: { name: "首领科研", stat: "bossPowerPct", value: 0.05, description: "提高首领阶段进度。" },
    gear: { name: "装备科研", stat: "gearDropPct", value: 0.02, description: "提高装备掉落与保底速度。" },
    haste: { name: "技能科研", stat: "skillHastePct", value: 0.03, description: "降低装备主动技冷却。" },
    capital: { name: "初始资本", stat: "startingGold", value: 5000, description: "跃迁后获得更多启动金币。" },
    talent: { name: "天赋科研", stat: "startingTalent", value: 1, description: "跃迁后赠送一层起始天赋。" },
    zone: { name: "海域科研", stat: "zoneDiscountPct", value: 0.02, description: "降低海域解锁费用。" }
  };

  const ASCENSION_PROTOCOLS = [
    { id: "deep_start", count: 1, name: "深海启航", description: "开局解锁浅滩与礁区，并获得初始金币。", icon: "➤" },
    { id: "fleet_link", count: 3, name: "舰群协同", description: "装备技能冷却降低，首领破甲获得额外进度。", icon: "⌘" },
    { id: "star_chart", count: 6, name: "星图测绘", description: "海域解锁费用降低，稀有率提高，获得沉没观测城权限。", icon: "✧" },
    { id: "void_access", count: 10, name: "归墟权限", description: "全收益提高，并获得星海归墟终局权限。", icon: "✦" }
  ];

  const HOTSPOT_TYPES = {
    normal: { name: "普通鱼群", radius: 18, duration: 18, amount: 0.15, rare: 0, legendary: 0, color: "#56d9ee" },
    rare: { name: "稀有鱼群", radius: 13, duration: 14, amount: 0.1, rare: 0.12, legendary: 0, color: "#7ef2c7" },
    legendary: { name: "传说回响", radius: 9, duration: 10, amount: 0.08, rare: 0.06, legendary: 0.008, color: "#ffd66b" }
  };

  const EXPEDITION_CREW_MODES = {
    balanced: { name: "均衡护航", icon: "◎", description: "捕获量 +6%，适合稳定推进。", catchPct: 0.06 },
    harvest: { name: "渔获优先", icon: "▰", description: "捕获量 +12%，优先保证每网数量。", catchPct: 0.12 },
    research: { name: "稀有优先", icon: "◉", description: "稀有率 +3%，传说率 +0.4%。", rareChance: 0.03, legendChance: 0.004 },
    vanguard: { name: "巨兽辅助", icon: "☠", description: "首领阶段进度 +18%，捕获量 -2%。", bossProgressPct: 0.18, catchPct: -0.02 }
  };

  const EXPEDITION_ROUTES = [
    { id: "whale_ruins", name: "鲸落古径", icon: "◈", accent: "#67e8f9", tag: "稳定航线", duration: 10 * 60, requiredCasts: 36, nodeCount: 4, requiredZones: 1, baseGold: 500, goldPerCast: 45, alloy: 4, crystals: 0, risk: "低风险", description: "沿古代鲸落缓慢推进，声呐回波稳定，适合熟悉热点落点与航线节奏。" },
    { id: "rift_return", name: "热泉回航", icon: "☄", accent: "#f6b85f", tag: "稀有航线", duration: 15 * 60, requiredCasts: 54, nodeCount: 4, requiredZones: 2, baseGold: 1800, goldPerCast: 75, alloy: 8, crystals: 1, risk: "中风险", description: "穿过热泉裂谷的漂浮航标，稀有回声更密集，但需要更精准的落点判断。" },
    { id: "sunken_echo", name: "沉城回声", icon: "✹", accent: "#b48cff", tag: "深潜航线", duration: 20 * 60, requiredCasts: 78, nodeCount: 4, requiredZones: 4, baseGold: 6000, goldPerCast: 130, alloy: 16, crystals: 3, risk: "高风险", description: "进入沉没观测城的失联航道，航线节点复杂，但能带回科研材料与首领回声。" }
  ];

  const EXPEDITION_NODE_EVENTS = [
    {
      title: "漂流残骸",
      icon: "▣",
      description: "一艘旧时代调查船的货舱卡在暗流中，拆解或扫描都要付出时间。",
      choices: [
        { id: "salvage", label: "拆解补给", result: "本次结算金币 +18%，合金 +4，装备保底 +8", effect: { goldPct: 0.18, alloy: 4, gearPity: 8 } },
        { id: "scan", label: "扫描货舱", result: "本航程捕获量 +8%", effect: { catchPct: 0.08 } }
      ]
    },
    {
      title: "异常声呐",
      icon: "◉",
      description: "一段不属于当前海域的回声在航线下反复出现。",
      choices: [
        { id: "resonance", label: "声呐共鸣", result: "本航程稀有率 +2.5%，传说率 +0.4%", effect: { rareChance: 0.025, legendChance: 0.004 } },
        { id: "sample", label: "回收样本", result: "深渊结晶 +2，航程进度 +2", effect: { crystals: 2, progress: 2 } }
      ]
    },
    {
      title: "古代航标",
      icon: "⌖",
      description: "一座仍在运转的航标指向地图上没有标注的深沟。",
      choices: [
        { id: "calibrate", label: "校准航线", result: "航程进度 +4，提前接近返航节点", effect: { progress: 4 } },
        { id: "loot", label: "拆下晶核", result: "本次结算金币 +12%，合金 +3", effect: { goldPct: 0.12, alloy: 3 } }
      ]
    },
    {
      title: "巨兽回声",
      icon: "☠",
      description: "低频震动从深处传来，声呐边缘浮出巨型生命的轮廓。",
      choices: [
        { id: "vanguard", label: "呼叫护航", result: "本航程首领阶段进度 +25%", effect: { bossProgressPct: 0.25 } },
        { id: "data", label: "记录回声", result: "深渊结晶 +3，本航程稀有率 +2%", effect: { crystals: 3, rareChance: 0.02 } }
      ]
    }
  ];

  const BOSS_DEFS = {
    shallow: { name: "触礁巨鲷", threshold: 250, icon: "◉", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    reef: { name: "珊瑚守卫", threshold: 1200, icon: "◈", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    deep: { name: "深海皇带鱼", threshold: 5000, icon: "⌁", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    abyss: { name: "深渊星辉鲸", threshold: 20000, icon: "✦", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    aurora: { name: "极光幽龙", threshold: 60000, icon: "✧", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    rift: { name: "熔核海皇", threshold: 180000, icon: "☄", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    city: { name: "观测者利维坦", threshold: 500000, icon: "⌬", phases: ["声呐追踪", "护甲破译", "终结收网"] },
    void: { name: "归墟之主", threshold: 1500000, icon: "✹", phases: ["声呐追踪", "护甲破译", "终结收网"] }
  };

  function createDefaultState() {
    const upgrades = {};
    allNodes.forEach((node) => { upgrades[node.id] = 0; });
    return {
      version: 7,
      gold: 0,
      currentZone: "shallow",
      unlockedZones: ["shallow"],
      upgrades,
      inventory: {},
      discovered: {},
      achievements: {},
      totalCasts: 0,
      totalFish: 0,
      totalSold: 0,
      totalGoldEarned: 0,
      rareCaught: 0,
      legendaryCaught: 0,
      everFull: false,
      nextEventAt: Date.now() + randomEventDelay(),
      activeEvent: null,
      lastSaved: Date.now(),
      pendingOffline: null,
      audioMuted: false,
      ascension: {
        count: 0,
        crystals: 0,
        research: Object.fromEntries(Object.keys(RESEARCH_DEFS).map((key) => [key, 0])),
        protocols: {},
        bossTrophies: {},
        totalBossDefeated: 0,
        bestZone: "shallow"
      },
      equipment: {
        owned: {},
        equipped: { net: null, sonar: null, hull: null, engine: null, lure: null, beacon: null, armor: null, core: null },
        alloy: 0,
        lockedSlots: {},
        rarePity: 0,
        skillLoadout: [],
        skillMode: "auto",
        discovered: {}
      },
      sonar: { hotspots: [], nextSpawnAt: Date.now() + 12000, history: [] },
      expedition: { active: null, completed: 0, bestScore: 0, crewMode: "balanced", masteryXp: 0, masteryLevel: 0, log: [] },
      ecology: Object.fromEntries(zones.map((zone) => [zone.id, { preyDensity: 1, predatorPressure: 0.05, schoolMorale: 0.92, predatorCount: 0, lastUpdatedAt: Date.now() }])),
      codexMastery: {},
      contracts: { date: "", tasks: [], progress: {}, claimed: {}, streak: 0 },
      zoneProgress: Object.fromEntries(zones.map((zone) => [zone.id, { caught: 0, bossCharge: 0, bossDefeated: 0, mastery: 0 }])),
      profile: null,
      profileSetupSeen: false,
      leaderboard: { board: "captain", lastSnapshotAt: 0, lastSubmitAt: 0, cache: {} },
      bossTutorialSeen: false,
      bossMaterials: { sonarShard: 0, armorPlate: 0, voidHeart: 0 },
      bossRecords: {},
      ui: { keyGuideCollapsed: false, guideSeen: false, expandedBranch: "net_mastery", expandedGroup: 0, equipmentTab: "equipped", bossBannerExpanded: false, leftPanelOpen: false, rightPanelOpen: false, leftPanelPinned: false, rightPanelPinned: false }
    };
  }

  let state = createDefaultState();
  let activeModal = null;
  let autoAccumulator = 0;
  let lastFrame = performance.now();
  let lastManualCast = 0;
  let lastAutoSellToast = 0;
  let lastDynamicRender = 0;
  let saveFlashTimer = null;
  let eventBannerTimer = null;
  let zoneScanTimer = null;
  let lastRenderedGold = null;
  let lastRenderedHold = null;
  let pointerOrigin = null;
  let keyboardCasting = false;
  let visualCombo = 0;
  let comboResetTimer = null;
  let gearSkillBuffs = {};
  let gearSkillCooldowns = {};
  let lastEcologyUpdate = 0;
  let ecologyVisualSignature = '';
  let lastFishDensityTarget = 0;

  function currentZone() {
    return byId(zones, state.currentZone) || zones[0];
  }

  function getZone(id) {
    return byId(zones, id) || zones[0];
  }

  function getLevel(id) {
    return Number(state.upgrades[id] || 0);
  }

  function getUpgradeStat(key) {
    return allNodes.reduce((sum, node) => sum + getLevel(node.id) * Number((node.stat && node.stat[key]) || 0), 0);
  }

  function getResearchLevel(key) {
    return Number(state.ascension?.research?.[key] || 0);
  }

  function getResearchBonus(key) {
    const def = RESEARCH_DEFS[key];
    return def ? getResearchLevel(key) * def.value : 0;
  }

  const COMBINED_STAT_KEYS = ["catchPct","emptyPct","doubleChance","autoRate","autoRatePct","capacity","sellPct","rareChance","legendChance","processPct","offlineHours","rareValuePct","autoDouble","eventRate","hotspotRadiusPct","hotspotDurationPct","bossPowerPct","bossRewardPct","gearDropPct","skillHastePct","startingGold","startingTalent","zoneDiscountPct","allYieldPct","codexYieldPct"];

  function blankBonuses() {
    return Object.fromEntries(COMBINED_STAT_KEYS.map((key) => [key, 0]));
  }

  function addBonuses(target, source, scale = 1) {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (!(key in target)) target[key] = 0;
      target[key] += Number(value || 0) * scale;
    });
    return target;
  }

  function getEquipmentArchetype(slot, item) {
    const defs = EQUIPMENT_ARCHETYPES[slot] || [];
    return defs.find((entry) => entry.id === item?.archetype) || defs[0] || { id: "legacy", name: "传统装备", icon: EQUIPMENT_SLOTS[slot]?.icon || "◇", stat: {} };
  }

  function getEquippedSetCounts() {
    const counts = {};
    Object.values(state.equipment?.equipped || {}).forEach((id) => {
      const item = id && state.equipment?.owned?.[id];
      if (!item) return;
      counts[item.set || "tide"] = (counts[item.set || "tide"] || 0) + 1;
    });
    return counts;
  }

  function getEquipmentPrototypeCount() {
    return Object.values(EQUIPMENT_ARCHETYPES).reduce((sum, list) => sum + list.length, 0);
  }

  function getBossMaterialCount(key) {
    return Math.max(0, Number(state.bossMaterials?.[key]) || 0);
  }

  function canForgeBossEquipment(recipe) {
    if (!recipe) return false;
    return Object.entries(recipe.cost || {}).every(([key, value]) => key === "alloy" ? state.equipment.alloy >= value : getBossMaterialCount(key) >= value);
  }

  function forgeBossEquipment(archetypeId) {
    const recipe = BOSS_FORGE_RECIPES.find((entry) => entry.archetype === archetypeId);
    if (!recipe) return;
    if (!canForgeBossEquipment(recipe)) {
      showToast("熔铸材料不足", "击败首领并破坏部位后会获得声呐核心碎片、巨兽护甲片和虚空心脏核。", "error");
      return;
    }
    Object.entries(recipe.cost || {}).forEach(([key, value]) => {
      if (key === "alloy") state.equipment.alloy -= value;
      else state.bossMaterials[key] = Math.max(0, getBossMaterialCount(key) - value);
    });
    const item = createEquipment(recipe.slot, "legendary", recipe.archetype);
    const archetype = getEquipmentArchetype(recipe.slot, item);
    showToast("巨兽熔铸成功", `${archetype.name}已加入舰载装备，拥有独立传说被动。`, "gold");
    updateAllUI();
    saveGame(true);
  }

  function recordBossDefeat(zoneId, boss) {
    const now = Date.now();
    const record = state.bossRecords?.[zoneId] || { kills: 0, bestPerfect: 0, fastestSeconds: 0, lastDefeatedAt: 0 };
    const duration = Math.max(1, Math.round((now - (Number(boss.startedAt) || now)) / 1000));
    record.kills = Number(record.kills || 0) + 1;
    record.bestPerfect = Math.max(Number(record.bestPerfect) || 0, Number(boss.perfectFinishers) || 0);
    record.fastestSeconds = record.fastestSeconds ? Math.min(record.fastestSeconds, duration) : duration;
    record.lastDefeatedAt = now;
    state.bossRecords = { ...(state.bossRecords || {}), [zoneId]: record };
  }
  function getEquipmentBonuses() {
    const bonuses = blankBonuses();
    const setCounts = getEquippedSetCounts();
    Object.entries(EQUIPMENT_SLOTS).forEach(([slot, def]) => {
      const id = state.equipment?.equipped?.[slot];
      const item = id && state.equipment?.owned?.[id];
      if (!item) return;
      const rarity = EQUIPMENT_RARITIES[item.rarity] || EQUIPMENT_RARITIES.common;
      const archetype = getEquipmentArchetype(slot, item);
      const scale = rarity.multiplier * (1 + (Math.max(1, Number(item.level) || 1) - 1) * 0.1);
      addBonuses(bonuses, { [def.stat]: def.base }, scale);
      addBonuses(bonuses, archetype.stat || {}, scale);
      setCounts[item.set || "tide"] = (setCounts[item.set || "tide"] || 0) + 1;
    });
    Object.entries(setCounts).forEach(([setId, count]) => {
      const set = EQUIPMENT_SETS[setId];
      if (!set) return;
      Object.entries(set.bonuses || {}).forEach(([threshold, effects]) => {
        if (count >= Number(threshold)) addBonuses(bonuses, effects, 1);
      });
    });
    return bonuses;
  }

  function getAscensionProtocols() {
    return ASCENSION_PROTOCOLS.filter((protocol) => (state.ascension?.count || 0) >= protocol.count).map((protocol) => protocol.id);
  }

  function isProtocolUnlocked(id) {
    return getAscensionProtocols().includes(id);
  }

  function getAscensionBonuses() {
    const bonuses = blankBonuses();
    Object.entries(RESEARCH_DEFS).forEach(([key, def]) => { bonuses[def.stat] = (bonuses[def.stat] || 0) + getResearchBonus(key); });
    if (isProtocolUnlocked("deep_start")) {
      bonuses.startingGold += 10000;
      bonuses.offlineHours += 1;
    }
    if (isProtocolUnlocked("fleet_link")) bonuses.skillHastePct += 0.1;
    if (isProtocolUnlocked("star_chart")) { bonuses.zoneDiscountPct += 0.12; bonuses.rareChance += 0.01; }
    if (isProtocolUnlocked("void_access")) bonuses.allYieldPct += 0.1;
    return bonuses;
  }

  function getResearchTotalLevel() {
    return Object.keys(RESEARCH_DEFS).reduce((sum, key) => sum + getResearchLevel(key), 0);
  }

  function getTotalBossDefeated() {
    return Math.max(Number(state.ascension?.totalBossDefeated) || 0, Object.values(state.zoneProgress || {}).reduce((sum, item) => sum + (Number(item.bossDefeated) || 0), 0));
  }

  function getEcologyModifiers(zoneId = state.currentZone) {
    const ecology = state.ecology?.[zoneId] || { preyDensity: 1, predatorPressure: 0, schoolMorale: 0.92 };
    const preyDensity = clamp(Number(ecology.preyDensity) || 1, 0.65, 1.35);
    const predatorPressure = clamp(Number(ecology.predatorPressure) || 0, 0, 0.6);
    const schoolMorale = clamp(Number(ecology.schoolMorale) || 1, 0.7, 1.1);
    const mastery = clamp(Number(state.zoneProgress?.[zoneId]?.mastery) || 0, 0, 100) / 100;
    return {
      preyDensity,
      predatorPressure,
      schoolMorale,
      normalMult: clamp(1 - predatorPressure * 0.45 + (preyDensity - 1) * 0.25, 0.6, 1.15),
      rareBonus: predatorPressure * 0.08 + (1 - schoolMorale) * 0.03 + mastery * 0.008,
      legendBonus: predatorPressure * 0.01 + mastery * 0.001
    };
  }

  function getExpeditionRoute(routeId) {
    return EXPEDITION_ROUTES.find((route) => route.id === routeId) || EXPEDITION_ROUTES[0];
  }

  function getExpeditionCrew(mode = state.expedition?.crewMode) {
    return EXPEDITION_CREW_MODES[mode] || EXPEDITION_CREW_MODES.balanced;
  }

  function getExpeditionBonuses() {
    const active = state.expedition?.active;
    const crew = active ? getExpeditionCrew() : {};
    const bonuses = active?.bonuses || {};
    return {
      catchPct: Number(crew.catchPct || 0) + Number(bonuses.catchPct || 0),
      rareChance: Number(crew.rareChance || 0) + Number(bonuses.rareChance || 0),
      legendChance: Number(crew.legendChance || 0) + Number(bonuses.legendChance || 0),
      bossProgressPct: Number(crew.bossProgressPct || 0) + Number(bonuses.bossProgressPct || 0)
    };
  }

  function getBossCombatBuffs() {
    const boss = state.boss;
    const buff = boss?.phaseBuff;
    if (!buff || Number(buff.until) <= Date.now()) return { catchPct: 0, rareChance: 0, legendChance: 0, bossProgressPct: 0, label: "" };
    const label = buff.type === "sonar_lock" ? "声呐校准" : buff.type === "armor_break" ? "护甲崩解" : "阶段增益";
    return {
      catchPct: Number(buff.catchPct || 0),
      rareChance: Number(buff.rareChance || 0),
      legendChance: Number(buff.legendChance || 0),
      bossProgressPct: Number(buff.bossProgressPct || 0),
      label
    };
  }

  function getExpeditionRouteUnlocked(route) {
    return state.unlockedZones.length >= (Number(route?.requiredZones) || 1);
  }

  function getExpeditionMasteryCost(level = state.expedition?.masteryLevel || 0) {
    return 900 + Math.max(0, Number(level) || 0) * 650;
  }

  function getExpeditionMasteryBonuses() {
    const level = Math.max(0, Number(state.expedition?.masteryLevel) || 0);
    return { allYieldPct: level * 0.004, bossRewardPct: level * 0.008, hotspotDurationPct: level * 0.012 };
  }

  function addExpeditionMastery(score = 0) {
    if (!state.expedition) return { gained: 0, level: 0 };
    const previous = Math.max(0, Number(state.expedition.masteryLevel) || 0);
    state.expedition.masteryXp = Math.max(0, Number(state.expedition.masteryXp) || 0) + Math.max(0, Number(score) || 0);
    let level = previous;
    while (level < 20 && state.expedition.masteryXp >= getExpeditionMasteryCost(level)) {
      state.expedition.masteryXp -= getExpeditionMasteryCost(level);
      level += 1;
    }
    state.expedition.masteryLevel = level;
    if (level >= 20) state.expedition.masteryXp = Math.min(state.expedition.masteryXp, getExpeditionMasteryCost(19));
    return { gained: level - previous, level };
  }

  function getExpeditionProgressRatio(active = state.expedition?.active) {
    if (!active) return 0;
    return clamp((Number(active.progress) || 0) / Math.max(1, Number(active.requiredCasts) || 1), 0, 1);
  }

  function getExpeditionTimeRemaining(active = state.expedition?.active) {
    if (!active) return 0;
    return Math.max(0, (Number(active.endsAt) || 0) - Date.now()) / 1000;
  }

  function getExpeditionRewardPreview(route, progress = 0, early = false, expired = false) {
    const zoneMult = 1 + (currentZone().priceMult - 1) * 0.12;
    const ratio = clamp(progress / Math.max(1, route.requiredCasts), 0, 1);
    const earlyFactor = expired ? clamp(0.45 + ratio * 0.55, 0.45, 1) : early ? clamp(0.35 + ratio * 0.35, 0.35, 0.7) : 1;
    return {
      gold: Math.round((Number(route.baseGold) + progress * Number(route.goldPerCast)) * zoneMult * earlyFactor),
      alloy: Math.round(Number(route.alloy || 0) * earlyFactor),
      crystals: Math.round(Number(route.crystals || 0) * earlyFactor)
    };
  }

  function createExpeditionNode(index) {
    const event = EXPEDITION_NODE_EVENTS[index % EXPEDITION_NODE_EVENTS.length];
    return {
      id: `${state.expedition.active.routeId}:${index}`,
      index,
      title: event.title,
      icon: event.icon,
      description: event.description,
      choices: event.choices.map((choice) => ({ ...choice, effect: { ...(choice.effect || {}) } }))
    };
  }

  function applyExpeditionChoiceEffect(effect = {}) {
    const active = state.expedition?.active;
    if (!active) return;
    active.bonuses = { goldPct: 0, alloy: 0, crystals: 0, catchPct: 0, rareChance: 0, legendChance: 0, bossProgressPct: 0, ...(active.bonuses || {}) };
    ["goldPct", "alloy", "crystals", "catchPct", "rareChance", "legendChance", "bossProgressPct"].forEach((key) => {
      active.bonuses[key] = Number(active.bonuses[key] || 0) + Number(effect[key] || 0);
    });
    if (effect.gearPity && state.equipment) state.equipment.rarePity = clamp((Number(state.equipment.rarePity) || 0) + Number(effect.gearPity), 0, 100);
    if (effect.progress) active.progress = Math.min(Number(active.requiredCasts) || 0, (Number(active.progress) || 0) + Number(effect.progress));
  }

  function queueExpeditionNode() {
    const active = state.expedition?.active;
    if (!active || active.pendingNode) return false;
    const nextIndex = Number(active.nodeIndex) || 0;
    const threshold = Number(active.thresholds?.[nextIndex] || 0);
    if (threshold && active.progress >= threshold) {
      active.pendingNode = createExpeditionNode(nextIndex);
      showToast("航线节点抵达", `${active.pendingNode.title} 已进入决策范围，打开深渊航线完成选择。`, "info");
      if (activeModal?.type === "expedition") renderModal();
      return true;
    }
    return false;
  }

  function startExpedition(routeId) {
    const route = getExpeditionRoute(routeId);
    if (state.expedition?.active) {
      showToast("航线正在进行", "完成当前航线或返航结算后才能部署新的航线。", "error");
      return;
    }
    if (!getExpeditionRouteUnlocked(route)) {
      showToast("航线尚未开放", `需要解锁 ${route.requiredZones} 个海域后才能进入${route.name}。`, "error");
      return;
    }
    const now = Date.now();
    const thresholds = Array.from({ length: route.nodeCount }, (_, index) => Math.round(route.requiredCasts * (index + 1) / route.nodeCount));
    state.expedition.active = {
      routeId: route.id,
      startedAt: now,
      endsAt: now + route.duration * 1000,
      progress: 0,
      requiredCasts: route.requiredCasts,
      thresholds,
      nodeIndex: 0,
      pendingNode: null,
      expired: false,
      bonuses: { goldPct: 0, alloy: 0, crystals: 0, catchPct: 0, rareChance: 0, legendChance: 0, bossProgressPct: 0 },
      stats: { casts: 0, manual: 0, auto: 0, hotspots: 0, rare: 0, legendary: 0 }
    };
    showToast("深渊航线已部署", `${route.name} 开始航行。落网、热点与航线节点都会推进本次航程。`, "gold");
    showEventBanner(route.name, `${route.tag} · ${formatDuration(route.duration)} · ${getExpeditionCrew().name}`, "rare", 3600);
    updateAllUI();
    saveGame(true);
  }

  function advanceExpedition(weight = 1, context = {}) {
    const active = state.expedition?.active;
    if (!active || active.expired || active.pendingNode) return { pending: Boolean(active?.pendingNode), completed: false };
    const gain = clamp(Number(weight) || 0, 0, 3);
    if (gain <= 0) return { pending: false, completed: false };
    active.progress = Math.min(Number(active.requiredCasts) || 0, (Number(active.progress) || 0) + gain);
    active.stats.casts += context.source === "auto" ? 0.45 : 1;
    if (context.source === "auto") active.stats.auto += 1;
    else active.stats.manual += 1;
    if (context.hotspot) active.stats.hotspots += 1;
    if (context.hasRare) active.stats.rare += 1;
    if (context.hasLegendary) active.stats.legendary += 1;
    const pending = queueExpeditionNode();
    if (!pending && active.progress >= active.requiredCasts && active.nodeIndex >= active.thresholds.length) {
      finishExpedition(false);
      return { pending: false, completed: true };
    }
    if (activeModal?.type === "expedition") renderModal();
    return { pending, completed: false };
  }

  function resolveExpeditionChoice(choiceId) {
    const active = state.expedition?.active;
    const node = active?.pendingNode;
    if (!active || !node) return;
    const choice = node.choices.find((item) => item.id === choiceId) || node.choices[0];
    if (!choice) return;
    applyExpeditionChoiceEffect(choice.effect);
    active.nodeIndex = Number(active.nodeIndex || 0) + 1;
    active.pendingNode = null;
    state.expedition.log = [...(state.expedition.log || []), { at: Date.now(), route: active.routeId, title: node.title, choice: choice.label, result: choice.result }].slice(-12);
    recordContract("expedition", 1);
    showToast("航线节点完成", `${node.title} · ${choice.result}`, "success");
    if (active.nodeIndex >= active.thresholds.length) {
      if (active.progress >= active.requiredCasts || active.expired) finishExpedition(false);
      else queueExpeditionNode();
    } else {
      queueExpeditionNode();
    }
    updateAllUI();
    saveGame(true);
  }

  function finishExpedition(early = false) {
    const active = state.expedition?.active;
    if (!active) return;
    if (active.pendingNode) {
      showToast("节点尚未处理", "先完成当前航线节点的选择，再进行返航结算。", "error");
      return;
    }
    const route = getExpeditionRoute(active.routeId);
    const ratio = getExpeditionProgressRatio(active);
    const earlyFactor = active.expired ? clamp(0.45 + ratio * 0.55, 0.45, 1) : early ? clamp(0.35 + ratio * 0.35, 0.35, 0.7) : 1;
    const zoneMult = 1 + (currentZone().priceMult - 1) * 0.12;
    const bonus = active.bonuses || {};
    const gold = Math.max(0, Math.round((route.baseGold + active.progress * route.goldPerCast) * zoneMult * (1 + Number(bonus.goldPct || 0)) * earlyFactor));
    const alloy = Math.max(0, Math.round((Number(route.alloy || 0) + Number(bonus.alloy || 0)) * earlyFactor));
    const crystals = Math.max(0, Math.round((Number(route.crystals || 0) + Number(bonus.crystals || 0)) * earlyFactor));
    state.gold += gold;
    state.totalGoldEarned += gold;
    state.equipment.alloy += alloy;
    state.ascension.crystals += crystals;
    const stats = active.stats || {};
    const score = Math.round(ratio * 1000 + Number(stats.hotspots || 0) * 50 + Number(stats.rare || 0) * 80 + Number(stats.legendary || 0) * 240);
    const mastery = addExpeditionMastery(score);
    state.expedition.completed = Number(state.expedition.completed || 0) + 1;
    state.expedition.bestScore = Math.max(Number(state.expedition.bestScore || 0), score);
    state.expedition.log = [...(state.expedition.log || []), { at: Date.now(), route: active.routeId, title: "返航结算", choice: early ? "提前返航" : "完成航线", result: `得分 ${score}` }].slice(-12);
    state.expedition.active = null;
    if (!early && ratio >= 0.8) {
      state.equipment.rarePity = clamp((Number(state.equipment.rarePity) || 0) + 10 + Math.floor(score / 250), 0, 100);
      const guaranteedSalvage = ratio >= 0.9 && score >= 1300;
      rollEquipmentDrop(route.requiredCasts >= 70 ? "legendary" : "rare", guaranteedSalvage);
    }
    showToast("航线已结算", `${route.name} · 航程得分 ${score}。获得 ${formatNumber(gold)} 金币、${alloy} 合金与 ${crystals} 结晶。`, "gold");
    showEventBanner("航线返航", `${route.name} · ${early ? "提前返航" : "完整航程"} · 得分 ${score}${mastery.gained ? ` · 航线等级 ${mastery.level}` : ""}`, "gold", 4200);
    if (mastery.gained) showToast("航线等级提升", `航线等级达到 ${mastery.level}。永久获得全收益、首领奖励与声呐持续时间加成。`, "gold");
    if (activeModal?.type === "expedition") renderModal();
    updateAllUI();
    saveGame(true);
  }

  function updateExpedition(now = Date.now()) {
    const active = state.expedition?.active;
    if (!active || active.expired || now < active.endsAt) return;
    active.expired = true;
    showEventBanner("航线抵达", "航行时间结束，打开的深渊航线可以结算本次收益。", "gold", 3600);
    showToast("航线抵达", `${getExpeditionRoute(active.routeId).name} 已完成航行，请打开深渊航线结算。`, "info");
    if (activeModal?.type === "expedition") renderModal();
    saveGame(true);
  }
  function getAllStatBonuses() {
    const gear = getEquipmentBonuses();
    const research = getAscensionBonuses();
    const codex = getCodexBonuses();
    const bonuses = blankBonuses();
    COMBINED_STAT_KEYS.forEach((key) => {
      bonuses[key] = getUpgradeStat(key) + Number(gear[key] || 0) + Number(research[key] || 0);
    });
    bonuses.catchPct += Number(codex.catchPct || 0);
    bonuses.rareChance += Number(codex.rareChance || 0);
    bonuses.sellPct += Number(codex.sellPct || 0);
    const trophyCount = Object.keys(state.ascension?.bossTrophies || {}).length;
    bonuses.allYieldPct += trophyCount * 0.01;
    bonuses.bossRewardPct += trophyCount * 0.02;
    return bonuses;
  }

  function getCodexStarCount() {
    return Object.values(state.codexMastery || {}).reduce((sum, record) => sum + (Number(record.stars) || 0), 0);
  }

  function getLeaderboardSnapshot() {
    const unlockedZoneCount = state.unlockedZones.length;
    const equipmentUnique = Object.values(state.equipment?.owned || {}).filter((item) => item && item.archetype).reduce((set, item) => set.add(item.archetype), new Set()).size;
    return {
      totalGoldEarned: Math.max(0, Number(state.totalGoldEarned) || 0),
      unlockedZoneCount,
      bossDefeated: getTotalBossDefeated(),
      ascensionCount: Number(state.ascension?.count) || 0,
      codexStars: getCodexStarCount(),
      discoveredCount: getDiscoveredCount(),
      equipmentUnique,
      totalNodeLevels: allNodes.reduce((sum, node) => sum + getLevel(node.id), 0),
      rareCaught: Number(state.rareCaught) || 0,
      legendaryCaught: Number(state.legendaryCaught) || 0,
      totalFish: Number(state.totalFish) || 0
    };
  }

  function getCaptainScore() {
    const snapshot = getLeaderboardSnapshot();
    if (window.LeaderboardBridge?.calculateCaptainScore) return window.LeaderboardBridge.calculateCaptainScore(snapshot);
    return Math.max(0, Math.floor(Math.log10(snapshot.totalGoldEarned + 10) * 120 + snapshot.unlockedZoneCount * 350 + snapshot.bossDefeated * 500 + snapshot.ascensionCount * 900 + snapshot.codexStars * 60 + snapshot.discoveredCount * 30 + snapshot.equipmentUnique * 35 + snapshot.totalNodeLevels * 8));
  }

  async function submitLeaderboardSnapshot(force = false) {
    if (!window.LeaderboardBridge || !state.profile) return;
    const now = Date.now();
    if (!force && now - (state.leaderboard?.lastSubmitAt || 0) < 60000) return;
    state.leaderboard.lastSubmitAt = now;
    const snapshot = getLeaderboardSnapshot();
    state.leaderboard.cache = { ...(state.leaderboard.cache || {}), captainScore: getCaptainScore() };
    const result = await window.LeaderboardBridge.submitSnapshot(snapshot);
    if (result?.ok) state.leaderboard.lastSyncedAt = Date.now();
    saveGame(true);
  }

  async function openLeaderboard() {
    openModal("leaderboard");
    if (!window.LeaderboardBridge) return;
    await window.LeaderboardBridge.syncPending();
    const board = state.leaderboard?.board || "captain";
    const result = await window.LeaderboardBridge.getLeaderboard(board, 50);
    state.leaderboard.cache[board] = result;
    renderModal();
  }

  async function saveCaptainNickname() {
    const input = document.getElementById("profileNicknameInput");
    const nickname = input?.value || "";
    if (!window.LeaderboardBridge) return;
    const validation = window.LeaderboardBridge.validateNickname(nickname);
    if (!validation.ok) { showToast("昵称不可用", validation.message, "error"); return; }
    const result = state.profile
      ? await window.LeaderboardBridge.changeNickname(nickname, state.profile.deviceToken)
      : await window.LeaderboardBridge.claimNickname(nickname);
    if (!result.ok) { showToast("档案创建失败", result.message, "error"); return; }
    state.profile = result.profile;
    state.profileSetupSeen = true;
    saveGame(true);
    showToast("调查员档案已建立", `${state.profile.nickname}，欢迎进入深海舰长日志。`, "gold");
    renderModal();
  }

  function exportSaveFile() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `潮汐渔场-存档-${getLocalDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("存档已导出", "请妥善保存该 JSON 文件，可在新域名导入。", "success");
  }

  function importSaveFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed || typeof parsed !== "object") throw new Error("invalid");
        parsed.version = 7;
        localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
        showToast("存档导入成功", "页面即将刷新并读取导入进度。", "gold");
        window.setTimeout(() => location.reload(), 500);
      } catch {
        showToast("存档导入失败", "文件不是有效的潮汐渔场存档。", "error");
      }
    };
    reader.readAsText(file);
  }

  async function removeCaptainProfile() {
    if (!window.LeaderboardBridge) return;
    await window.LeaderboardBridge.deleteProfile();
    state.profile = null;
    state.profileSetupSeen = false;
    state.leaderboard.cache = {};
    saveGame(true);
    closeModal();
    showToast("档案已删除", "本机排行榜档案和待同步成绩已清除。", "info");
  }
  async function ensureCaptainProfile() {
    if (state.profile) return;
    if (!state.profileSetupSeen) {
      state.profileSetupSeen = true;
      window.setTimeout(() => openModal("profile"), 520);
    }
  }
  function getLocalDateKey() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  }

  function seededValue(seed) {
    let value = 2166136261;
    for (let i = 0; i < seed.length; i += 1) value = Math.imul(value ^ seed.charCodeAt(i), 16777619);
    return ((value >>> 0) % 10000) / 10000;
  }

  function getCodexBonuses() {
    const bonuses = { catchPct: 0, rareChance: 0, sellPct: 0 };
    species.forEach((fish) => {
      const record = state.codexMastery[fish.id] || { count: 0, stars: 0 };
      if (!record.count) return;
      if (fish.tier === "normal") bonuses.catchPct += 0.004;
      if (fish.tier === "rare") bonuses.rareChance += 0.003;
      if (fish.tier === "legendary") bonuses.sellPct += 0.005;
      const stars = record.count >= 10000 ? 3 : record.count >= 1000 ? 2 : record.count >= 100 ? 1 : 0;
      if (stars > 0) {
        if (fish.tier === "normal") bonuses.catchPct += stars * 0.002;
        if (fish.tier === "rare") bonuses.rareChance += stars * 0.001;
        if (fish.tier === "legendary") bonuses.sellPct += stars * 0.002;
      }
    });
    zones.forEach((zone) => {
      const zoneFish = species.filter((fish) => fish.zone === zone.id);
      if (zoneFish.length && zoneFish.every((fish) => state.discovered[fish.id])) {
        bonuses.catchPct += 0.01;
        bonuses.rareChance += 0.005;
        bonuses.sellPct += 0.01;
      }
    });
    if (species.length && species.every((fish) => state.discovered[fish.id])) {
      bonuses.sellPct += 0.05;
      bonuses.catchPct += 0.02;
    }
    return bonuses;
  }

  function updateCodexMastery(fish, amount) {
    if (!state.codexMastery[fish.id]) state.codexMastery[fish.id] = { count: 0, stars: 0 };
    const record = state.codexMastery[fish.id];
    record.count += amount;
    const nextStars = record.count >= 10000 ? 3 : record.count >= 1000 ? 2 : record.count >= 100 ? 1 : 0;
    if (nextStars > record.stars) {
      record.stars = nextStars;
      showToast("图鉴星级提升", fish.name + "达到 " + nextStars + " 星，永久加成已生效。", "gold");
    }
  }

  function ensureDailyContracts() {
    const date = getLocalDateKey();
    if (state.contracts.date === date && state.contracts.tasks.length) return;
    state.contracts.date = date;
    state.contracts.progress = {};
    state.contracts.claimed = {};
    const pool = [
      { id: "casts", type: "casts", title: "完成撒网次数", target: 60 + Math.floor(seededValue(date + "a") * 90), reward: { crystals: 3, alloy: 3 } },
      { id: "fish", type: "fish", title: "累计捕获鱼类", target: 80 + Math.floor(seededValue(date + "b") * 140), reward: { crystals: 4, alloy: 4 } },
      { id: "sell", type: "sell", title: "出售渔获获得金币", target: 1500 * Math.max(1, state.unlockedZones.length), reward: { crystals: 5, alloy: 5 } },
      { id: "process", type: "process", title: "加工渔获数量", target: 20 + Math.floor(seededValue(date + "c") * 60), reward: { crystals: 4, alloy: 6 } },
      { id: "hotspot", type: "hotspot", title: "命中声呐热点", target: 3 + Math.floor(seededValue(date + "d") * 4), reward: { crystals: 6, alloy: 8 } },
      { id: "expedition", type: "expedition", title: "推进深渊航线节点", target: 2 + Math.floor(seededValue(date + "e") * 3), reward: { crystals: 5, alloy: 7 } },
      { id: "boss", type: "boss", title: "击败巨兽信号", target: 1, reward: { crystals: 10, alloy: 12 } }
    ];
    state.contracts.tasks = pool.sort((a, b) => seededValue(date + a.id) - seededValue(date + b.id)).slice(0, 3);
  }

  function recordContract(type, amount = 1) {
    if (!state.contracts.tasks.length) ensureDailyContracts();
    state.contracts.tasks.forEach((task) => {
      if (task.type !== type) return;
      state.contracts.progress[task.id] = Math.min(task.target, (state.contracts.progress[task.id] || 0) + amount);
    });
  }

  function claimContract(id) {
    const task = state.contracts.tasks.find((item) => item.id === id);
    if (!task || state.contracts.claimed[id]) return;
    if ((state.contracts.progress[id] || 0) < task.target) return;
    state.contracts.claimed[id] = true;
    state.ascension.crystals += task.reward.crystals || 0;
    state.equipment.alloy += task.reward.alloy || 0;
    state.equipment.rarePity = Math.min(80, state.equipment.rarePity + 5);
    renderModal();
    saveGame(true);
    showToast("委托奖励已领取", "获得 " + task.reward.crystals + " 结晶与 " + task.reward.alloy + " 合金。", "gold");
  }

  function spawnSonarHotspots() {
    const now = Date.now();
    const durationPct = clamp(Number(getAllStatBonuses().hotspotDurationPct) || 0, 0, 2);
    const count = 1 + Math.floor(Math.random() * 3);
    const hotspots = [];
    for (let i = 0; i < count; i += 1) {
      const roll = Math.random();
      const type = roll < 0.08 ? "legendary" : roll < 0.3 ? "rare" : "normal";
      const def = HOTSPOT_TYPES[type];
      hotspots.push({ id: now + "-" + i + "-" + Math.floor(Math.random() * 9999), type, zone: state.currentZone, x: 12 + Math.random() * 76, y: 42 + Math.random() * 42, vx: (Math.random() - 0.5) * 0.0016, radius: def.radius + getLevel("sonar") * 0.45 + getLevel("fish_radar") * 0.3, bornAt: now, expiresAt: now + (def.duration * (1 + durationPct) + getLevel("fish_radar") * 0.4) * 1000 });
    }
    const bossSpot = (state.sonar.hotspots || []).find((spot) => state.boss && state.boss.hotspotId === spot.id);
    state.sonar.hotspots = bossSpot ? [...hotspots, bossSpot] : hotspots;
    state.sonar.nextSpawnAt = now + (18000 + Math.random() * 12000) * (1 - Math.min(0.35, getUpgradeStat("eventRate")));
    renderSonarHotspots();
  }

  function updateSonar(now, delta) {
    const bossSpotId = state.boss && state.boss.zone === state.currentZone ? state.boss.hotspotId : null;
    state.sonar.hotspots = (state.sonar.hotspots || []).filter((spot) => spot.zone === state.currentZone && (spot.expiresAt > now || spot.id === bossSpotId));
    state.sonar.hotspots.forEach((spot) => {
      spot.x = clamp(spot.x + spot.vx * delta * 1000, 7, 93);
      if (spot.x <= 7 || spot.x >= 93) spot.vx *= -1;
      if (state.boss && state.boss.hotspotId === spot.id) {
        spot.expiresAt = Math.max(spot.expiresAt, state.boss.expiresAt || now + 60000);
        state.boss.x = spot.x;
        state.boss.y = spot.y;
      }
    });
    if (state.boss && state.boss.phase === 1) {
      const candidates = state.sonar.hotspots.filter((spot) => spot.zone === state.currentZone);
      if (!state.boss.weakpointId || !candidates.some((spot) => spot.id === state.boss.weakpointId)) {
        state.boss.weakpointId = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].id : null;
      }
    }
    if (now >= (state.sonar.nextSpawnAt || 0)) spawnSonarHotspots();
    if (state.boss && state.boss.expiresAt && now > state.boss.expiresAt && state.boss.active) {
      state.boss.active = false;
      showEventBanner("首领潜伏", "本次锁定进度已保留，再次命中可继续。", "rare", 2600);
    }
    renderSonarHotspots();
    renderBossHud();
  }

  function castPointPercent() {
    if (!pointerOrigin) return { x: 50, y: 62 };
    const rect = dom.seaPanel.getBoundingClientRect();
    return { x: clamp(((pointerOrigin.x - rect.left) / rect.width) * 100, 0, 100), y: clamp(((pointerOrigin.y - rect.top) / rect.height) * 100, 30, 100) };
  }

  function findHotspotForCast(source) {
    const point = source === "auto" ? { x: 50, y: 62 } : castPointPercent();
    let closest = null; let closestDistance = Infinity;
    state.sonar.hotspots.forEach((spot) => { const distance = Math.hypot(point.x - spot.x, point.y - spot.y); if (distance <= spot.radius && distance < closestDistance) { closest = spot; closestDistance = distance; } });
    return closest ? { spot: closest, strength: source === "auto" ? 0.3 : 1 } : null;
  }

  function updateEcology(now = Date.now()) {
    if (now - lastEcologyUpdate < 5000) return;
    lastEcologyUpdate = now;
    zones.forEach((zone) => {
      const ecology = state.ecology[zone.id] || (state.ecology[zone.id] = { preyDensity: 1, predatorPressure: 0.05, schoolMorale: 0.92, predatorCount: 0, lastUpdatedAt: now });
      const progress = state.zoneProgress[zone.id] || { caught: 0, bossDefeated: 0 };
      const pressureSeed = 0.01 + Math.random() * 0.035;
      const predatorCount = ecology.predatorPressure > 0.34 ? 2 : ecology.predatorPressure > 0.16 ? 1 : 0;
      const hunted = predatorCount * pressureSeed;
      ecology.predatorPressure = clamp(ecology.predatorPressure + hunted - (progress.caught > 0 ? 0.004 : 0.001), 0.02, 0.58);
      ecology.preyDensity = clamp(ecology.preyDensity + 0.018 - predatorCount * 0.014 + (Math.random() - 0.5) * 0.025, 0.68, 1.32);
      ecology.schoolMorale = clamp(1 - ecology.predatorPressure * 0.32 - (1.1 - ecology.preyDensity) * 0.18 + Math.random() * 0.015, 0.7, 1.08);
      ecology.predatorCount = predatorCount;
      ecology.lastUpdatedAt = now;
    });
    const modifiers = getEcologyModifiers();
    if (dom.ecologyHud) {
      dom.ecologyHud.classList.toggle("predator", modifiers.predatorPressure >= 0.3);
      dom.ecologyHud.classList.toggle("rich", modifiers.preyDensity >= 1.12);
      dom.ecoDensity.textContent = `${Math.round(modifiers.preyDensity * 100)}%`;
      dom.ecoPressure.textContent = `${Math.round(modifiers.predatorPressure * 100)}%`;
      dom.ecoMorale.textContent = `${Math.round(modifiers.schoolMorale * 100)}%`;
      dom.ecoModifier.textContent = `${modifiers.rareBonus >= 0 ? "+" : ""}${(modifiers.rareBonus * 100).toFixed(1)}% 稀有`;
    }
    emitTide("tide:ecology", { zone: state.currentZone, ecology: state.ecology[state.currentZone], modifiers });
  }

  function getEquippedActiveSkills() {
    const skills = [];
    Object.entries(EQUIPMENT_SLOTS).forEach(([slot]) => {
      const id = state.equipment?.equipped?.[slot];
      const item = id && state.equipment.owned[id];
      if (!item) return;
      const archetype = getEquipmentArchetype(slot, item);
      if (archetype.activeSkill && GEAR_SKILLS[archetype.activeSkill] && !skills.includes(archetype.activeSkill)) skills.push(archetype.activeSkill);
    });
    return skills;
  }

  function getGearSkillCooldownRemaining(skillId, now = Date.now()) {
    const skill = GEAR_SKILLS[skillId];
    if (!skill) return 0;
    return Math.max(0, (Number(gearSkillCooldowns[skillId]) || 0) - now) / 1000;
  }

  function activateGearSkill(skillId, manual = false) {
    const skill = GEAR_SKILLS[skillId];
    if (!skill || !getEquippedActiveSkills().includes(skillId)) return false;
    const now = Date.now();
    if (getGearSkillCooldownRemaining(skillId, now) > 0) return false;
    const haste = clamp(getAllStatBonuses().skillHastePct, 0, 0.65);
    const cooldown = skill.cooldown * (1 - haste) * (manual ? 1 : 1.15);
    gearSkillCooldowns[skillId] = now + cooldown * 1000;
    gearSkillBuffs[skillId] = { until: now + skill.duration * 1000 };
    if (skillId === "sky_pulse") { gearSkillBuffs.catchPct = 0.8; gearSkillBuffs.emptyPct = 0.02; gearSkillBuffs.catchPctUntil = now + skill.duration * 1000; gearSkillBuffs.emptyPctUntil = now + skill.duration * 1000; }
    if (skillId === "overdrive") { gearSkillBuffs.autoRateMult = 2.5; gearSkillBuffs.autoRateMultUntil = now + skill.duration * 1000; }
    if (skillId === "golden_explosion") { gearSkillBuffs.rareChance = 0.12; gearSkillBuffs.legendChance = 0.02; gearSkillBuffs.rareChanceUntil = now + skill.duration * 1000; gearSkillBuffs.legendChanceUntil = now + skill.duration * 1000; }
    if (skillId === "time_field") { gearSkillBuffs.castCooldownMult = 0.65; gearSkillBuffs.castCooldownMultUntil = now + skill.duration * 1000; }
    emitTide("tide:gear-skill", { skillId, skill, manual, origin: pointerOrigin });
    showEventBanner(skill.name, `${manual ? "手动" : "自动"}释放 · ${skill.description}`, skillId === "golden_explosion" ? "gold" : "rare", 2600);
    renderGearSkillHud();
    return true;
  }

  function updateGearSkills(now = Date.now()) {
    Object.entries(gearSkillBuffs).forEach(([key, value]) => {
      if (!value || typeof value !== "object" || !value.until) return;
      if (now >= value.until) delete gearSkillBuffs[key];
    });
    [
      ["catchPct", "catchPctUntil"], ["emptyPct", "emptyPctUntil"], ["autoRateMult", "autoRateMultUntil"],
      ["rareChance", "rareChanceUntil"], ["legendChance", "legendChanceUntil"], ["castCooldownMult", "castCooldownMultUntil"]
    ].forEach(([valueKey, untilKey]) => {
      if (gearSkillBuffs[valueKey] !== undefined && (!gearSkillBuffs[untilKey] || now >= gearSkillBuffs[untilKey])) {
        delete gearSkillBuffs[valueKey];
        delete gearSkillBuffs[untilKey];
      }
    });
    const mode = state.equipment?.skillMode || "auto";
    if (mode === "auto") {
      ["time_field", "overdrive", "golden_explosion", "sky_pulse"].forEach((skillId) => {
        if (!getEquippedActiveSkills().includes(skillId) || !(state.equipment.skillLoadout || []).includes(skillId)) return;
        if ((state.boss?.active && skillId === "golden_explosion") || (!state.boss?.active && skillId !== "golden_explosion")) activateGearSkill(skillId, false);
      });
    }
    renderGearSkillHud();
  }

  function renderGearSkillHud() {
    if (!dom.gearSkillHud) return;
    const equipped = getEquippedActiveSkills();
    const selected = (state.equipment?.skillLoadout || []).filter((id) => equipped.includes(id)).slice(0, 3);
    dom.gearSkillHud.innerHTML = selected.length ? selected.map((skillId) => {
      const skill = GEAR_SKILLS[skillId];
      const remaining = getGearSkillCooldownRemaining(skillId);
      const active = gearSkillBuffs[skillId] && gearSkillBuffs[skillId].until > Date.now();
      return `<button type="button" class="gear-skill-button ${active ? "active" : ""}" data-gear-skill="${skillId}" ${remaining > 0 ? "disabled" : ""} style="--skill-color:${skill.color}"><b>${skill.icon}</b><span><strong>${skill.name}</strong><small>${remaining > 0 ? `${remaining.toFixed(1)}s` : active ? "ACTIVE" : ["R", "T", "Y"][selected.indexOf(skillId)] || "技能"}</small></span></button>`;
    }).join("") : `<span class="gear-skill-empty">装备带主动技的装备后在此释放 · <kbd>G</kbd> 打开舰载装备</span>`;
    if (!(state.equipment.skillLoadout || []).length && equipped.length) state.equipment.skillLoadout = equipped.slice(0, 3);
    dom.gearSkillHud.parentElement?.classList.toggle("empty", selected.length === 0);
    const activeSlot = Object.entries(EQUIPMENT_SLOTS).find(([slot]) => {
      const item = state.equipment.equipped[slot] && state.equipment.owned[state.equipment.equipped[slot]];
      return item && getEquipmentArchetype(slot, item).activeSkill;
    });
    if (activeSlot) {
      const item = state.equipment.owned[state.equipment.equipped[activeSlot[0]]];
      emitTide("tide:gear-aura", { slot: activeSlot[0], rarity: item.rarity, active: selected.length > 0 });
    }
    dom.gearSkillMode.textContent = (state.equipment?.skillMode || "auto") === "auto" ? "协同释放" : "手动协同";
  }
  function renderSonarHotspots() {
    if (!dom.sonarLayer) return;
    const hotspots = (state.sonar.hotspots || []).filter((spot) => spot.zone === state.currentZone);
    dom.sonarLayer.innerHTML = hotspots.map((spot) => { const remaining = Math.max(0, Math.ceil(((Number(spot.expiresAt) || Date.now()) - Date.now()) / 1000)); return `<span class="sonar-hotspot ${spot.type}" style="--x:${spot.x}%;--y:${spot.y}%;--size:${spot.radius * 2}%;--delay:${(spot.bornAt || 0) % 1400}ms"><i></i><b>${HOTSPOT_TYPES[spot.type].name}</b><small>范围 ${Math.round(spot.radius)}% · ${remaining}s</small></span>`; }).join("");
    emitTide("tide:sonar", { hotspots: hotspots.map((spot) => ({ id: spot.id, type: spot.type, x: spot.x, y: spot.y, radius: spot.radius })) });
  }

  function getBossPhaseGoal(bossOrZone, phase = 1) {
    const zoneId = typeof bossOrZone === "string" ? bossOrZone : bossOrZone?.zone;
    const index = Math.max(0, zones.findIndex((zone) => zone.id === zoneId));
    if (phase === 1) return index <= 3 ? 3 : index <= 5 ? 4 : 5;
    if (phase === 2) return index <= 3 ? 6 : index <= 5 ? 8 : 10;
    return index <= 3 ? 3 : index <= 5 ? 4 : 5;
  }

  function getBossWeakpointDirection(boss) {
    const spot = (state.sonar?.hotspots || []).find((item) => item.id === boss?.weakpointId) || (state.sonar?.hotspots || []).find((item) => item.id === boss?.hotspotId);
    if (!spot) return "待声呐锁定";
    const horizontal = spot.x < 42 ? "左侧" : spot.x > 58 ? "右侧" : "中央";
    const vertical = spot.y < 54 ? "上方" : spot.y > 72 ? "下方" : "中段";
    return horizontal === "中央" ? `${vertical}弱点` : `${horizontal}${vertical}`;
  }

  function getBossPhaseInstruction(boss) {
    if (!boss) return "捕获鱼类以召唤首领。";
    if (boss.phase === 1) return `把网落在${getBossWeakpointDirection(boss)}的发光位置。`;
    if (boss.phase === 2) return "金色热点最有效；稀有鱼 +1.5 格，传说鱼 +2 格。";
    return "红色收网窗口出现时按空格、点击或触屏完成终结。";
  }
  function updateZoneProgress(amount) {
    const progress = state.zoneProgress[state.currentZone];
    if (!progress) return;
    progress.caught += amount;
    progress.bossCharge += amount;
    progress.mastery = Math.min(100, (Number(progress.mastery) || 0) + amount * 0.002);
    const bossDef = BOSS_DEFS[state.currentZone];
    if (!state.boss && bossDef && progress.bossCharge >= bossDef.threshold) {
      const hotspot = (state.sonar.hotspots || [])[0] || null;
      state.boss = {
        zone: state.currentZone,
        name: bossDef.name,
        icon: bossDef.icon,
        x: hotspot ? hotspot.x : 32 + Math.random() * 36,
        y: hotspot ? hotspot.y : 50 + Math.random() * 22,
        hotspotId: hotspot ? hotspot.id : null,
        weakpointId: hotspot ? hotspot.id : null,
        phase: 1,
        phaseProgress: 0,
        finisher: 0,
        finisherWindowUntil: 0,
        startedAt: now,
        finisherMisses: 0,
        perfectFinishers: 0,
        windowPerfect: true,
        brokenParts: [],
        phaseBuff: null,
        active: true,
        expiresAt: Date.now() + 120000
      };
      showEventBanner("首领出现：" + bossDef.name, "第一阶段：追索移动弱点，手动撒网命中正确热点。", "rare", 5000);
      if (!state.bossTutorialSeen) { state.bossTutorialSeen = true; window.setTimeout(() => openModal("bossTutorial"), 420); saveGame(true); }
      renderBossHud();
    }
  }

  function advanceBossProgress(hotspotHit, source, point, catchInfo = {}) {
    const boss = state.boss;
    if (!boss || boss.zone !== state.currentZone) return;
    const now = Date.now();
    if (!boss.active) { boss.active = true; boss.expiresAt = now + 120000; }
    const hotspot = hotspotHit && hotspotHit.spot;
    const autoScale = source === "auto" ? 0.25 : 1;
    const strongCatch = Boolean(catchInfo.hasRare || catchInfo.hasLegendary);
    if (boss.phase === 1) {
      const valid = Boolean(hotspot && (!boss.weakpointId || hotspot.id === boss.weakpointId || hotspot.id === boss.hotspotId));
      if (!valid) { renderBossHud(); return; }
      boss.phaseProgress += autoScale * (1 + clamp(getAllStatBonuses().bossPowerPct, 0, 3) + clamp(getExpeditionBonuses().bossProgressPct + getBossCombatBuffs().bossProgressPct, 0, 1.5));
      boss.expiresAt = now + 120000;
      emitTide("tide:impact", { type: "rare" });
      if (boss.phaseProgress >= getBossPhaseGoal(boss, 1)) {
        boss.phase = 2;
        boss.phaseProgress = 0;
        boss.brokenParts = Array.from(new Set([...(boss.brokenParts || []), "sonar"]));
        state.bossMaterials.sonarShard = Number(state.bossMaterials.sonarShard || 0) + 1;
        boss.phaseBuff = { type: "sonar_lock", until: now + 15000, rareChance: 0.03, legendChance: 0.005 };
        showToast("声呐核心碎片 +1", "破坏声呐核心后获得巨兽熔铸材料。", "success");
        showEventBanner("声呐核心已破坏 · 护甲破译", "15 秒声呐校准：稀有率 +3%，传说率 +0.5%。捕获稀有鱼或命中热点继续破甲。", "rare", 3800);
      }
      renderBossHud();
      return;
    }
    if (boss.phase === 2) {
      const valid = Boolean(hotspot || strongCatch);
      if (!valid) { renderBossHud(); return; }
      boss.phaseProgress += autoScale * (strongCatch ? 1.5 : 1) * (1 + clamp(getAllStatBonuses().bossPowerPct, 0, 3) + clamp(getExpeditionBonuses().bossProgressPct + getBossCombatBuffs().bossProgressPct, 0, 1.5));
      boss.expiresAt = now + 120000;
      if (boss.phaseProgress >= getBossPhaseGoal(boss, 2)) {
        boss.phase = 3;
        boss.phaseProgress = 0;
        boss.finisher = 0;
        boss.finisherWindowUntil = now + 2200;
        boss.windowAttempted = false;
        boss.windowPerfect = true;
        boss.brokenParts = Array.from(new Set([...(boss.brokenParts || []), "armor"]));
        state.bossMaterials.armorPlate = Number(state.bossMaterials.armorPlate || 0) + 1;
        boss.phaseBuff = { type: "armor_break", until: now + 20000, catchPct: 0.15, bossProgressPct: 0.12 };
        showToast("巨兽护甲片 +1", "外层护甲已破坏，材料已收入舰载仓库。", "success");
        showEventBanner("护甲已破坏 · 终结收网", "20 秒护甲崩解：捕获量 +15%。抓住红色窗口完成终结。", "gold", 3800);
      }
      renderBossHud();
      return;
    }
    if (boss.phase === 3) {
      if (now > boss.finisherWindowUntil) {
        if (!boss.windowAttempted) {
          boss.windowAttempted = true;
          boss.windowPerfect = false;
          boss.finisherMisses = Number(boss.finisherMisses || 0) + 1;
        }
        boss.finisherWindowUntil = now + 4000;
        showEventBanner("窗口延长", "本次未命中，终结窗口延长 4 秒；已有破坏进度不会重置。", "rare", 2200);
        renderBossHud();
        return;
      }
      boss.finisher += autoScale * Math.max(.25, 1 + clamp(getAllStatBonuses().bossPowerPct, 0, 3) + clamp(getExpeditionBonuses().bossProgressPct + getBossCombatBuffs().bossProgressPct, 0, 1.5));
      if (source === "auto") boss.perfectFinishers = Number(boss.perfectFinishers || 0) + 0.25;
      else if (!boss.windowAttempted || boss.windowPerfect) boss.perfectFinishers = Number(boss.perfectFinishers || 0) + 1;
      boss.windowAttempted = false;
      boss.windowPerfect = true;
      boss.expiresAt = now + 120000;
      if (boss.finisher >= getBossPhaseGoal(boss, 3)) {
        const perfectFinishers = Number(boss.perfectFinishers) || 0;
        const missedFinishers = Number(boss.finisherMisses) || 0;
        const flawless = missedFinishers === 0;
        const legendaryChance = clamp(0.25 + perfectFinishers * 0.08 + (flawless ? 0.1 : 0), 0, 0.8);
        const droppedLegendary = Math.random() < legendaryChance;
        createEquipment(Object.keys(EQUIPMENT_SLOTS)[Math.floor(Math.random() * Object.keys(EQUIPMENT_SLOTS).length)], "epic");
        if (droppedLegendary) createEquipment(Object.keys(EQUIPMENT_SLOTS)[Math.floor(Math.random() * Object.keys(EQUIPMENT_SLOTS).length)], "legendary");
        const bossRewardScale = 1 + clamp(getAllStatBonuses().bossRewardPct, 0, 5) + perfectFinishers * 0.1;
        const crystalReward = Math.round(10 * bossRewardScale);
        const alloyReward = Math.round(15 * bossRewardScale);
        state.ascension.crystals += crystalReward;
        state.equipment.alloy += alloyReward;
        state.equipment.rarePity = clamp((Number(state.equipment.rarePity) || 0) + Math.round(perfectFinishers * 5), 0, 100);
        state.bossMaterials.voidHeart = Number(state.bossMaterials.voidHeart || 0) + 1;
        recordBossDefeat(state.currentZone, boss);
        const progress = state.zoneProgress[state.currentZone];
        progress.bossCharge = Math.max(0, progress.bossCharge - BOSS_DEFS[state.currentZone].threshold);
        progress.bossDefeated += 1;
        state.ascension.totalBossDefeated = getTotalBossDefeated() + 1;
        state.ascension.bossTrophies[state.currentZone] = (state.ascension.bossTrophies[state.currentZone] || 0) + 1;
        state.boss = null;
        recordContract("boss", 1);
        renderBossHud();
        flashScreen("ultimate");
        showEventBanner("首领已击败", `获得史诗装备${droppedLegendary ? "与传说装备" : ""}、${crystalReward} 结晶、${alloyReward} 合金 · 完美终结 ${perfectFinishers.toFixed(2)}`, "gold", 5600);
        saveGame(true);
      } else {
        renderBossHud();
      }
    }
  }

  function renderBossHud() {
    if (!dom.bossHud) return;
    const boss = state.boss;
    if (!boss || boss.zone !== state.currentZone) { dom.bossHud.hidden = true; return; }
    const phaseGoal = getBossPhaseGoal(boss, boss.phase);
    const phaseProgress = boss.phase === 3 ? boss.finisher : boss.phaseProgress;
    const remaining = boss.active ? Math.max(0, (boss.expiresAt - Date.now()) / 1000) : 0;
    const phaseName = BOSS_DEFS[boss.zone]?.phases?.[boss.phase - 1] || "猎杀";
    dom.bossHud.hidden = false;
    const expanded = Boolean(state.ui?.bossBannerExpanded);
    const bossBuff = getBossCombatBuffs();
    const buffSeconds = boss.phaseBuff?.until ? Math.max(0, Math.ceil((boss.phaseBuff.until - Date.now()) / 1000)) : 0;
    const parts = [
      ["sonar", "声呐核心"],
      ["armor", "外层护甲"],
      ["core", "虚空心脏"]
    ].map(([id, label]) => `${label}${(boss.brokenParts || []).includes(id) ? "✓" : "○"}`).join(" · ");
    const instruction = `${getBossPhaseInstruction(boss)}${bossBuff.label ? ` · ${bossBuff.label} ${buffSeconds}s` : ""}`;
    dom.bossHud.innerHTML = `<button class="boss-banner-toggle" type="button" data-boss-toggle><span class="boss-icon">${boss.icon}</span><span><small>第 ${boss.phase} 阶段 · ${phaseName} · ${boss.active ? formatDuration(remaining) : "潜伏中"}</small><strong>${boss.name}</strong><em>${instruction}</em><i><b style="width:${Math.round((phaseProgress / phaseGoal) * 100)}%"></b></i></span><em>${Math.round((phaseProgress / phaseGoal) * 100)}%</em></button><div class="boss-banner-details" ${expanded ? "" : "hidden"}><span>弱点</span><b>${boss.phase === 1 ? `${Math.round(phaseProgress)} / ${phaseGoal}` : boss.phase > 1 ? "完成" : "待开始"}</b><span>破甲</span><b>${boss.phase === 2 ? `${Math.round(phaseProgress)} / ${phaseGoal}` : boss.phase > 2 ? "完成" : "待开始"}</b><span>终结</span><b>${boss.phase === 3 ? `${Math.round(phaseProgress)} / ${phaseGoal}` : "待开始"}</b><span>部位</span><b>${parts}</b><span>完美终结</span><b>${Number(boss.perfectFinishers || 0).toFixed(2)}</b></div>`;
    emitTide("tide:boss", { boss: { ...boss, phaseGoal, remaining, phaseName } });
  }

  function getUltimateCount() {
    return ["sky_net", "ocean_fleet", "school_beacon"].filter((id) => getLevel(id) >= 1).length;
  }

  function canAscend() {
    return getUltimateCount() >= 3;
  }

  function getAscensionReward() {
    return Math.max(1, Math.floor(Math.log10(state.totalGoldEarned + 10) * 12) + state.unlockedZones.length * 5 + getTotalBossDefeated() * 3 + getUltimateCount() * 8 + (Number(state.expedition?.masteryLevel) || 0) * 4 + (allNodes.every((node) => getLevel(node.id) >= node.max) ? 30 : 0));
  }

  function getEquipmentScore(item) {
    const rarity = EQUIPMENT_RARITIES[item.rarity] || EQUIPMENT_RARITIES.common;
    const archetype = getEquipmentArchetype(item.slot, item);
    return rarity.multiplier * 100 + item.level * 10 + (archetype.activeSkill ? 15 : 0);
  }

  function createEquipment(slot, rarity, archetypeId = null) {
    const slotDef = EQUIPMENT_SLOTS[slot] || EQUIPMENT_SLOTS.net;
    const archetypes = EQUIPMENT_ARCHETYPES[slot] || [{ id: "legacy", name: "传统装备", stat: {} }];
    const availableArchetypes = archetypes.filter((entry) => !entry.bossOnly || entry.id === archetypeId);
    const archetype = availableArchetypes.find((entry) => entry.id === archetypeId) || availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)] || archetypes[0];
    const setIds = Object.keys(EQUIPMENT_SETS);
    const setId = setIds[Math.floor(Math.random() * setIds.length)];
    const id = setId + ":" + slot + ":" + archetype.id + ":" + rarity;
    const existing = state.equipment.owned[id];
    if (existing) {
      existing.level = Math.min(10, (Number(existing.level) || 1) + 1);
      state.equipment.alloy += 5;
      showToast("装备强化", `${EQUIPMENT_SETS[setId].name}${archetype.name}提升至 Lv.${existing.level}`, "gold");
      return existing;
    }
    const item = { id, slot, archetype: archetype.id, rarity, set: setId, level: 1 };
    state.equipment.owned[id] = item;
    state.equipment.discovered[archetype.id] = true;
    const equippedId = state.equipment.equipped[slot];
    const equipped = equippedId && state.equipment.owned[equippedId];
    if (!state.equipment.lockedSlots[slot] && (!equipped || getEquipmentScore(item) > getEquipmentScore(equipped))) {
      state.equipment.equipped[slot] = id;
      if (archetype.activeSkill && state.equipment.skillLoadout.length < 3 && !state.equipment.skillLoadout.includes(archetype.activeSkill)) state.equipment.skillLoadout.push(archetype.activeSkill);
    }
    showToast("发现装备", `${EQUIPMENT_RARITIES[rarity].name}·${EQUIPMENT_SETS[setId].name}${archetype.name}`, rarity === "legendary" ? "gold" : "success");
    return item;
  }

  function rollEquipmentDrop(tier, force = false) {
    const baseLuck = Number(tier === "legendary" ? 0.12 : tier === "rare" ? 0.02 : 0);
    const gearLuck = getAllStatBonuses().gearDropPct || 0;
    const luck = baseLuck + gearLuck;
    const pity = (state.equipment.rarePity || 0) + (luck > 0 ? 1 : 0);
    const shouldDrop = force || Math.random() < luck || (luck > 0 && pity >= 80);
    if (shouldDrop) {
      state.equipment.rarePity = 0;
      const rarityRoll = Math.random();
      const rarity = rarityRoll < (tier === "legendary" ? 0.1 : 0.015) ? "legendary" : rarityRoll < 0.3 ? "epic" : rarityRoll < 0.68 ? "rare" : "common";
      createEquipment(Object.keys(EQUIPMENT_SLOTS)[Math.floor(Math.random() * Object.keys(EQUIPMENT_SLOTS).length)], rarity);
      saveGame(true);
    } else {
      state.equipment.rarePity = pity;
    }
  }

  function performAscension() {
    if (!canAscend()) return;
    const reward = getAscensionReward();
    state.ascension.count += 1;
    state.ascension.crystals += reward;
    const startBonuses = getAllStatBonuses();
    state.gold = startBonuses.startingGold || 0;
    state.inventory = {};
    state.unlockedZones = isProtocolUnlocked("deep_start") ? ["shallow", "reef"] : ["shallow"];
    state.currentZone = "shallow";
    Object.keys(state.upgrades).forEach((id) => { state.upgrades[id] = 0; });
    const startingTalent = Math.floor(startBonuses.startingTalent || 0);
    ["wide_net", "trawler", "sonar"].forEach((id, index) => { if (index < startingTalent) state.upgrades[id] = 1; });
    closeModal();
    emitTide("tide:zone", { zone: "shallow" });
    flashScreen("ultimate");
    updateAllUI();
    saveGame(true);
    showToast("深渊跃迁完成", `获得 ${reward} 枚深渊结晶，收藏、装备、科研与协议已保留。`, "gold");
  }

  function buyResearch(key) {
    const def = RESEARCH_DEFS[key];
    const level = getResearchLevel(key);
    if (!def || level >= 10) return;
    const cost = Math.ceil(8 * Math.pow(1.55, level));
    if (state.ascension.crystals < cost) {
      showToast("深渊结晶不足", `升级需要 ${cost} 枚结晶。`, "error");
      return;
    }
    state.ascension.crystals -= cost;
    state.ascension.research[key] = level + 1;
    updateAllUI();
    saveGame(true);
    showToast("科研升级成功", `${def.name}提升至 Lv.${level + 1}`, "success");
  }

  function upgradeEquipment(id) {
    const item = state.equipment.owned[id];
    if (!item || item.level >= 10) return;
    const rarity = EQUIPMENT_RARITIES[item.rarity] || EQUIPMENT_RARITIES.common;
    const cost = Math.ceil((12 + item.level * 16) * rarity.multiplier);
    if (state.equipment.alloy < cost) {
      showToast("深渊合金不足", `强化需要 ${cost} 合金。`, "error");
      return;
    }
    state.equipment.alloy -= cost;
    item.level += 1;
    updateAllUI();
    saveGame(true);
  }
  function isZoneUnlocked(id) {
    return state.unlockedZones.includes(id);
  }

  function getZoneCost(zone) {
    const discount = clamp(Number(getAllStatBonuses().zoneDiscountPct) || 0, 0, 0.5);
    return Math.max(0, Math.floor((Number(zone?.cost) || 0) * (1 - discount)));
  }

  function hasZoneRequirements(zone) {
    const requirements = zone?.unlockRequirements;
    if (!requirements) return true;
    if (requirements.bosses && getTotalBossDefeated() < requirements.bosses) return false;
    if (requirements.research && getResearchTotalLevel() < requirements.research) return false;
    if (requirements.ascension && (state.ascension?.count || 0) < requirements.ascension) return false;
    if (requirements.protocol && !isProtocolUnlocked(requirements.protocol)) return false;
    return true;
  }

  function zoneRequirementText(zone) {
    const requirements = zone?.unlockRequirements;
    if (!requirements) return "无额外权限要求";
    const parts = [];
    if (requirements.bosses) parts.push(`击败 ${requirements.bosses} 个首领`);
    if (requirements.research) parts.push(`科研总等级 ${requirements.research}`);
    if (requirements.ascension) parts.push(`完成 ${requirements.ascension} 次跃迁`);
    if (requirements.protocol) parts.push(`解锁协议「${ASCENSION_PROTOCOLS.find((item) => item.id === requirements.protocol)?.name || requirements.protocol}」`);
    return parts.join(" · ");
  }

  function getNode(id) {
    return byId(allNodes, id);
  }

  function getUpgradeCost(node, level = getLevel(node.id)) {
    return Math.max(1, Math.floor(node.baseCost * Math.pow(1.48, level)));
  }

  function getPrerequisites(node) {
    if (Array.isArray(node.prerequisites)) return node.prerequisites;
    return node.prerequisite ? [node.prerequisite] : [];
  }

  function prerequisiteMet(node) {
    return getPrerequisites(node).every((item) => getLevel(item.id) >= item.level);
  }

  function prerequisiteText(node) {
    const prerequisites = getPrerequisites(node);
    if (!prerequisites.length) return "无前置";
    return prerequisites.map((item) => {
      const required = getNode(item.id);
      if (!required) return "未知前置";
      return `需要${required.name} Lv.${item.level}`;
    }).join(" + ");
  }

  function achievementBonus(key) {
    let total = 0;
    achievements.forEach((achievement) => {
      if (!state.achievements[achievement.id]) return;
      total += Number(achievement.rewardData[key] || 0);
    });
    return total;
  }

  function getCapacity() {
    return CAP_BASE + getLevel("cold_storage") * 30 + achievementBonus("capacity") + getAllStatBonuses().capacity;
  }

  function getHoldCount() {
    return Object.values(state.inventory).reduce((sum, item) => sum + Number(item.raw || 0) + Number(item.processed || 0), 0);
  }

  function getGearSkillBonus(key, fallback = 0) {
    return Number(gearSkillBuffs[key] ?? fallback) || 0;
  }

  function getAutoRate() {
    const stats = getAllStatBonuses();
    const base = getLevel("trawler") * 0.15 + stats.autoRate;
    const fleetMult = getLevel("ocean_fleet") > 0 ? 2 : 1;
    return base * fleetMult * (1 + achievementBonus("auto") + stats.autoRatePct) * (getGearSkillBonus("autoRateMult", 1) || 1);
  }

  function getCatchMultiplier() {
    const wideBonus = (1 + getLevel("wide_net") * 0.15) * (1 + getLevel("deep_winch") * 0.05);
    const ultimateMult = (getLevel("sky_net") > 0 ? 2 : 1) * (getLevel("school_beacon") > 0 ? 2 : 1);
    const achievementMult = (1 + achievementBonus("amount")) * (1 + getAllStatBonuses().catchPct);
    const migrationMult = state.activeEvent && state.activeEvent.type === "migration" && state.activeEvent.until > Date.now() ? 2 : 1;
    return wideBonus * ultimateMult * achievementMult * migrationMult * (1 + getGearSkillBonus("catchPct")) * (1 + getExpeditionBonuses().catchPct) * (1 + getBossCombatBuffs().catchPct);
  }

  function getDoubleChance() {
    return clamp(getLevel("tough_rope") * 0.05 + getAllStatBonuses().doubleChance, 0, 1);
  }

  function getEmptyChance() {
    return clamp(currentZone().emptyChance - getLevel("fine_mesh") * 0.08 - getAllStatBonuses().emptyPct - getGearSkillBonus("emptyPct"), 0.02, 0.95);
  }

  function getRareChance() {
    return clamp(currentZone().rareChance + getLevel("sonar") * 0.03 + achievementBonus("rare") + getAllStatBonuses().rareChance + getEcologyModifiers().rareBonus + getGearSkillBonus("rareChance") + getExpeditionBonuses().rareChance + getBossCombatBuffs().rareChance, 0, 0.75);
  }

  function getLegendChance() {
    return clamp(currentZone().legendaryChance + getLevel("golden_lure") * 0.01 + getAllStatBonuses().legendChance + getEcologyModifiers().legendBonus + getGearSkillBonus("legendChance") + getExpeditionBonuses().legendChance + getBossCombatBuffs().legendChance, 0, 0.25);
  }

  function getSaleMultiplier(processed = false) {
    const vendingMult = 1 + getLevel("vending_machine") * 0.05;
    const beaconMult = getLevel("school_beacon") > 0 ? 1.5 : 1;
    const achievementMult = 1 + achievementBonus("gold");
    const processedMult = processed ? 2 + getAllStatBonuses().processPct : 1;
    return vendingMult * beaconMult * achievementMult * processedMult * (1 + getAllStatBonuses().sellPct + getAllStatBonuses().allYieldPct);
  }

  function speciesPrice(speciesId, processed = false, zoneId = state.currentZone) {
    const fish = byId(species, speciesId);
    const zone = getZone(zoneId);
    if (!fish) return 0;
    const rareValue = fish.tier === "rare" ? 1 + getAllStatBonuses().rareValuePct : 1;
    return fish.basePrice * zone.priceMult * getSaleMultiplier(processed) * rareValue;
  }

  function getInventoryEntries() {
    return Object.entries(state.inventory)
      .map(([id, counts]) => ({ fish: byId(species, id), raw: Number(counts.raw || 0), processed: Number(counts.processed || 0) }))
      .filter((entry) => entry.fish && (entry.raw > 0 || entry.processed > 0));
  }

  function inventoryValue() {
    return getInventoryEntries().reduce((sum, entry) => {
      return sum + speciesPrice(entry.fish.id, false) * entry.raw + speciesPrice(entry.fish.id, true) * entry.processed;
    }, 0);
  }

  function rawFishCount() {
    return getInventoryEntries().reduce((sum, entry) => sum + entry.raw, 0);
  }

  function expectedSpeciesValue(zoneId = state.currentZone) {
    const zone = getZone(zoneId);
    const rare = clamp(zone.rareChance + getLevel("sonar") * 0.03 + achievementBonus("rare"), 0, 0.75);
    const legendary = clamp(zone.legendaryChance + getLevel("golden_lure") * 0.01, 0, 0.25);
    const normal = Math.max(0, 1 - rare - legendary);
    return (normal * 1 + rare * RARE_BASE_VALUE + legendary * LEGENDARY_BASE_VALUE) * zone.priceMult;
  }

  function expectedCatchCount() {
    const baseCount = 1.5;
    return baseCount * getCatchMultiplier() * (1 + getDoubleChance());
  }

  function estimatedGoldPerSecond() {
    return getAutoRate() * expectedCatchCount() * expectedSpeciesValue() * getSaleMultiplier(false);
  }

  function formatNumber(value) {
    const number = Number(value) || 0;
    if (Math.abs(number) >= 1e12) return `${(number / 1e12).toFixed(2)}万亿`;
    if (Math.abs(number) >= 1e8) return `${(number / 1e8).toFixed(2)}亿`;
    if (Math.abs(number) >= 1e4) return `${(number / 1e4).toFixed(2)}万`;
    if (Math.abs(number) >= 1000) return Math.round(number).toLocaleString("zh-CN");
    return (Math.round(number * 10) / 10).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
  }

  function formatInteger(value) {
    return Math.floor(Number(value) || 0).toLocaleString("zh-CN");
  }

  function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours > 0) return `${hours}小时${String(minutes).padStart(2, "0")}分`;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function speciesTierName(tier) {
    return tier === "legendary" ? "传说" : tier === "rare" ? "稀有" : "普通";
  }

  function getDiscoveredCount() {
    return Object.keys(state.discovered).length;
  }

  function isNodeMaxed(node) {
    return getLevel(node.id) >= node.max;
  }

  function canUpgrade(node) {
    return prerequisiteMet(node) && !isNodeMaxed(node) && state.gold >= getUpgradeCost(node);
  }

  function getHotspotBonuses(hotspotHit) {
    const strength = clamp(Number(hotspotHit && hotspotHit.strength) || 0, 0, 1);
    if (!hotspotHit || !hotspotHit.spot || strength <= 0) {
      return { amountPct: 0, rareChance: 0, legendChance: 0 };
    }
    const type = hotspotHit.spot.type;
    if (type === "rare") return { amountPct: 0.2 * strength, rareChance: 0.12 * strength, legendChance: 0 };
    if (type === "legendary") return { amountPct: 0.15 * strength, rareChance: 0.08 * strength, legendChance: 0.05 * strength };
    return { amountPct: 0.35 * strength, rareChance: 0, legendChance: 0 };
  }

  function chooseTier(hotspotHit = null) {
    const hotspot = getHotspotBonuses(hotspotHit);
    const ecology = getEcologyModifiers();
    const legendary = clamp(getLegendChance() + hotspot.legendChance, 0, 0.72);
    const rare = clamp(getRareChance() + hotspot.rareChance, 0, 0.68);
    const roll = Math.random() * (legendary + rare + ecology.normalMult);
    if (roll < legendary) return "legendary";
    if (roll < legendary + rare) return "rare";
    return "normal";
  }

  function randomSpeciesForTier(tier) {
    const pool = species.filter((fish) => fish.zone === state.currentZone && fish.tier === tier);
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    const fallback = species.filter((fish) => fish.zone === state.currentZone);
    return fallback[Math.floor(Math.random() * fallback.length)] || species[0];
  }

  function addFishToHold(fish, amount) {
    if (!state.inventory[fish.id]) state.inventory[fish.id] = { raw: 0, processed: 0 };
    state.inventory[fish.id].raw += amount;
    if (!state.discovered[fish.id]) state.discovered[fish.id] = { count: 0, firstAt: Date.now() };
    state.discovered[fish.id].count += amount;
    updateCodexMastery(fish, amount);
  }

  function checkAchievements() {
    const newlyUnlocked = [];
    achievements.forEach((achievement) => {
      if (state.achievements[achievement.id]) return;
      let unlocked = false;
      try { unlocked = achievement.check(state); } catch (error) { unlocked = false; }
      if (unlocked) {
        state.achievements[achievement.id] = Date.now();
        newlyUnlocked.push(achievement);
      }
    });
    newlyUnlocked.forEach((achievement, index) => {
      window.setTimeout(() => showToast(`成就解锁：${achievement.name}`, achievement.reward, "gold"), index * 180);
    });
    return newlyUnlocked;
  }

  function refreshProgressTip() {
    let tip = "先升级阔口渔网，提高每网捕获数量。";
    if (getLevel("wide_net") >= 2 && getLevel("fine_mesh") === 0) tip = "密眼渔网已可升级，降低空网率能稳定收入。";
    if (getLevel("trawler") > 0) tip = "拖网船正在自动捕鱼，注意及时出售或解锁自动售卖机。";
    if (getLevel("processing_workshop") > 0 && rawFishCount() > 0) tip = "当前有未加工渔获；加工后售价翻倍。";
    if (!isZoneUnlocked("reef") && state.gold >= 180) tip = "金币足够时，近海礁区会显著提高渔获价值。";
    if (isZoneUnlocked("abyss")) tip = "远洋深渊已开放，黄金鱼诱与鱼群信标可继续放大收益。";
    dom.progressTip.textContent = tip;
  }

  function showToast(title, message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = type === "error" ? "!" : type === "gold" ? "◆" : type === "success" ? "✓" : "i";
    const copy = document.createElement("span");
    const heading = document.createElement("strong");
    heading.textContent = title;
    const detail = document.createElement("small");
    detail.textContent = message || "";
    copy.append(heading, detail);
    toast.append(icon, copy);
    dom.toastRoot.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("hide");
      window.setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function showCatchPop(text, tier = "normal", auto = false) {
    const pop = document.createElement("div");
    pop.className = `catch-pop ${tier === "legendary" ? "legendary" : tier === "rare" ? "rare" : ""} ${tier === "empty" ? "empty" : ""}${auto ? " auto" : ""}`;
    pop.textContent = text;
    pop.style.setProperty("--left", `${fxBetween(38, 62).toFixed(1)}%`);
    pop.style.setProperty("--top", `${fxBetween(48, 68).toFixed(1)}%`);
    pop.style.setProperty("--rise", `${fxBetween(-74, -54).toFixed(0)}px`);
    dom.catchLayer.appendChild(pop);
    window.setTimeout(() => pop.remove(), 1500);
  }

  function showCastAnimation(fullScreen = false) {
    const rect = dom.seaPanel.getBoundingClientRect();
    if (pointerOrigin && rect.width && rect.height) {
      const x = clamp(((pointerOrigin.x - rect.left) / rect.width) * 100, 8, 92);
      const y = clamp(((pointerOrigin.y - rect.top) / rect.height) * 100, 34, 88);
      dom.seaPanel.style.setProperty("--cast-x", `${x.toFixed(1)}%`);
      dom.seaPanel.style.setProperty("--cast-y", `${y.toFixed(1)}%`);
    } else {
      dom.seaPanel.style.setProperty("--cast-x", "50%");
      dom.seaPanel.style.setProperty("--cast-y", "58%");
    }
    dom.seaPanel.classList.remove("net-active", "full-net");
    void dom.seaPanel.offsetWidth;
    if (fullScreen) dom.seaPanel.classList.add("full-net");
    dom.seaPanel.classList.add("net-active");
    emitTide("tide:cast", { origin: pointerOrigin, fullScreen });
    window.setTimeout(() => dom.seaPanel.classList.remove("net-active", "full-net"), 1120);
  }

  function showAutoCastAnimation() {
    dom.seaPanel.classList.remove("auto-cast");
    void dom.seaPanel.offsetWidth;
    dom.seaPanel.classList.add("auto-cast");
    window.setTimeout(() => dom.seaPanel.classList.remove("auto-cast"), 760);
  }

  function ensureAutoSellSpace() {
    if (getHoldCount() < getCapacity()) return true;
    if (getLevel("vending_machine") > 0) {
      sellAll(true);
      return true;
    }
    return false;
  }

  function performCast(source = "manual") {
    if (source === "manual") {
      const now = Date.now();
      const manualCooldown = MANUAL_COOLDOWN * (getGearSkillBonus("castCooldownMult", 1) || 1);
      if (now - lastManualCast < manualCooldown) return 0;
      lastManualCast = now;
      showCastAnimation(getLevel("sky_net") > 0);
    } else if (getAutoRate() > 0) {
      showAutoCastAnimation();
    }

    state.totalCasts += 1;
    if (source === "manual" && dom.lastCastText) dom.lastCastText.textContent = "撒网中…";
    recordContract("casts", 1);
    const hotspotHit = findHotspotForCast(source);
    const hotspot = hotspotHit && hotspotHit.spot;

    if (getHoldCount() >= getCapacity() && !ensureAutoSellSpace()) {
      if (source === "manual") showCatchPop("鱼舱已满", "empty");
      return 0;
    }

    if (Math.random() < getEmptyChance()) {
      if (source === "manual") {
        bumpVisualCombo(false);
        showCatchPop(hotspot ? "声呐热点内空网" : "空网 · 再试一次", "empty");
        if (dom.lastCastText) dom.lastCastText.textContent = "空网 · 调整落点";
        window.setTimeout(() => {
          triggerNetImpact(true);
          emitSplash(12, true);
          dom.seaPanel.classList.add("empty-shake");
          window.setTimeout(() => dom.seaPanel.classList.remove("empty-shake"), 520);
        }, 310);
      }
      updateDynamicUI();
      return 0;
    }

    const hotspotBonus = getHotspotBonuses(hotspotHit);
    let amount = Math.max(1, Math.round((1 + Math.random()) * getCatchMultiplier() * (1 + hotspotBonus.amountPct)));
    const doubleTriggered = Math.random() < getDoubleChance() || (source === "auto" && Math.random() < getAllStatBonuses().autoDouble);
    if (doubleTriggered) amount *= 2;

    let caught = 0;
    let hasRare = false;
    let hasLegendary = false;
    const caughtSpecies = [];
    for (let i = 0; i < amount; i += 1) {
      if (!ensureAutoSellSpace()) break;
      const tier = chooseTier(hotspotHit);
      const fish = randomSpeciesForTier(tier);
      addFishToHold(fish, 1);
      caughtSpecies.push(fish);
      caught += 1;
      state.totalFish += 1;
      if (tier === "rare") { state.rareCaught += 1; hasRare = true; }
      if (tier === "legendary") { state.legendaryCaught += 1; hasLegendary = true; }
    }

    if (source === "manual" && dom.lastCastText) dom.lastCastText.textContent = `上一网 +${caught} 条`;
    const hold = getHoldCount();
    if (hold >= getCapacity()) state.everFull = true;
    const latestFish = caughtSpecies[caughtSpecies.length - 1];
    const popTier = latestFish && latestFish.tier === "legendary" ? "legendary" : latestFish && latestFish.tier === "rare" ? "rare" : "normal";
    const sonarPrefix = hotspot ? (hotspot.type === "legendary" ? "传说回响 · " : hotspot.type === "rare" ? "稀有鱼群 · " : "声呐锁定 · ") : "";
    if (source === "manual") {
      showCatchPop(`${sonarPrefix}+${caught} 条渔获`, popTier, false);
    } else if (hotspot || popTier !== "normal") {
      showCatchPop(`自动捕获 · ${sonarPrefix}${popTier === "legendary" ? "传说鱼" : popTier === "rare" ? "稀有鱼" : "鱼群"}`, popTier, true);
    }

    if (hotspot && caught > 0) {
      recordContract("hotspot", 1);
      state.sonar.history = [...(state.sonar.history || []), { type: hotspot.type, at: Date.now(), count: caught }].slice(-50);
      emitTide("tide:sonar-hit", { hotspot: { id: hotspot.id, type: hotspot.type, x: hotspot.x, y: hotspot.y }, source });
    }
    if (caught > 0) {
      recordContract("fish", caught);
      updateZoneProgress(caught);
      const ecology = state.ecology[state.currentZone];
      if (ecology && (hasRare || hasLegendary)) ecology.predatorPressure = clamp(ecology.predatorPressure - (hasLegendary ? 0.035 : 0.012) * caught, 0.02, 0.58);
      const expeditionWeight = (source === "auto" ? 0.45 : 1) + (hotspot ? 0.35 : 0) + (hasRare ? 0.2 : 0) + (hasLegendary ? 0.35 : 0);
      advanceExpedition(expeditionWeight, { source, hotspot: Boolean(hotspot), hasRare, hasLegendary });
      advanceBossProgress(hotspotHit, source, castPointPercent(), { hasRare, hasLegendary, caught });
    }

    window.setTimeout(() => {
      triggerNetImpact(false);
      if (!doubleTriggered && !hasRare && !hasLegendary) triggerImpact("normal", pointerOrigin);
      emitSplash(source === "manual" ? 16 : 7, false);
      flyFishToHold(caught, popTier, caughtSpecies);
    }, source === "manual" ? 315 : 180);

    if (doubleTriggered) {
      window.setTimeout(() => triggerImpact("crit", pointerOrigin), source === "manual" ? 430 : 260);
    }
    if (hasLegendary || hasRare) {
      window.setTimeout(() => triggerImpact(hasLegendary ? "legendary" : "rare", pointerOrigin), source === "manual" ? 520 : 330);
    }

    emitTide("tide:catch", { species: caughtSpecies.map((fish) => fish.id), count: caught, tier: popTier, hotspot: hotspot ? { id: hotspot.id, type: hotspot.type } : null });
    rollEquipmentDrop(popTier);
    if (source === "manual") bumpVisualCombo(caught > 0);
    checkAchievements();
    updateDynamicUI();
    if (activeModal && activeModal.type === "encyclopedia") renderModal();
    return amount;
  }

  function sellAll(auto = false) {
    const entries = getInventoryEntries();
    const count = entries.reduce((sum, entry) => sum + entry.raw + entry.processed, 0);
    if (!count) {
      if (!auto) showToast("鱼舱为空", "先去海面撒网捕获渔获。", "error");
      return 0;
    }

    const value = roundOne(inventoryValue());
    emitTide("tide:sell", { value, count, auto });
    state.gold += value;
    state.totalGoldEarned += value;
    state.totalSold += count;
    recordContract("sell", value);
    state.inventory = {};
    checkAchievements();

    if (auto) {
      const now = Date.now();
      if (now - lastAutoSellToast > 3000) {
        showToast("自动售卖机已结账", `售出 ${formatInteger(count)} 条鱼，获得 ${formatNumber(value)} 金币。`, "gold");
        lastAutoSellToast = now;
      }
    } else {
      showToast("渔获已出售", `售出 ${formatInteger(count)} 条鱼，获得 ${formatNumber(value)} 金币。`, "gold");
      showCatchPop(`+${formatNumber(value)} 金币`, "legendary", false);
    }
    showFloatingText(`+${formatNumber(value)}`, "gold", auto ? dom.holdStat : dom.sellButton, -18);
    if (!auto) flyCoinsToGold(count);

    updateAllUI();
    return value;
  }

  function processFish() {
    const level = getLevel("processing_workshop");
    if (level <= 0) {
      showToast("尚未解锁加工", "升级渔获加工坊后即可加工。", "error");
      return;
    }

    let quota = level * 5;
    let moved = 0;
    getInventoryEntries().some((entry) => {
      const item = state.inventory[entry.fish.id];
      const take = Math.min(item.raw, quota);
      item.raw -= take;
      item.processed += take;
      moved += take;
      quota -= take;
      if (quota <= 0) return true;
      return false;
    });

    if (moved <= 0) {
      showToast("没有可加工渔获", "鱼舱内的生鲜渔获已经加工完毕。", "error");
      return;
    }

    recordContract("process", moved);
    showToast("加工完成", `加工 ${formatInteger(moved)} 条鱼，出售时售价 ×2。`, "success");
    showFloatingText(`加工 +${formatInteger(moved)}`, "process", dom.processButton, -12);
    updateAllUI();
  }

  function roundOne(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function buyUpgrade(id) {
    const node = getNode(id);
    if (!node) return;
    if (!prerequisiteMet(node)) {
      showToast("前置条件未满足", prerequisiteText(node), "error");
      return;
    }
    if (isNodeMaxed(node)) {
      showToast("已达到最高等级", `${node.name} 已完全升级。`, "error");
      return;
    }
    const cost = getUpgradeCost(node);
    if (state.gold < cost) {
      showToast("金币不足", `还需要 ${formatNumber(cost - state.gold)} 金币。`, "error");
      return;
    }

    state.gold -= cost;
    state.upgrades[node.id] = getLevel(node.id) + 1;
    emitTide("tide:upgrade", { id: node.id, level: state.upgrades[node.id] });
    checkAchievements();
    showToast(`${node.name} 升级成功`, `当前等级 Lv.${state.upgrades[node.id]} / ${node.max}`, "success");
    const isUltimate = Boolean(node.ultimate) && state.upgrades[node.id] === 1;
    if (node.id === "sky_net") showCastAnimation(true);
    updateAllUI();
    animateUpgradeNode(node.id, isUltimate);
  }

  function startZoneScanTransition() {
    window.clearTimeout(zoneScanTimer);
    dom.app.classList.remove("zone-scan");
    void dom.app.offsetWidth;
    dom.app.classList.add("zone-scan");
    zoneScanTimer = window.setTimeout(() => dom.app.classList.remove("zone-scan"), 920);
  }

  function switchZone(id) {
    const zone = getZone(id);
    if (isZoneUnlocked(id)) {
      state.currentZone = id;
    startZoneScanTransition();
      emitTide("tide:zone", { zone: id });
      state.sonar.hotspots = [];
      state.sonar.nextSpawnAt = 0;
      spawnSonarHotspots();
    updateEcology(0);
    renderGearSkillHud();
      showToast(`已抵达${zone.name}`, `鱼价倍率 ×${zone.priceMult}。`, "info");
      updateAllUI();
      renderZoneTabs();
      renderSonarHotspots();
      renderBossHud();
      refreshFishDecorColors();
      saveGame(true);
      return;
    }
    const cost = getZoneCost(zone);
    if (state.gold < cost) {
      showToast("海域尚未解锁", `解锁需要 ${formatNumber(cost)} 金币，目前还差 ${formatNumber(cost - state.gold)}。`, "error");
      return;
    }
    openModal("zone", { zoneId: id });
  }

  function unlockZone(id) {
    const zone = getZone(id);
    if (isZoneUnlocked(id)) return;
    const cost = getZoneCost(zone);
    if (!hasZoneRequirements(zone)) {
      showToast("海域权限不足", zoneRequirementText(zone), "error");
      return;
    }
    if (state.gold < cost) {
      showToast("金币不足", `还需要 ${formatNumber(cost - state.gold)} 金币。`, "error");
      return;
    }
    state.gold -= cost;
    state.unlockedZones.push(id);
    state.ascension.bestZone = id;
    state.currentZone = id;
    startZoneScanTransition();
    emitTide("tide:zone", { zone: id });
    state.sonar.hotspots = [];
    state.sonar.nextSpawnAt = 0;
    spawnSonarHotspots();
    updateEcology(0);
    renderGearSkillHud();
    checkAchievements();
    closeModal();
    showToast(`${zone.name}已解锁`, "新海域拥有更高鱼价与更稀有的鱼种。", "gold");
    updateAllUI();
    renderZoneTabs();
    refreshFishDecorColors();
    saveGame(true);
  }

  function triggerRandomEvent() {
    const now = Date.now();
    const isMigration = Math.random() < 0.58;

    if (isMigration) {
      state.activeEvent = {
        type: "migration",
        title: "鱼群洄游",
        until: now + MIGRATION_DURATION,
        multiplier: 2
      };
      state.nextEventAt = state.activeEvent.until + randomEventDelay();
      showToast("随机事件：鱼群洄游", "未来 60 秒内，所有撒网捕获数量翻倍。", "gold");
      showEventBanner("鱼群洄游", "捕获数量 ×2 · 持续 60 秒", "migration", 4200);
      glowEdge("cyan");
    } else {
      const reward = Math.max(45, Math.floor(estimatedGoldPerSecond() * 45 + currentZone().priceMult * 22));
      state.gold += reward;
      state.totalGoldEarned += reward;
      state.activeEvent = null;
      state.nextEventAt = now + randomEventDelay();
      showToast("随机事件：漂流宝箱", `从海面捞起一只宝箱，获得 ${formatNumber(reward)} 金币。`, "gold");
      rollEquipmentDrop("chest", true);
      showFloatingText(`宝箱 +${formatNumber(reward)}`, "gold", dom.goldStat, -20);
      showEventBanner("漂流宝箱", `获得 ${formatNumber(reward)} 金币`, "gold", 3400);
      glowEdge("gold");
      checkAchievements();
    }
    updateAllUI();
    saveGame(true);
  }

  function updateRandomEvent(now) {
    if (state.activeEvent && state.activeEvent.until <= now) {
      state.activeEvent = null;
      showToast("鱼群洄游结束", "海面恢复常态，等待下一次随机事件。", "info");
      showEventBanner("鱼群散去", "海面恢复平静", "migration", 2200);
    }
    if (!state.nextEventAt) state.nextEventAt = now + randomEventDelay();
    if (now >= state.nextEventAt) triggerRandomEvent();
  }

  function saveGame(silent = false) {
    try {
      state.lastSaved = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!silent) {
        dom.saveText.textContent = "刚刚已自动存档";
        window.clearTimeout(saveFlashTimer);
        saveFlashTimer = window.setTimeout(() => {
          dom.saveText.textContent = "自动存档已开启";
        }, 1400);
      }
    } catch (error) {
      dom.saveText.textContent = "存档写入失败";
    }
  }

  function loadGame() {
    const base = createDefaultState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      state = {
        ...base,
        ...saved,
        upgrades: { ...base.upgrades, ...(saved.upgrades || {}) },
        inventory: saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {},
        discovered: saved.discovered && typeof saved.discovered === "object" ? saved.discovered : {},
        achievements: saved.achievements && typeof saved.achievements === "object" ? saved.achievements : {},
        unlockedZones: Array.isArray(saved.unlockedZones) && saved.unlockedZones.length ? saved.unlockedZones : ["shallow"]
      };

      state.version = 7;
      state.ascension = {
        ...base.ascension,
        ...(saved.ascension || {}),
        research: { ...base.ascension.research, ...((saved.ascension || {}).research || {}) },
        protocols: { ...base.ascension.protocols, ...((saved.ascension || {}).protocols || {}) },
        bossTrophies: { ...base.ascension.bossTrophies, ...((saved.ascension || {}).bossTrophies || {}) },
        totalBossDefeated: Number((saved.ascension || {}).totalBossDefeated) || 0
      };
      state.equipment = {
        ...base.equipment,
        ...(saved.equipment || {}),
        equipped: { ...base.equipment.equipped, ...((saved.equipment || {}).equipped || {}) },
        owned: (saved.equipment || {}).owned || {},
        lockedSlots: (saved.equipment || {}).lockedSlots || {},
        skillLoadout: Array.isArray((saved.equipment || {}).skillLoadout) ? saved.equipment.skillLoadout : [],
        skillMode: (saved.equipment || {}).skillMode === "manual" ? "manual" : "auto",
        discovered: (saved.equipment || {}).discovered || {}
      };
      Object.entries(state.equipment.owned).forEach(([id, item]) => {
        if (!item || typeof item !== "object") return;
        if (!item.slot) item.slot = id.split(":")[1] || "net";
        if (!item.archetype) item.archetype = (EQUIPMENT_ARCHETYPES[item.slot] || [{}])[0].id || "legacy";
        if (!item.set || !EQUIPMENT_SETS[item.set]) item.set = "tide";
        item.level = Math.min(10, Number(item.level) || 1);
      });
      state.sonar = { ...base.sonar, ...(saved.sonar || {}), hotspots: Array.isArray((saved.sonar || {}).hotspots) ? saved.sonar.hotspots : [], history: Array.isArray((saved.sonar || {}).history) ? saved.sonar.history : [] };
      const savedExpedition = saved.expedition && typeof saved.expedition === "object" ? saved.expedition : {};
      state.expedition = {
        ...base.expedition,
        ...savedExpedition,
        active: savedExpedition.active && typeof savedExpedition.active === "object" ? {
          ...savedExpedition.active,
          progress: Number(savedExpedition.active.progress) || 0,
          requiredCasts: Number(savedExpedition.active.requiredCasts) || 1,
          thresholds: Array.isArray(savedExpedition.active.thresholds) ? savedExpedition.active.thresholds.map(Number) : [],
          nodeIndex: Number(savedExpedition.active.nodeIndex) || 0,
          pendingNode: savedExpedition.active.pendingNode || null,
          bonuses: { goldPct: 0, alloy: 0, crystals: 0, catchPct: 0, rareChance: 0, legendChance: 0, bossProgressPct: 0, ...(savedExpedition.active.bonuses || {}) },
          stats: { casts: 0, manual: 0, auto: 0, hotspots: 0, rare: 0, legendary: 0, ...(savedExpedition.active.stats || {}) }
        } : null,
        log: Array.isArray(savedExpedition.log) ? savedExpedition.log.slice(-12) : [],
        completed: Number(savedExpedition.completed) || 0,
        bestScore: Number(savedExpedition.bestScore) || 0,
        masteryXp: Number(savedExpedition.masteryXp) || 0,
        masteryLevel: Math.min(20, Math.max(0, Number(savedExpedition.masteryLevel) || 0)),
        crewMode: EXPEDITION_CREW_MODES[savedExpedition.crewMode] ? savedExpedition.crewMode : "balanced"
      };
      state.ecology = Object.fromEntries(zones.map((zone) => {
        const source = { ...(base.ecology[zone.id] || {}), ...((saved.ecology || {})[zone.id] || {}) };
        return [zone.id, {
          preyDensity: Number(source.preyDensity) || 1,
          predatorPressure: Number(source.predatorPressure) || 0.05,
          schoolMorale: Number(source.schoolMorale) || 0.92,
          predatorCount: Number(source.predatorCount) || 0,
          lastUpdatedAt: Number(source.lastUpdatedAt) || Date.now()
        }];
      }));
      state.codexMastery = saved.codexMastery && typeof saved.codexMastery === "object" ? saved.codexMastery : {};
      Object.values(state.codexMastery).forEach((record) => {
        if (!record || typeof record !== "object") return;
        record.count = Number(record.count) || 0;
        record.stars = Number(record.stars) || (record.count >= 10000 ? 3 : record.count >= 1000 ? 2 : record.count >= 100 ? 1 : 0);
      });
      state.contracts = { ...base.contracts, ...(saved.contracts || {}), tasks: Array.isArray((saved.contracts || {}).tasks) ? saved.contracts.tasks : [], progress: (saved.contracts || {}).progress || {}, claimed: (saved.contracts || {}).claimed || {} };
      state.zoneProgress = Object.fromEntries(zones.map((zone) => {
        const source = { ...base.zoneProgress[zone.id], ...((saved.zoneProgress || {})[zone.id] || {}) };
        return [zone.id, { caught: Number(source.caught) || 0, bossCharge: Number(source.bossCharge) || 0, bossDefeated: Number(source.bossDefeated) || 0, mastery: Number(source.mastery) || 0 }];
      }));
      state.bossMaterials = { ...base.bossMaterials, ...(saved.bossMaterials || {}) };
      state.bossRecords = saved.bossRecords && typeof saved.bossRecords === "object" ? saved.bossRecords : {};
      state.boss = saved.boss && typeof saved.boss === "object" ? {
        ...saved.boss,
        phase: Number(saved.boss.phase) || 1,
        phaseProgress: Number(saved.boss.phaseProgress) || 0,
        finisher: Number(saved.boss.finisher) || 0,
        finisherMisses: Number(saved.boss.finisherMisses) || 0,
        perfectFinishers: Number(saved.boss.perfectFinishers) || 0,
        windowPerfect: saved.boss.windowPerfect !== false,
        windowAttempted: Boolean(saved.boss.windowAttempted),
        brokenParts: Array.isArray(saved.boss.brokenParts) ? saved.boss.brokenParts : [],
        phaseBuff: saved.boss.phaseBuff || null,
        weakpointId: saved.boss.weakpointId || null,
        hotspotId: saved.boss.hotspotId || null,
        locks: Number(saved.boss.locks) || 0,
        target: Number(saved.boss.target) || 5,
        expiresAt: Number(saved.boss.expiresAt) || 0
      } : null;
      state.ui = { ...base.ui, ...(saved.ui || {}) };
      state.profile = saved.profile && typeof saved.profile === "object" ? saved.profile : (window.LeaderboardBridge?.getProfile?.() || null);
      state.profileSetupSeen = Boolean(saved.profileSetupSeen);
      state.leaderboard = { ...base.leaderboard, ...(saved.leaderboard || {}), cache: (saved.leaderboard || {}).cache || {} };
      state.audioMuted = Boolean(state.audioMuted);
      state.sonar.nextSpawnAt = Number(state.sonar.nextSpawnAt) || 0;
      state.equipment.rarePity = Number(state.equipment.rarePity) || 0;
      state.gold = Number(state.gold) || 0;
      state.totalCasts = Number(state.totalCasts) || 0;
      state.totalFish = Number(state.totalFish) || 0;
      state.totalSold = Number(state.totalSold) || 0;
      state.totalGoldEarned = Number(state.totalGoldEarned) || 0;
      state.rareCaught = Number(state.rareCaught) || 0;
      state.legendaryCaught = Number(state.legendaryCaught) || 0;
      if (!zones.some((zone) => zone.id === state.currentZone) || !state.unlockedZones.includes(state.currentZone)) {
        state.currentZone = "shallow";
      }
      if (!state.unlockedZones.includes("shallow")) state.unlockedZones.unshift("shallow");

      const lastSaved = Number(saved.lastSaved) || Date.now();
      const elapsed = Math.max(0, (Date.now() - lastSaved) / 1000);
      if (!state.pendingOffline && elapsed >= OFFLINE_MIN_SECONDS) {
        const capHours = (getLevel("ocean_fleet") > 0 ? 12 : 8) + getAllStatBonuses().offlineHours;
        const cappedSeconds = Math.min(elapsed, capHours * 3600);
        const amount = Math.floor(estimatedGoldPerSecond() * cappedSeconds);
        if (amount >= 1) {
          state.pendingOffline = { amount, elapsedSeconds: elapsed, cappedSeconds, capHours };
        }
      }

      if (!state.nextEventAt || state.nextEventAt < Date.now() - 60000) {
        state.nextEventAt = Date.now() + randomEventDelay();
      }
      state.lastSaved = Date.now();
    } catch (error) {
      state = base;
    }
  }

  function fishArtMarkup(fish, className = "") {
    return `<span class="fish-art ${className}"><img src="${fish.image}" alt="" loading="eager" decoding="async"><span class="fish-sheen"></span><span class="fish-pattern pattern-${fish.pattern || "none"}"></span></span>`;
  }

  function bindFishImage(element) {
    const image = element.querySelector("img");
    if (!image) return;
    const loaded = () => {
      element.classList.add("has-image");
      element.classList.remove("asset-failed");
    };
    const failed = () => {
      element.classList.remove("has-image");
      element.classList.add("asset-failed");
    };
    image.addEventListener("load", loaded, { once: true });
    image.addEventListener("error", failed, { once: true });
    if (image.complete) (image.naturalWidth ? loaded : failed)();
  }

  function initSceneDecor() {
    const bubbleCount = 24;
    let bubbles = "";
    for (let i = 0; i < bubbleCount; i += 1) {
      const size = Math.round(fxBetween(3, 12));
      bubbles += `<i class="bubble" style="--size:${size}px;--duration:${fxBetween(5, 13).toFixed(1)}s;--delay:${(-fxRandom() * 12).toFixed(1)}s;--drift:${fxBetween(-28, 28).toFixed(0)}px;left:${fxBetween(2, 98).toFixed(1)}%"></i>`;
    }
    dom.bubbleField.innerHTML = bubbles;

    let fish = "";
    for (let i = 0; i < 12; i += 1) {
      const length = Math.round(fxBetween(34, 78));
      fish += `<i class="fish-deco ${i % 3 === 0 ? "reverse" : ""}" data-fish-deco data-species="" style="--length:${length}px;--top:${fxBetween(8, 86).toFixed(1)}%;--swim-y:${fxBetween(-12, 12).toFixed(1)}px;--duration:${fxBetween(12, 24).toFixed(1)}s;--delay:${(-fxRandom() * 22).toFixed(1)}s;--opacity:${fxBetween(0.48, 0.82).toFixed(2)}"></i>`;
    }
    dom.fishField.innerHTML = fish;
    refreshFishDecorColors();
  }

  function refreshFishDecorColors() {
    const zoneSpecies = species.filter((fish) => fish.zone === state.currentZone);
    dom.fishField.querySelectorAll("[data-fish-deco]").forEach((element, index) => {
      const fish = zoneSpecies[index % zoneSpecies.length] || species[0];
      element.dataset.species = fish.id;
      element.classList.toggle("detail", Boolean(fish.detail));
      element.classList.toggle("reverse", fish.flip || index % 3 === 0);
      element.style.setProperty("--fish-color", fish.color);
      element.style.setProperty("--fish-accent", fish.accent || "#ffffff");
      element.style.setProperty("--image-scale", fish.imageScale || 1);
      element.style.setProperty("--fish-stretch", fish.stretch || 1);
      element.style.setProperty("--fish-hue", `${fish.hue || 0}deg`);
      element.style.color = fish.color;
      element.innerHTML = fishArtMarkup(fish);
      bindFishImage(element);
    });
  }
  function updateEventCard(now = Date.now()) {
    if (state.activeEvent && state.activeEvent.until > now) {
      dom.eventCard.classList.add("active");
      dom.eventIcon.textContent = "≋";
      dom.eventTitle.textContent = state.activeEvent.title;
      dom.eventText.textContent = "当前所有撒网捕获数量 ×2，抓紧时间。";
      dom.eventTimer.textContent = `剩余 ${formatDuration((state.activeEvent.until - now) / 1000)}`;
      return;
    }
    dom.eventCard.classList.remove("active");
    dom.eventIcon.textContent = "≈";
    dom.eventTitle.textContent = "风平浪静";
    dom.eventText.textContent = "下一次随机事件即将到来。";
    dom.eventTimer.textContent = `下次事件 ${formatDuration((state.nextEventAt - now) / 1000)}`;
  }

  function updateControlButtons() {
    const value = inventoryValue();
    const count = getHoldCount();
    dom.sellButton.disabled = count <= 0;
    dom.sellValueText.textContent = `+${formatNumber(value)} 金币`;

    const level = getLevel("processing_workshop");
    const raw = rawFishCount();
    dom.processButton.disabled = level <= 0 || raw <= 0;
    if (level <= 0) {
      dom.processText.textContent = "尚未解锁";
      dom.processChip.textContent = "×2";
    } else {
      dom.processText.textContent = `可加工 ${Math.min(level * 5, raw)} / ${raw} 条`;
      dom.processChip.textContent = `Lv.${level}`;
    }
  }

  function updateHUD() {
    dom.app.dataset.zone = state.currentZone;
    const capacity = getCapacity();
    const hold = getHoldCount();
    window.TideGameState = { zone: state.currentZone, gold: state.gold, hold, capacity, speciesCount: species.length, nodeCount: allNodes.length, zoneCount: zones.length, equipmentSlots: Object.keys(EQUIPMENT_SLOTS).length, captainScore: getCaptainScore(), ...getLeaderboardSnapshot() };
    const densityTarget = window.innerWidth <= 760 ? 36 : 64;
    if (densityTarget !== lastFishDensityTarget) { lastFishDensityTarget = densityTarget; emitTide("tide:fish-density", { count: densityTarget }); }
    const income = estimatedGoldPerSecond();
    const zone = currentZone();
    const multiplier = getCatchMultiplier();
    const low = Math.max(1, Math.round(multiplier));
    const high = Math.max(low, Math.round(multiplier * 2 * (1 + getDoubleChance())));

    const goldMoved = lastRenderedGold !== null && Math.abs(state.gold - lastRenderedGold) > 0.001;
    const holdMoved = lastRenderedHold !== null && hold !== lastRenderedHold;
    dom.goldText.textContent = formatNumber(state.gold);
    dom.holdText.textContent = `${formatNumber(hold)} / ${formatNumber(capacity)}`;
    if (goldMoved) animateStatValue(dom.goldText, state.gold > lastRenderedGold ? "increase" : "decrease");
    if (holdMoved) animateStatValue(dom.holdText, hold > lastRenderedHold ? "increase" : "decrease");
    lastRenderedGold = state.gold;
    lastRenderedHold = hold;
    dom.incomeText.textContent = getAutoRate() > 0 ? `${formatNumber(income)} / 秒` : "需拖网船";
    dom.zoneName.textContent = zone.name;
    const expedition = state.expedition?.active;
    const expeditionRoute = expedition ? getExpeditionRoute(expedition.routeId) : null;
    const expeditionRatio = getExpeditionProgressRatio(expedition);
    if (expedition) {
      dom.castPrompt.textContent = expedition.pendingNode ? "航线节点待处理" : expedition.expired ? "航线抵达 · 等待返航" : `航行中 · ${expeditionRoute.name}`;
      dom.castEstimate.textContent = expedition.pendingNode ? `节点：${expedition.pendingNode.title} · ${Math.round(expeditionRatio * 100)}%` : `航程 ${Math.round(expeditionRatio * 100)}% · ${formatDuration(getExpeditionTimeRemaining(expedition))}`;
      dom.seaTip.textContent = expedition.pendingNode ? "打开深渊航线完成节点选择，剩余航程会暂停推进。" : "在声呐热点内落网，航线进度与奖励会更快累积。";
    } else {
      dom.castPrompt.textContent = getLevel("sky_net") > 0 ? "天罗地网 · 全屏撒网" : "点击海面撒网";
      dom.castEstimate.textContent = `每网约 ${low}–${high} 条鱼`;
      dom.seaTip.textContent = "每次撒网都会将鱼存入鱼舱，售出后可升级舰载协议。";
    }
    dom.emptyRateText.textContent = `${Math.round(getEmptyChance() * 100)}%`;
    dom.rareRateText.textContent = `+${Math.round(getRareChance() * 100)}%`;
    dom.doubleRateText.textContent = `${Math.round(getDoubleChance() * 100)}%`;
    dom.autoRateText.textContent = getAutoRate() > 0 ? `${getAutoRate().toFixed(2)} 次/秒` : "未解锁";
    dom.catchMultiplierText.textContent = `×${multiplier.toFixed(2)}`;
    dom.saleMultiplierText.textContent = `×${getSaleMultiplier(false).toFixed(2)}`;
    dom.speciesText.textContent = `${getDiscoveredCount()} / ${species.length}`;
    dom.capacityFill.style.width = `${clamp(capacity ? (hold / capacity) * 100 : 0, 0, 100)}%`;
    dom.drawerGoldText.textContent = formatNumber(state.gold);
    dom.dockZoneProgress.textContent = `海域 ${state.unlockedZones.length} / ${zones.length}`;
    const holdRatio = capacity ? hold / capacity : 0;
    dom.holdStat.classList.toggle("hold-warning", holdRatio >= 0.8 && holdRatio < 1);
    dom.holdStat.classList.toggle("hold-full", holdRatio >= 1);
    dom.achievementCount.textContent = `${Object.keys(state.achievements).length}/${achievements.length}`;
    dom.speciesDockCount.textContent = `${getDiscoveredCount()}/${species.length}`;
    const contractReady = state.contracts.tasks.some((task) => (state.contracts.progress[task.id] || 0) >= task.target && !state.contracts.claimed[task.id]);
    dom.contractsButton.classList.toggle("has-reward", contractReady);
    dom.bossButton.classList.toggle("has-encounter", Boolean(state.boss && state.boss.zone === state.currentZone));
    if (dom.expeditionButton && dom.expeditionStatus) {
      const expeditionAlert = Boolean(expedition?.pendingNode || expedition?.expired);
      dom.expeditionStatus.textContent = expedition ? (expedition.pendingNode ? "节点待命" : expedition.expired ? "可返航" : `${Math.round(expeditionRatio * 100)}%`) : "待部署";
      dom.expeditionButton.classList.toggle("has-reward", expeditionAlert);
    }
    refreshProgressTip();
  }

  function renderZoneTabs() {
    dom.zoneTabs.innerHTML = zones.map((zone) => {
      const unlocked = isZoneUnlocked(zone.id);
      const active = state.currentZone === zone.id;
      const gate = hasZoneRequirements(zone);
      const label = unlocked ? zone.subtitle : gate ? `${formatNumber(getZoneCost(zone))} 金币` : "权限不足";
      return `
        <button class="zone-tab ${active ? "active" : ""} ${unlocked ? "" : "locked"} ${gate ? "" : "gated"}" type="button" data-zone-switch="${zone.id}" title="${unlocked ? `切换到${zone.name}` : gate ? `解锁${zone.name}` : zoneRequirementText(zone)}">
          <small>${label}</small>
          <strong>${zone.name}</strong>
        </button>`;
    }).join("");
  }

  let treeTooltipTimer = null;
  let treeRedrawFrame = null;

  function drawTreeConnections() {
    window.cancelAnimationFrame(treeRedrawFrame);
    treeRedrawFrame = window.requestAnimationFrame(() => {
      const tree = dom.upgradeTree;
      const svg = tree.querySelector(".tree-connectors");
      if (!svg) return;
      const treeRect = tree.getBoundingClientRect();
      const width = Math.max(tree.scrollWidth, tree.clientWidth);
      const height = Math.max(tree.scrollHeight, tree.clientHeight);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.innerHTML = "";
      const links = [];
      allNodes.forEach((node) => {
        getPrerequisites(node).forEach((requirement) => {
          const source = tree.querySelector(`[data-upgrade="${requirement.id}"]`);
          const target = tree.querySelector(`[data-upgrade="${node.id}"]`);
          if (!source || !target) return;
          const a = source.getBoundingClientRect();
          const b = target.getBoundingClientRect();
          const x1 = a.left - treeRect.left + tree.scrollLeft + a.width / 2;
          const y1 = a.top - treeRect.top + tree.scrollTop + a.height / 2;
          const x2 = b.left - treeRect.left + tree.scrollLeft + b.width / 2;
          const y2 = b.top - treeRect.top + tree.scrollTop + b.height / 2;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const bend = Math.max(28, Math.abs(x2 - x1) * 0.42);
          path.setAttribute("d", `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`);
          path.classList.add("tree-link");
          if (prerequisiteMet(node)) path.classList.add("unlocked");
          if (getLevel(node.id) > 0) path.classList.add("active");
          svg.appendChild(path);
          links.push(path);
        });
      });
      tree.dataset.linkCount = String(links.length);
    });
  }

  function renderUpgradeTree() {
    const groups = {
      net_mastery: ["基础网具","网眼控制","强化收网","合金系统","深渊导航","终极捕捞","虚空网舱","虚空驱动"],
      automation: ["基础船队","冷藏物流","自动贸易","航线 AI","无人军团","终极舰队","舰队智能","奇点船坞"],
      detection: ["基础声呐","加工科技","稀有探测","鱼群同步","异常预测","终极图鉴","生态雷达","巨兽回声"],
      fleet_synergy: ["装备接口","技能电容","无人机瞄准","超频核心","深潜船坞","旗舰核心","量子货舱","奇点舰队"],
      leviathan: ["声呐档案","阶段破译","巨兽装甲","顶级声呐","巨兽诱饵","首领保底","深渊情报","巨兽精通"]
    };
    const expandedBranch = branches.some((branch) => branch.id === state.ui.expandedBranch) ? state.ui.expandedBranch : "net_mastery";
    const expandedGroup = Number(state.ui.expandedGroup || 0);
    dom.upgradeTree.innerHTML = `
      <svg class="tree-connectors" aria-hidden="true"></svg>
      <div class="branch-master-row">
        ${branches.map((branch) => {
          const owned = branch.nodes.filter((node) => getLevel(node.id) > 0).length;
          const ready = branch.nodes.filter((node) => canUpgrade(node)).length;
          const open = branch.id === expandedBranch;
          return `<button class="branch-master ${open ? "active" : ""}" type="button" data-branch-toggle="${branch.id}" style="--branch-color:${branch.color}">
            <span class="branch-master-orb">${branch.id === "net_mastery" ? "◎" : branch.id === "automation" ? "▰" : branch.id === "detection" ? "◉" : branch.id === "fleet_synergy" ? "⌘" : "☠"}</span>
            <span><strong>${branch.name}</strong><small>${owned}/16 已升级 · ${ready} 个可升级</small></span>
          </button>`;
        }).join("")}
      </div>
      ${branches.filter((branch) => branch.id === expandedBranch).map((branch) => `
        <section class="branch-detail" style="--branch-color:${branch.color}">
          <div class="secondary-grid">
            ${Array.from({ length: 8 }).map((_, groupIndex) => {
              const groupNodes = branch.nodes.slice(groupIndex * 2, groupIndex * 2 + 2);
              const open = groupIndex === expandedGroup;
              const crossCount = groupNodes.reduce((sum, node) => sum + getPrerequisites(node).filter((req) => getNode(req.id) && getNode(req.id).branch !== branch.id).length, 0);
              return `<section class="secondary-wrap ${open ? "expanded" : ""}">
                <button class="secondary-node ${groupNodes.some((node) => canUpgrade(node)) ? "ready" : ""}" type="button" data-group-toggle="${branch.id}:${groupIndex}">
                  <span class="secondary-orb">${groupIndex + 1}</span>
                  <span class="secondary-name">${groups[branch.id][groupIndex]}</span>
                  ${crossCount ? `<span class="cross-badge">跨系统 +${crossCount}</span>` : ""}
                </button>
                ${open ? `<div class="group-leaves">
                  ${groupNodes.map((node) => {
                    const level = getLevel(node.id);
                    const locked = !prerequisiteMet(node);
                    const maxed = isNodeMaxed(node);
                    const available = !locked && !maxed && state.gold >= getUpgradeCost(node);
                    const unaffordable = !locked && !maxed && !available;
                    const requirement = prerequisiteText(node);
                    return `<button class="upgrade-node leaf-node ${level > 0 ? "owned" : ""} ${available ? "available" : ""} ${unaffordable ? "unaffordable" : ""} ${locked ? "locked" : ""} ${maxed ? "maxed" : ""}" type="button" data-upgrade="${node.id}">
                      <span class="node-orb"><b>${node.icon}</b><small>Lv.${level}</small></span>
                      <span class="node-label">${node.name}</span>
                      <span class="node-tooltip">
                        <strong>${node.name}</strong><em>Lv.${level} / ${node.max}</em><p>${node.description}</p>
                        <span>${node.effect(level)}</span><small>${maxed ? "MAX" : `${formatNumber(getUpgradeCost(node))} 金币`} · ${locked ? `🔒 ${requirement}` : maxed ? "已满级" : available ? "可升级" : `还差 ${formatNumber(getUpgradeCost(node) - state.gold)}`}</small>
                        <span class="node-pips">${Array.from({ length: Math.min(node.max, 10) }, (_, index) => `<i class="${index < level ? "filled" : ""}"></i>`).join("")}</span>
                      </span>
                    </button>`;
                  }).join("")}
                </div>` : ""}
              </section>`;
            }).join("")}
          </div>
        </section>`).join("")}`;
    scheduleTreeLineDraw();
  }

  function scheduleTreeLineDraw() {
    window.cancelAnimationFrame(treeRedrawFrame);
    treeRedrawFrame = window.requestAnimationFrame(drawTreeConnections);
  }
  function updateUpgradeDot() {
    const hasAffordableUpgrade = allNodes.some((node) => canUpgrade(node));
    dom.upgradeDot.hidden = !hasAffordableUpgrade;
  }

  function updateDynamicUI(force = false) {
    const now = performance.now();
    if (!force && now - lastDynamicRender < 80) return;
    lastDynamicRender = now;
    updateHUD();
    updateControlButtons();
    updateEventCard();
    updateUpgradeDot();
    renderGearSkillHud();
  }

  function updateAllUI() {
    updateDynamicUI(true);
    renderZoneTabs();
    renderUpgradeTree();
    renderSonarHotspots();
    renderBossHud();
    if (activeModal) renderModal();
  }

  function openModal(type, payload = {}) {
    activeModal = { type, payload };
    renderModal();
    dom.modalLayer.classList.add("open");
  }

  function closeModal() {
    const closedType = activeModal?.type || "";
    activeModal = null;
    dom.modalLayer.classList.remove("open");
    dom.modalLayer.innerHTML = "";
    if (closedType === "guide") {
      state.ui.guideSeen = true;
      saveGame(true);
    } else if (closedType === "profile" && !state.ui.guideSeen) {
      window.setTimeout(() => { if (!activeModal) openModal("guide"); }, 220);
    }
  }

  function renderModal() {
    if (!activeModal) return;
    let title = "";
    let subtitle = "";
    let body = "";
    let footer = "";

    if (activeModal.type === "achievements") {
      title = "成就档案";
      subtitle = `已解锁 ${Object.keys(state.achievements).length} / ${achievements.length}，每项成就提供永久加成。`;
      body = `<div class="achievement-grid">${achievements.map((achievement) => {
        const unlocked = Boolean(state.achievements[achievement.id]);
        return `
          <article class="achievement-item ${unlocked ? "unlocked" : ""}">
            <div class="achievement-icon">${unlocked ? "◆" : "◇"}</div>
            <div class="achievement-copy">
              <h3>${achievement.name}</h3>
              <p>${achievement.description}</p>
              <div class="achievement-reward">${achievement.reward}</div>
            </div>
          </article>`;
      }).join("")}</div>`;
    }

    if (activeModal.type === "encyclopedia") {
      title = "生物图谱";
      subtitle = `已发现 ${getDiscoveredCount()} / ${species.length} 种鱼类，捕获后自动点亮。`;
      body = zones.map((zone) => {
        const fishList = species.filter((fish) => fish.zone === zone.id);
        const found = fishList.filter((fish) => state.discovered[fish.id]).length;
        return `
          <section class="species-section">
            <div class="species-section-header">
              <h3>${zone.name}</h3>
              <span>${found} / ${fishList.length} 已发现 · 鱼价 ×${zone.priceMult}</span>
            </div>
            <div class="species-grid">
              ${fishList.map((fish) => {
                const record = state.discovered[fish.id];
                return `
                  <article class="species-card ${record ? "" : "locked"}">
                    <div class="species-illustration ${fish.detail ? "detail" : ""}" style="--fish-color:${fish.color};--image-scale:${fish.imageScale || 1}"><img src="${fish.image}" alt="" loading="lazy" decoding="async"></div>
                    <h4>${fish.name}</h4>
                    <div class="species-meta"><span>${speciesTierName(fish.tier)}</span><span class="species-price">${formatNumber(fish.basePrice * zone.priceMult)} 金币</span></div>
                    <div class="species-meta"><span>捕获总数</span><span>${formatInteger(record ? record.count : 0)}</span></div>
                    <div class="species-meta species-mastery"><span>${record && record.count >= 10000 ? "★★★" : record && record.count >= 1000 ? "★★" : record && record.count >= 100 ? "★" : "☆"} 图鉴成长</span><span>${fish.tier === "normal" ? "捕获量" : fish.tier === "rare" ? "稀有率" : "售价"}永久加成</span></div>
                  </article>`;
              }).join("")}
            </div>
          </section>`;
      }).join("");
    }

    if (activeModal.type === "contracts") {
      ensureDailyContracts();
      const completeCount = state.contracts.tasks.filter((task) => (state.contracts.progress[task.id] || 0) >= task.target).length;
      title = "每日深海委托";
      subtitle = `${state.contracts.date} · 已完成 ${completeCount} / ${state.contracts.tasks.length}，奖励每日只能领取一次。`;
      body = `<div class="contract-grid">${state.contracts.tasks.map((task) => {
        const progress = Math.min(task.target, state.contracts.progress[task.id] || 0);
        const ratio = task.target ? progress / task.target : 0;
        const claimed = Boolean(state.contracts.claimed[task.id]);
        const ready = progress >= task.target && !claimed;
        return `<article class="contract-card ${ready ? "ready" : ""} ${claimed ? "claimed" : ""}">
          <div class="contract-card-head"><span class="contract-glyph">${task.type === "boss" ? "☠" : task.type === "hotspot" ? "◉" : task.type === "expedition" ? "⌁" : "▤"}</span><div><small>深海委托</small><h3>${task.title}</h3></div></div>
          <div class="contract-progress"><i style="width:${Math.round(ratio * 100)}%"></i></div>
          <div class="contract-progress-copy"><span>${formatNumber(progress)} / ${formatNumber(task.target)}</span><strong>${claimed ? "已领取" : ready ? "可领取" : `${Math.round(ratio * 100)}%`}</strong></div>
          <div class="contract-reward"><span>结晶 +${task.reward.crystals}</span><span>合金 +${task.reward.alloy}</span></div>
          <button class="modal-button ${ready ? "primary" : ""}" type="button" data-claim-contract="${task.id}" ${ready ? "" : "disabled"}>${claimed ? "已结算" : ready ? "领取奖励" : "进行中"}</button>
        </article>`;
      }).join("")}</div><p class="muted">委托按设备本地日期生成。完成奖励还会推进装备保底进度。</p>`;
      footer = `<button class="modal-button" type="button" data-modal-close>关闭</button>`;
    }

    if (activeModal.type === "bossTutorial") {
      title = "巨兽猎杀指南";
      subtitle = "首领战分为三个阶段，任何失误都不会清空已完成进度。";
      body = `<div class="boss-tutorial">
        <article><span>01</span><div><small>声呐追踪</small><strong>把网落在发光弱点上</strong><p>破坏声呐核心：弱点会在热点间移动。手动落网命中正确位置，自动撒网只计算 25% 进度。核心破坏后获得 15 秒声呐校准。</p></div></article>
        <article><span>02</span><div><small>护甲破译</small><strong>命中热点或捕获高稀有鱼</strong><p>破坏外层护甲：普通命中增加 1 格，稀有鱼增加 1.5 格，传说鱼增加 2 格。护甲破坏后获得 20 秒捕获与首领进度增益。</p></div></article>
        <article><span>03</span><div><small>终结收网</small><strong>红色窗口出现时立即撒网</strong><p>破坏虚空心脏：在红色窗口内按空格、点击或触屏完成终结。精准命中会增加完美终结和传说装备概率。</p></div></article>
      </div>`;
      footer = `<button class="modal-button primary" type="button" data-modal-close>明白，开始猎杀</button>`;
    }
    if (activeModal.type === "boss") {
      const zone = currentZone();
      const boss = state.boss && state.boss.zone === state.currentZone ? state.boss : null;
      const progress = state.zoneProgress[state.currentZone] || { caught: 0, bossCharge: 0, bossDefeated: 0 };
      const def = BOSS_DEFS[state.currentZone];
      const remaining = boss && boss.active ? Math.max(0, (boss.expiresAt - Date.now()) / 1000) : 0;
      title = boss ? boss.name : `${zone.name}首领`;
      const phaseGoal = boss ? (boss.phase === 1 ? 2 : boss.phase === 2 ? 6 : 3) : 0;
      const phaseProgress = boss ? (boss.phase === 3 ? boss.finisher : boss.phaseProgress) : 0;
      const phaseCards = ["声呐追踪","护甲破译","终结收网"].map((label, index) => { const phase = index + 1; const goal = getBossPhaseGoal(state.currentZone, phase); const done = boss && boss.phase > phase ? goal : boss && boss.phase === phase ? (phase === 3 ? boss.finisher : boss.phaseProgress) : 0; return `<article class="boss-phase-step ${boss && boss.phase === phase ? "current" : ""} ${done >= goal ? "done" : ""}"><span>${phase}</span><div><small>${label}</small><strong>${phase === 1 ? "命中发光弱点" : phase === 2 ? "命中热点或捕获高稀有鱼" : "在红色窗口内收网"}</strong><p>${formatNumber(done)} / ${formatNumber(goal)}</p></div></article>`; }).join("");
      const bossParts = [
        ["sonar", "声呐核心", "第一阶段"],
        ["armor", "外层护甲", "第二阶段"],
        ["core", "虚空心脏", "终结阶段"]
      ].map(([id, label, phase]) => `<span class="${boss && (boss.brokenParts || []).includes(id) ? "broken" : ""}"><i></i><small>${phase}</small><strong>${label}</strong><b>${boss && (boss.brokenParts || []).includes(id) ? "已破坏" : "待破坏"}</b></span>`).join("");
      const bossRecord = state.bossRecords?.[state.currentZone] || { kills: 0, bestPerfect: 0, fastestSeconds: 0 };
      subtitle = boss ? `第 ${boss.phase} 阶段 · ${def.phases[boss.phase - 1]} · 当前进度 ${Math.round((phaseProgress / phaseGoal) * 100)}%。` : `当前海域捕获成长 ${formatInteger(progress.bossCharge)} / ${formatInteger(def.threshold)}。`;
      body = `<div class="boss-card ${boss ? "active" : ""}">
        <div class="boss-emblem">${boss ? boss.icon : "☠"}</div>
        <div class="boss-copy"><small>巨兽信号协议</small><h3>${boss ? boss.name : "首领蓄能中"}</h3><p>${boss ? "第一阶段追踪弱点，第二阶段破甲，第三阶段抓住收网窗口。失误只会延长窗口，不会回退已有进度。" : "持续捕获当前海域鱼类，熟练度达到阈值后将出现首领。"}</p></div>
        <div class="boss-progress"><i style="width:${boss ? Math.round((phaseProgress / phaseGoal) * 100) : Math.round((progress.bossCharge / def.threshold) * 100)}%"></i></div>
        <div class="boss-metrics">
          <span><small>${boss ? "阶段进度" : "首领蓄能"}</small><strong>${boss ? `${Math.round((phaseProgress / phaseGoal) * 100)}%` : `${Math.round((progress.bossCharge / def.threshold) * 100)}%`}</strong></span>
          <span><small>${boss ? "剩余时间" : "累计捕获"}</small><strong>${boss ? formatDuration(remaining) : formatInteger(progress.caught)}</strong></span>
          <span><small>已击败</small><strong>${progress.bossDefeated}</strong></span>
        </div>
        <p class="muted">成功击败必掉史诗装备，并有 25% 概率额外获得传说装备。任何失误都不会回退阶段进度。</p>
      </div><div class="boss-part-strip">${bossParts}</div><div class="boss-phase-checklist">${phaseCards}</div><div class="boss-record-strip"><span><small>本海域击败</small><strong>${bossRecord.kills || 0}</strong></span><span><small>最佳完美终结</small><strong>${Number(bossRecord.bestPerfect || 0).toFixed(2)}</strong></span><span><small>最快击杀</small><strong>${bossRecord.fastestSeconds ? formatDuration(bossRecord.fastestSeconds) : "尚未完成"}</strong></span><span><small>熔铸材料</small><strong>◉ ${getBossMaterialCount("sonarShard")} · ⬡ ${getBossMaterialCount("armorPlate")} · ✦ ${getBossMaterialCount("voidHeart")}</strong></span></div>`;
      footer = `<button class="modal-button primary" type="button" data-modal-close>${boss ? "返回海面锁定声呐" : "继续捕捞"}</button>`;
    }

    if (activeModal.type === "expedition") {
      const active = state.expedition?.active;
      const crew = getExpeditionCrew();
      const masteryLevel = Math.max(0, Number(state.expedition?.masteryLevel) || 0);
      const masteryXp = Math.max(0, Number(state.expedition?.masteryXp) || 0);
      const masteryCost = getExpeditionMasteryCost(masteryLevel);
      const masteryProgress = masteryLevel >= 20 ? 1 : clamp(masteryXp / masteryCost, 0, 1);
      title = active ? getExpeditionRoute(active.routeId).name : "深渊航线";
      subtitle = active ? `${getExpeditionRoute(active.routeId).tag} · 船员：${crew.name} · ${active.pendingNode ? "节点待处理" : active.expired ? "已抵达返航点" : "航线持续记录中"}` : `航线等级 ${masteryLevel} / 20 · 已完成 ${state.expedition.completed} 次航行 · 最高航程得分 ${formatNumber(state.expedition.bestScore)}。`;
      if (!active) {
        const routeCards = EXPEDITION_ROUTES.map((route) => {
          const unlocked = getExpeditionRouteUnlocked(route);
          const preview = getExpeditionRewardPreview(route, route.requiredCasts, false);
          return `<article class="expedition-route-card ${unlocked ? "" : "locked"}" style="--route-accent:${route.accent}">
            <div class="expedition-route-top"><span>${route.icon}</span><div><small>${route.tag} · ${route.risk}</small><h3>${route.name}</h3></div><b>${formatDuration(route.duration)}</b></div>
            <p>${route.description}</p>
            <div class="expedition-card-stats"><span><small>推进节点</small><strong>${route.nodeCount}</strong></span><span><small>完整航程</small><strong>${route.requiredCasts} 次落网</strong></span><span><small>基础奖励</small><strong>${formatNumber(preview.gold)} 金币</strong></span></div>
            <div class="expedition-card-foot"><span>${unlocked ? "可选择" : `需解锁 ${route.requiredZones} 个海域`}</span><button class="modal-button primary" type="button" data-expedition-route="${route.id}" ${unlocked ? "" : "disabled"}>部署航线</button></div>
          </article>`;
        }).join("");
        const crewCards = Object.entries(EXPEDITION_CREW_MODES).map(([id, mode]) => `<button class="crew-option ${state.expedition.crewMode === id ? "active" : ""}" type="button" data-expedition-crew="${id}"><span>${mode.icon}</span><div><strong>${mode.name}</strong><small>${mode.description}</small></div><b>${state.expedition.crewMode === id ? "已选择" : "选择"}</b></button>`).join("");
        body = `<div class="expedition-hero"><span>⌁</span><div><small>长期航行协议</small><h3>让每一次撒网都有航线目标</h3><p>路线会持续记录手动落网、热点命中和首领辅助。抵达节点时暂停推进，选择一条明确收益；提前返航按航程结算。</p><div class="expedition-mastery"><div><small>航线等级 ${masteryLevel} / 20</small><strong>全收益 +${(masteryLevel * 0.4).toFixed(1)}% · 首领奖励 +${(masteryLevel * 0.8).toFixed(1)}% · 热点时长 +${(masteryLevel * 1.2).toFixed(1)}%</strong></div><div class="expedition-mastery-track"><i style="width:${Math.round(masteryProgress * 100)}%"></i></div><b>${masteryLevel >= 20 ? "MAX" : `${formatNumber(masteryXp)} / ${formatNumber(masteryCost)}`}</b></div></div></div><h3 class="modal-subheading">船员策略</h3><div class="crew-options">${crewCards}</div><h3 class="modal-subheading">选择航线</h3><div class="expedition-routes">${routeCards}</div>`;
        footer = `<button class="modal-button" type="button" data-modal-close>暂时不出发</button>`;
      } else {
        const route = getExpeditionRoute(active.routeId);
        const progress = getExpeditionProgressRatio(active);
        const remaining = active.expired ? "等待返航" : formatDuration(getExpeditionTimeRemaining(active));
        const pending = active.pendingNode;
        const bonusEntries = Object.entries(active.bonuses || {}).filter(([, value]) => Number(value) > 0);
        const earlyPreview = getExpeditionRewardPreview(route, active.progress, true, active.expired);
        const log = (state.expedition.log || []).slice(-4).reverse();
        const pendingMarkup = pending ? `<section class="expedition-node-card">
          <div class="expedition-node-head"><span>${pending.icon}</span><div><small>航线节点 ${pending.index + 1} / ${active.thresholds.length}</small><h3>${pending.title}</h3><p>${pending.description}</p></div></div>
          <div class="expedition-choice-grid">${pending.choices.map((choice) => `<button class="expedition-choice" type="button" data-expedition-choice="${choice.id}"><strong>${choice.label}</strong><small>${choice.result}</small></button>`).join("")}</div>
        </section>` : `<section class="expedition-clear-card"><span>${active.expired ? "◷" : "⌖"}</span><div><strong>${active.expired ? "已抵达返航点" : "声呐航线稳定"}</strong><p>${active.expired ? "结算本次航程，领取金币、合金与航线得分。" : "继续在热点内落网，抵达下一节点后会出现两条明确选择。"}</p></div></section>`;
        const logMarkup = log.length ? `<div class="expedition-log">${log.map((entry) => `<div><small>${new Date(entry.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</small><strong>${entry.title}</strong><span>${entry.choice} · ${entry.result}</span></div>`).join("")}</div>` : `<p class="muted">还没有航线记录。每次节点选择都会写入航行日志。</p>`;
        body = `<div class="expedition-active-head"><div class="expedition-route-emblem" style="--route-accent:${route.accent}">${route.icon}</div><div><small>${route.tag} · ${crew.name}</small><h3>${route.name}</h3><p>${route.description}</p></div><b>${remaining}</b></div>
          <div class="expedition-progress-large"><i style="width:${Math.round(progress * 100)}%"></i><span>${Math.round(progress * 100)}%</span></div>
          <div class="expedition-metrics"><span><small>推进值</small><strong>${Math.round(active.progress)} / ${active.requiredCasts}</strong></span><span><small>热点命中</small><strong>${Math.round(active.stats.hotspots)}</strong></span><span><small>稀有 / 传说</small><strong>${Math.round(active.stats.rare)} / ${Math.round(active.stats.legendary)}</strong></span><span><small>预计返航</small><strong>${formatNumber(earlyPreview.gold)} 金币</strong></span></div>
          ${pendingMarkup}
          <div class="expedition-bonus-row"><small>当前航线加成</small><span>${bonusEntries.length ? bonusEntries.map(([key, value]) => key === "alloy" || key === "crystals" ? `${key === "alloy" ? "合金" : "结晶"} +${Math.round(value)}` : key === "goldPct" ? `金币 +${Math.round(value * 100)}%` : `${key === "catchPct" ? "捕获" : key === "rareChance" ? "稀有" : key === "legendChance" ? "传说" : "首领"} +${(Number(value) * 100).toFixed(1)}%`).join(" · ") : "尚无节点加成"}</span></div>
          <h3 class="modal-subheading">航行日志</h3>${logMarkup}`;
        footer = `<button class="modal-button" type="button" data-modal-close>返回海域</button><button class="modal-button primary" type="button" data-expedition-return ${pending || active.progress <= 0 ? "disabled" : ""}>${active.expired ? `结算航线 · ${formatNumber(earlyPreview.gold)} 金币` : `提前返航 · 约 ${formatNumber(earlyPreview.gold)} 金币`}</button>`;
      }
    }    if (activeModal.type === "guide") {
      title = "新船员玩法指南";
      subtitle = "第一次进入潮汐渔场，按这 6 步理解核心循环。指南可随时点击底部「玩法指南」重新打开。";
      body = `<div class="guide-hero"><span>⚓</span><div><small>舰长第一次出航</small><h3>先撒网，再把渔获变成永久成长</h3><p>金币用于解锁海域和升级天赋；图鉴、装备、科研、首领奖杯和航线等级会在长期保留。</p></div></div>
        <div class="guide-steps">
          <article class="guide-step"><span>01</span><div><small>基础操作</small><h3>点击海面撒网</h3><p>点击海面任意位置、底部「撒网」或按空格即可捕鱼。鱼舱装满后先出售，否则新渔获会停止进入鱼舱。</p><ul><li>金色、青色或紫色脉冲圈是声呐热点。</li><li>把网落在热点内会获得额外数量或稀有率。</li><li>空格可连续撒网，手机点海面即可。</li></ul></div></article>
          <article class="guide-step"><span>02</span><div><small>成长循环</small><h3>出售 → 升级 → 解锁海域</h3><p>左侧「母港交易」出售渔获，底部「深潜协议」升级永久天赋。金币足够后点击顶部海域标签解锁新海域。</p><ul><li>普通鱼是稳定收入，稀有鱼和传说鱼是主要爆发。</li><li>海域越深，鱼价和稀有率越高，但空网率也会变化。</li><li>不要只堆捕捞，自动化、售价和首领天赋同样重要。</li></ul></div></article>
          <article class="guide-step"><span>03</span><div><small>长期航线</small><h3>深渊航线与节点选择</h3><p>底部「深渊航线」可部署 10–20 分钟航程。成功撒网、命中热点和捕获高稀有鱼都会推进航程。</p><ul><li>抵达节点后会暂停推进，选择金币、合金、结晶、装备保底或首领增益。</li><li>航程等级永久提高全收益、首领奖励和热点持续时间。</li><li>自动撒网只能获得约 45% 的航程推进。</li></ul></div></article>
          <article class="guide-step"><span>04</span><div><small>首领战</small><h3>三阶段破坏巨兽</h3><p>累计捕获当前海域鱼类会召唤首领。首领分为声呐核心、外层护甲和虚空心脏三个阶段。</p><ul><li>第一阶段：把网落在发光弱点，破坏声呐核心。</li><li>第二阶段：命中热点或捕获高稀有鱼，破坏外层护甲。</li><li>第三阶段：红色窗口出现时立即收网；精准命中越完美，传说装备概率越高。</li></ul></div></article>
          <article class="guide-step"><span>05</span><div><small>构筑系统</small><h3>装备、技能与套装</h3><p>底部「舰载装备」管理 8 个槽位、套装、主动技和图鉴。相同装备会转化为强化或合金。</p><ul><li>装备主动技默认自动释放，手动可精确配合首领窗口。</li><li>五套套装在 2 / 4 / 6 / 8 件时逐层增强。</li><li>深渊航线完整返航会提供打捞装备与保底进度。</li></ul></div></article>
          <article class="guide-step"><span>06</span><div><small>长期目标</small><h3>图鉴、科研与深渊跃迁</h3><p>第一次捕获鱼种会点亮图鉴并提供永久小加成。科研和协议需要深渊结晶，适合在长期游玩中逐步解锁。</p><ul><li>图鉴星级：100 / 1,000 / 10,000 次累计捕获。</li><li>深渊跃迁会重置金币、鱼舱、普通海域和普通天赋。</li><li>装备、图鉴、成就、科研、协议、首领奖杯和航线等级永久保留。</li></ul></div></article>
        </div>
        <div class="guide-controls"><strong>快捷入口</strong><span><kbd>Space</kbd>撒网</span><span><kbd>S</kbd>出售</span><span><kbd>E</kbd>深潜协议</span><span><kbd>X</kbd>深渊航线</span><span><kbd>G</kbd>舰载装备</span><span><kbd>R/T/Y</kbd>装备技能</span><span><kbd>K</kbd>玩法指南</span></div>`;
      footer = `<button class="modal-button primary" type="button" data-modal-close>明白，开始捕鱼</button>`;
    }    if (activeModal.type === "profile") {
      const configured = Boolean(window.LeaderboardBridge?.isConfigured?.());
      title = "调查员档案";
      subtitle = configured ? "档案用于在线排行和成绩同步，不会上传完整本地存档。" : "当前为离线档案模式；配置 Supabase 后即可参与在线排行。";
      if (!state.profile) {
        body = `<div class="profile-hero"><div class="profile-avatar">⚓</div><div><small>创建唯一舰长名</small><h3>写下你的深海呼号</h3><p>昵称允许 2–12 个中文、字母、数字或下划线，创建后 3 天内不可修改。</p></div></div><label class="field-label">舰长昵称<input id="profileNicknameInput" maxlength="12" autocomplete="nickname" placeholder="例如：奶龙666"></label><p class="muted">离线时仍可创建本地档案，联网后若昵称已被占用会要求重新选择。</p>`;
        footer = `<button class="modal-button primary" type="button" data-profile-save>创建档案</button>`;
      } else {
        const created = state.profile.createdNicknameAt ? new Date(state.profile.createdNicknameAt).toLocaleDateString("zh-CN") : "未知";
        body = `<div class="profile-hero"><div class="profile-avatar">⚓</div><div><small>当前舰长</small><h3>${state.profile.nickname}</h3><p>档案编号 ${String(state.profile.id || "").slice(0, 12)} · 创建于 ${created}</p></div></div><div class="profile-summary"><span><small>综合舰长分</small><strong>${formatNumber(getCaptainScore())}</strong></span><span><small>最高海域</small><strong>${getZone(state.ascension?.bestZone || "shallow").name}</strong></span><span><small>同步状态</small><strong>${state.leaderboard?.lastSyncedAt ? "已同步" : configured ? "等待同步" : "离线模式"}</strong></span></div><label class="field-label">修改昵称<input id="profileNicknameInput" maxlength="12" value="${state.profile.nickname}" placeholder="昵称"></label><div class="profile-actions"><button class="modal-button" data-profile-save>保存昵称</button><button class="modal-button" data-save-export>导出存档</button><button class="modal-button" data-save-import>导入存档</button><button class="modal-button danger" data-profile-delete>删除在线档案</button></div><input id="saveImportInput" type="file" accept="application/json,.json" hidden><div class="privacy-card"><strong>数据说明</strong><p>仅上传昵称、匿名设备令牌、综合成绩和进度摘要；不上传本地存档、鱼舱明细、邮箱或设备信息。删除档案会清除服务端排行榜记录。</p></div>`;
      }
    }

    if (activeModal.type === "leaderboard") {
      const configured = Boolean(window.LeaderboardBridge?.isConfigured?.());
      const boards = [["captain","综合舰长榜"],["gold","金币航迹榜"],["depth","深潜进度榜"],["boss","首领猎杀榜"],["ascension","跃迁序列榜"]];
      const board = state.leaderboard?.board || "captain";
      const cache = state.leaderboard?.cache?.[board] || { entries: [], offline: true, fetchedAt: 0 };
      const entries = Array.isArray(cache.entries) ? cache.entries : [];
      const myProfile = state.profile;
      title = "深潜排行";
      subtitle = cache.offline ? "当前显示离线缓存，联网后自动刷新。" : `更新于 ${cache.fetchedAt ? formatDuration((Date.now() - cache.fetchedAt) / 1000) + "前" : "刚刚"}`;
      const tabBar = `<div class="leaderboard-tabs">${boards.map(([id,label]) => `<button type="button" class="${board === id ? "active" : ""}" data-leaderboard-board="${id}">${label}</button>`).join("")}</div>`;
      const rows = entries.length ? entries.map((entry, index) => {
        const nickname = entry.nickname || entry.profiles?.nickname || "未知舰长";
        const score = Number(entry.captain_score || entry.captainScore || entry.score || 0);
        const zoneCount = Number(entry.unlocked_zone_count || entry.unlockedZoneCount || 1);
        const boss = Number(entry.boss_defeated || entry.bossDefeated || 0);
        const ascension = Number(entry.ascension_count || entry.ascensionCount || 0);
        return `<article class="leaderboard-row ${myProfile?.nickname === nickname ? "me" : ""}"><span class="rank-number">${index + 1}</span><div><strong>${nickname}</strong><small>海域 ${zoneCount} · 首领 ${boss} · 跃迁 ${ascension}</small></div><em>${formatNumber(score)}</em></article>`;
      }).join("") : `<div class="leaderboard-empty"><strong>榜单暂时为空</strong><p>${configured ? "完成首次成绩同步后，你的名次会出现在这里。" : "配置 Supabase 后即可查看其他舰长的成绩。"}</p></div>`;
      body = tabBar + `<div class="my-rank-card"><small>我的综合成绩</small><strong>${myProfile?.nickname || "尚未创建档案"}</strong><em>${formatNumber(getCaptainScore())}</em></div>` + `<div class="leaderboard-list">${rows}</div>`;
      footer = `<button class="modal-button primary" type="button" data-leaderboard-refresh>刷新榜单</button>`;
    }
    if (activeModal.type === "credits") {
      title = "档案鸣谢";
      subtitle = "本地打包的 CC0、CC-BY 与 MIT 素材来源。";
      body = `
        <div class="credits-list">
          <article><strong>Three.js 0.149 / 0.186 sources</strong><p>three.js authors · MIT License · WebGL 渲染与 GLB 解析</p></article>
          <article><strong>Quaternius Fish</strong><p>CC0 · poly.pizza/m/BEcU9rjiAq · poly.pizza/m/XWl86YFtpF</p></article>
          <article><strong>Poly by Google</strong><p>CC-BY 3.0 · Fish、Goldfish、Shark 模型 · poly.pizza</p></article>
          <article><strong>jeremy</strong><p>CC-BY 3.0 · Blowfish 模型 · poly.pizza</p></article>
          <article><strong>Anonymous</strong><p>CC-BY 3.0 · Angler Fish 模型 · poly.pizza</p></article>
          <article><strong>Jungle Jim</strong><p>CC-BY · Alien Fish、热带异变鱼、魔鬼鱼、卡通小丑鱼与深海鮟鱇 · Sketchfab</p></article>
          <article><strong>HighPolyDensity</strong><p>CC-BY · Zorag 变异鮟鱇与 Stonewisp 变异鳐 · Sketchfab</p></article>
          <article><strong>AnimalMesh 3D / Mateus Schwaab / Evan</strong><p>CC-BY · 蓝鳃鱼、鳟鱼、旗鱼与吸盘鱼动画模型 · Sketchfab</p></article>
          <article><strong>anandcartoons / artistSC</strong><p>CC-BY · 变异深海鱼与风格化变异鳐 · Sketchfab</p></article>
          <article><strong>yanix / GoldenZtuff / Robert Kotsch</strong><p>CC-BY · 水母、金枪鱼与 250+ Fish Pack · Sketchfab</p></article>
          <article><strong>rubberduck / You're Perfect Studio</strong><p>CC0 · 水花、收网与 UI 音效 · OpenGameArt</p></article>
        </div>`;
    }
    if (activeModal.type === "equipment") {
      title = "深海舰载装备";
      subtitle = `深渊合金 ${state.equipment.alloy} · 已发现 ${Object.keys(state.equipment.discovered || {}).length} / ${getEquipmentPrototypeCount()} 种装备`;
      const tab = state.ui.equipmentTab || "equipped";
      const tabs = [["equipped", "当前装备"], ["collection", "收藏库"], ["skills", "技能配置"], ["forge", "巨兽熔铸"], ["codex", "装备图鉴"]];
      const tabBar = `<div class="equipment-tabs">${tabs.map(([id, label]) => `<button type="button" class="${tab === id ? "active" : ""}" data-equip-tab="${id}">${label}</button>`).join("")}</div>`;
      let panel = "";
      const setCounts = getEquippedSetCounts();
      const setStrip = `<div class="equipment-set-strip">${Object.entries(EQUIPMENT_SETS).map(([setId, set]) => { const count = Number(setCounts[setId] || 0); const next = Object.keys(set.bonuses || {}).map(Number).sort((a, b) => a - b).find((threshold) => count < threshold); return `<div class="equipment-set-chip ${count ? "active" : ""}" style="--set-color:${set.color}"><span>${set.name}</span><strong>${count} / 8</strong><small>${count ? next ? `下一档 ${next} 件` : "八件套已激活" : "未装备"}</small></div>`; }).join("")}</div>`;
      if (tab === "equipped") {
        panel = setStrip + `<div class="equipment-grid equipment-grid-eight">${Object.entries(EQUIPMENT_SLOTS).map(([slot, def]) => {
          const itemId = state.equipment.equipped[slot];
          const item = itemId && state.equipment.owned[itemId];
          const archetype = item ? getEquipmentArchetype(slot, item) : null;
          const rarity = item ? EQUIPMENT_RARITIES[item.rarity] : null;
          const skill = archetype && archetype.activeSkill ? GEAR_SKILLS[archetype.activeSkill] : null;
          const value = item ? def.base * rarity.multiplier * (1 + (item.level - 1) * 0.1) : 0;
          const itemSetCount = item ? Number(setCounts[item.set] || 0) : 0;
          const nextSetThreshold = item ? Object.keys(EQUIPMENT_SETS[item.set]?.bonuses || {}).map(Number).sort((a, b) => a - b).find((threshold) => itemSetCount < threshold) : null;
          return `<article class="equipment-slot ${item ? "owned" : "empty"}" style="--gear-color:${rarity ? rarity.color : "#557189"}">
            <div class="equipment-icon">${def.icon}</div>
            <div class="equipment-copy"><small>${def.name} · ${def.description}</small><strong>${item ? `${archetype.name} · ${rarity.name}` : "未装备"}</strong><p>${item ? `Lv.${item.level} · ${(value * 100).toFixed(1)}% ${def.stat}${skill ? ` · ${skill.name}` : ""} · ${EQUIPMENT_SETS[item.set]?.name || "潮汐"} ${itemSetCount}/8${nextSetThreshold ? `（下一档 ${nextSetThreshold}）` : ""}` : "稀有鱼、传说鱼、首领、宝箱与深渊航线可获得装备"}</p></div>
            ${item ? `<button class="modal-button gear-action" data-upgrade-gear="${item.id}">强化 ${Math.ceil((12 + item.level * 16) * rarity.multiplier)} 合金</button>` : ""}
          </article>`;
        }).join("")}</div>`;
      } else if (tab === "collection") {
        const owned = Object.values(state.equipment.owned);
        panel = setStrip + (owned.length ? `<div class="equipment-collection"><h3>收藏 ${owned.length} / ${getEquipmentPrototypeCount()}</h3><div class="gear-list">${owned.map((item) => {
          const slotDef = EQUIPMENT_SLOTS[item.slot] || EQUIPMENT_SLOTS.net;
          const archetype = getEquipmentArchetype(item.slot, item);
          const rarity = EQUIPMENT_RARITIES[item.rarity] || EQUIPMENT_RARITIES.common;
          const equipped = state.equipment.equipped[item.slot] === item.id;
          return `<article class="gear-card ${equipped ? "equipped" : ""}" style="--gear-color:${rarity.color}"><div class="equipment-icon">${archetype.icon || slotDef.icon}</div><div><small>${slotDef.name} · ${rarity.name} Lv.${item.level}</small><strong>${archetype.name}</strong><p>${archetype.passive || "传统属性"} · ${EQUIPMENT_SETS[item.set]?.name || "潮汐"}套装</p></div><div class="gear-card-actions"><button class="modal-button" data-equip-gear="${item.id}">${equipped ? "已装备" : "装备"}</button><button class="modal-button" data-upgrade-gear="${item.id}">强化</button></div></article>`;
        }).join("")}</div></div>` : `<p class="muted">尚未获得装备。稀有鱼、传说鱼、首领、漂流宝箱和深渊航线均有机会掉落。</p>`);
      } else if (tab === "skills") {
        const equipped = getEquippedActiveSkills();
        panel = `<div class="skill-config-head"><div><small>当前模式</small><strong>${state.equipment.skillMode === "manual" ? "手动协同" : "协同释放"}</strong><p>手动键位 R / T / Y；自动模式冷却时间增加 15%。</p></div><button class="modal-button" data-toggle-skill-mode>${state.equipment.skillMode === "manual" ? "切换自动" : "切换手动"}</button></div><div class="skill-loadout">${Object.entries(GEAR_SKILLS).map(([id, skill]) => {
          const available = equipped.includes(id);
          const selected = (state.equipment.skillLoadout || []).includes(id);
          return `<article class="skill-card ${selected ? "selected" : ""} ${available ? "" : "locked"}" style="--skill-color:${skill.color}"><div class="skill-icon">${skill.icon}</div><div><small>主动技 · 冷却 ${skill.cooldown}s</small><strong>${skill.name}</strong><p>${skill.description}</p></div><button class="modal-button" data-skill-loadout="${id}" ${available ? "" : "disabled"}>${selected ? "已装配" : available ? "装配" : "未拥有对应装备"}</button></article>`;
        }).join("")}</div>`;
      } else if (tab === "forge") {
        const materialStrip = Object.entries(BOSS_MATERIALS).map(([key, material]) => `<span style="--material-color:${material.color}"><i>${material.icon}</i><small>${material.name}</small><strong>${getBossMaterialCount(key)}</strong></span>`).join("");
        const forgeCards = BOSS_FORGE_RECIPES.map((recipe) => {
          const zone = getZone(recipe.zone);
          const archetype = getEquipmentArchetype(recipe.slot, { archetype: recipe.archetype });
          const owned = Object.values(state.equipment.owned).find((item) => item.archetype === recipe.archetype);
          const canCraft = canForgeBossEquipment(recipe);
          const costText = Object.entries(recipe.cost || {}).filter(([, value]) => Number(value) > 0).map(([key, value]) => key === "alloy" ? `合金 ×${value}` : `${BOSS_MATERIALS[key]?.name || key} ×${value}`).join(" · ");
          return `<article class="forge-card ${owned ? "owned" : ""}" style="--forge-color:${EQUIPMENT_RARITIES.legendary.color}"><div class="forge-card-head"><span>${archetype.icon}</span><div><small>${zone.name} · ${EQUIPMENT_SLOTS[recipe.slot]?.name || recipe.slot}</small><h3>${archetype.name}</h3></div><b>${owned ? `Lv.${owned.level}` : "未熔铸"}</b></div><p>${recipe.description}</p><div class="forge-cost">${costText}</div><button class="modal-button primary" type="button" data-forge-gear="${recipe.archetype}" ${canCraft ? "" : "disabled"}>${canCraft ? owned ? "熔铸强化" : "开始熔铸" : "材料不足"}</button></article>`;
        }).join("");
        panel = `<div class="boss-material-strip">${materialStrip}</div><p class="forge-note">击破首领的三个部位会依次获得声呐核心碎片、巨兽护甲片和虚空心脏核。巨兽装备不会从普通掉落中随机出现，只能通过熔铸获得。</p><div class="boss-forge-list">${forgeCards}</div>`;
      } else {
        panel = `<div class="gear-codex-grid">${Object.entries(EQUIPMENT_ARCHETYPES).flatMap(([slot, list]) => list.map((archetype) => {
          const found = Boolean(state.equipment.discovered?.[archetype.id]);
          return `<article class="gear-codex-card ${found ? "found" : "locked"}"><span>${found ? archetype.icon : "?"}</span><div><small>${EQUIPMENT_SLOTS[slot].name}</small><strong>${found ? archetype.name : "未发现"}</strong><p>${found ? archetype.passive : "通过捕捞与首领战解锁"}</p></div></article>`;
        })).join("")}</div>`;
      }
      body = tabBar + panel;
    }
    if (activeModal.type === "ascension") {
      const reward = getAscensionReward();
      title = "深渊跃迁";
      subtitle = `已完成 ${state.ascension.count} 次跃迁，拥有 ${state.ascension.crystals} 枚深渊结晶。`;
      const researchCards = Object.entries(RESEARCH_DEFS).map(([key, def]) => {
        const level = getResearchLevel(key);
        const cost = Math.ceil(8 * Math.pow(1.55, level));
        const current = level * def.value;
        const next = (level + 1) * def.value;
        return `<article class="research-card"><div><small>${def.name}</small><strong>Lv.${level} / 10</strong><p>当前 ${current >= 1000 ? formatNumber(current) : (current * 100).toFixed(2) + "%"} · 下一级 ${next >= 1000 ? formatNumber(next) : (next * 100).toFixed(2) + "%"}</p><em>${def.description}</em></div><button class="modal-button" data-research="${key}" ${level >= 10 || state.ascension.crystals < cost ? "disabled" : ""}>${level >= 10 ? "MAX" : `${cost} 结晶`}</button></article>`;
      }).join("");
      const protocolCards = ASCENSION_PROTOCOLS.map((protocol) => {
        const unlocked = isProtocolUnlocked(protocol.id);
        return `<article class="protocol-card ${unlocked ? "unlocked" : "locked"}"><span>${protocol.icon}</span><div><small>${protocol.count} 次跃迁解锁</small><strong>${protocol.name}</strong><p>${protocol.description}</p></div><em>${unlocked ? "已激活" : "未激活"}</em></article>`;
      }).join("");
      body = `<div class="ascension-summary"><span>终极技能 ${getUltimateCount()} / 3</span><span>累计首领 ${getTotalBossDefeated()}</span><span>航线等级 ${Number(state.expedition?.masteryLevel) || 0}</span><span>本次跃迁奖励 ${reward} 结晶</span></div><div class="ascension-detail"><div><small>跃迁会重置</small><strong>金币 · 鱼舱 · 普通海域 · 80 个普通天赋</strong><p>装备、图鉴、成就、科研、协议、首领奖杯与跃迁次数永久保留。</p></div></div><h3 class="modal-subheading">永久科研</h3><div class="research-list">${researchCards}</div><h3 class="modal-subheading">深潜协议</h3><div class="protocol-list">${protocolCards}</div>`;
      footer = `<button class="modal-button primary" type="button" data-ascend ${canAscend() ? "" : "disabled"}>${canAscend() ? `执行跃迁 · +${reward} 结晶` : "需激活三个终极技能"}</button>`;
    }
    if (activeModal.type === "offline") {
      const data = state.pendingOffline;
      if (!data) {
        closeModal();
        return;
      }
      title = "离线收网";
      subtitle = "拖网船在你离开期间持续工作，奖励已结算。";
      const capped = data.elapsedSeconds > data.cappedSeconds;
      body = `
        <div class="offline-visual"><div class="offline-orb">⌛</div></div>
        <div class="offline-summary">
          <div><small>离线时长</small><strong>${formatDuration(data.elapsedSeconds)}</strong></div>
          <div><small>结算上限</small><strong>${data.capHours} 小时</strong></div>
          <div><small>可领取金币</small><strong>${formatNumber(data.amount)}</strong></div>
        </div>
        <p class="muted">${capped ? "离线时间超过当前上限，超出部分不再结算。" : "本次离线收益已按当前拖网效率与鱼价完整结算。"}</p>`;
      footer = `<button class="modal-button primary" type="button" data-claim-offline>领取 ${formatNumber(data.amount)} 金币</button>`;
    }

    if (activeModal.type === "zone") {
      const zone = getZone(activeModal.payload.zoneId);
      const cost = getZoneCost(zone);
      const gate = hasZoneRequirements(zone);
      title = `解锁${zone.name}`;
      subtitle = zone.description;
      body = `
        <div class="unlock-hero">
          <div class="unlock-ring">⌁</div>
          <h3>${zone.subtitle}</h3>
          <p>该海域拥有更高的鱼类单价与稀有鱼概率。解锁后会自动切换，并保留全部升级与成就。</p>
          <div class="unlock-details">
            <div><small>普通鱼价格</small><strong>×${zone.priceMult}</strong></div>
            <div><small>稀有鱼概率</small><strong>${Math.round(zone.rareChance * 100)}%</strong></div>
            <div><small>解锁费用</small><strong>${formatNumber(cost)} 金币</strong></div>
            <div><small>海域权限</small><strong>${gate ? "满足" : zoneRequirementText(zone)}</strong></div>
          </div>
        </div>`;
      footer = `<button class="modal-button" type="button" data-modal-close>暂不解锁</button><button class="modal-button primary" type="button" data-unlock-zone="${zone.id}" ${gate && state.gold >= cost ? "" : "disabled"}>${gate ? `支付 ${formatNumber(cost)} 金币` : "权限尚未满足"}</button>`;
    }

    dom.modalLayer.innerHTML = `
      <div class="modal-shell">
        <div class="modal-header">
          <div><div class="section-kicker">深海舰长日志</div><h2>${title}</h2><p>${subtitle}</p></div>
          <button class="icon-button" type="button" data-modal-close aria-label="关闭">×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
      </div>`;
  }

  function claimOffline() {
    if (!state.pendingOffline) return;
    const amount = Number(state.pendingOffline.amount) || 0;
    state.gold += amount;
    state.totalGoldEarned += amount;
    state.pendingOffline = null;
    checkAchievements();
    closeModal();
    showToast("离线收益已领取", `获得 ${formatNumber(amount)} 金币。`, "gold");
    showFloatingText(`离线 +${formatNumber(amount)}`, "gold", dom.goldStat, -22);
    flashScreen("gold");
    glowEdge("gold");
    updateAllUI();
    saveGame(true);
  }

  function openDrawer() {
    dom.upgradeDrawer.classList.add("open");
    dom.drawerBackdrop.classList.add("open");
    dom.upgradeDrawer.setAttribute("aria-hidden", "false");
    dom.upgradeToggle.setAttribute("aria-expanded", "true");
    renderUpgradeTree();
  }

  function closeDrawer() {
    dom.upgradeDrawer.classList.remove("open");
    dom.drawerBackdrop.classList.remove("open");
    dom.upgradeDrawer.setAttribute("aria-hidden", "true");
    dom.upgradeToggle.setAttribute("aria-expanded", "false");
  }

  let lastTick = Date.now();

  function gameTick() {
    const now = Date.now();
    const delta = clamp((now - lastTick) / 1000, 0, 5);
    lastTick = now;

    if (keyboardCasting && !activeModal && !dom.upgradeDrawer.classList.contains("open")) {
      pointerOrigin = null;
      performCast("manual");
    }
    const rate = getAutoRate();
    if (rate > 0) {
      autoAccumulator += rate * delta;
      let guard = 0;
      while (autoAccumulator >= 1 && guard < 100) {
        autoAccumulator -= 1;
        performCast("auto");
        guard += 1;
      }
    } else {
      autoAccumulator = 0;
    }

    updateRandomEvent(now);
    updateSonar(now, delta);
    updateEcology(now);
    updateGearSkills(now);
    updateDynamicUI();
  }

  function isTypingTarget(target) {
    return target && (target.matches?.("input, textarea, select, [contenteditable=true]") || target.isContentEditable);
  }

  function keyboardAction(event) {
    if (event.repeat && event.code !== "Space" && event.key !== " ") return false;
    if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return false;
    const key = event.key.toLowerCase();
    if (event.code === "Space" || event.key === " ") {
      if (activeModal || dom.upgradeDrawer.classList.contains("open")) return false;
      event.preventDefault();
      if (state.boss?.phase === 3 && Date.now() <= state.boss.finisherWindowUntil) {
        pointerOrigin = null;
        performCast("manual");
        return true;
      }
      keyboardCasting = true;
      return true;
    }
    if (key === "escape") {
      if (activeModal) closeModal();
      else if (state.ui.leftPanelOpen || state.ui.rightPanelOpen) {
        updateRailState("left", false);
        updateRailState("right", false);
        saveGame(true);
      } else closeDrawer();
      keyboardCasting = false;
      return true;
    }
    if (activeModal) return false;
    if (key === "s") { sellAll(false); return true; }
    if (key === "f") { processFish(); return true; }
    if (key === "e") { dom.upgradeDrawer.classList.contains("open") ? closeDrawer() : openDrawer(); return true; }
    if (key === "a") { openModal("achievements"); return true; }
    if (key === "c") { openModal("encyclopedia"); return true; }
    if (key === "g") { openModal("equipment"); return true; }
    if (key === "q") { openModal("contracts"); return true; }
    if (key === "x") { openModal("expedition"); return true; }
    if (key === "k") { openModal("guide"); return true; }
    if (key === "b") { openModal("boss"); return true; }
    if (key === "l") { openLeaderboard(); return true; }
    if (key === "p") { openModal("profile"); return true; }
    if (key === "h") { showKeyboardHint(); return true; }
    if (key === "m") { toggleMute(); return true; }
    if (["r", "t", "y"].includes(key)) {
      const index = ["r", "t", "y"].indexOf(key);
      const skillId = (state.equipment.skillLoadout || [])[index];
      if (skillId) activateGearSkill(skillId, true);
      return true;
    }
    if (/^[1-8]$/.test(key)) {
      const zone = zones[Number(key) - 1];
      if (zone) switchZone(zone.id);
      return true;
    }
    return false;
  }
  function bindEvents() {
    dom.seaButton.addEventListener("pointerdown", (event) => {
      pointerOrigin = { x: event.clientX, y: event.clientY };
    });
    dom.seaButton.addEventListener("click", () => performCast("manual"));
    dom.castButton.addEventListener("pointerdown", () => {
      const rect = dom.seaPanel.getBoundingClientRect();
      pointerOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height * .64 };
    });
    dom.castButton.addEventListener("click", () => performCast("manual"));
    dom.sellButton.addEventListener("click", () => sellAll(false));
    dom.processButton.addEventListener("click", processFish);

    dom.zoneTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-zone-switch]");
      if (button) switchZone(button.dataset.zoneSwitch);
    });

    dom.upgradeTree.addEventListener("click", (event) => {
      const branchButton = event.target.closest("[data-branch-toggle]");
      const groupButton = event.target.closest("[data-group-toggle]");
      if (branchButton) {
        state.ui.expandedBranch = branchButton.dataset.branchToggle;
        state.ui.expandedGroup = 0;
        renderUpgradeTree();
        saveGame(true);
        return;
      }
      if (groupButton) {
        const [branchId, groupIndex] = groupButton.dataset.groupToggle.split(":");
        state.ui.expandedBranch = branchId;
        state.ui.expandedGroup = Number(groupIndex);
        renderUpgradeTree();
        saveGame(true);
        return;
      }
      const button = event.target.closest("[data-upgrade]");
      if (!button) return;
      if (button.dataset.longPress === "true") {
        button.dataset.longPress = "";
        return;
      }
      buyUpgrade(button.dataset.upgrade);
    });

    dom.upgradeTree.addEventListener("pointerover", (event) => {
      const node = event.target.closest(".upgrade-node");
      if (!node) return;
      window.clearTimeout(treeTooltipTimer);
      treeTooltipTimer = window.setTimeout(() => {
        dom.upgradeTree.querySelectorAll(".show-tooltip").forEach((item) => item.classList.remove("show-tooltip"));
        node.classList.add("show-tooltip");
      }, 560);
    });
    dom.upgradeTree.addEventListener("pointerout", (event) => {
      const node = event.target.closest(".upgrade-node");
      if (!node || node.contains(event.relatedTarget)) return;
      window.clearTimeout(treeTooltipTimer);
      node.classList.remove("show-tooltip");
    });
    dom.upgradeTree.addEventListener("pointerdown", (event) => {
      const node = event.target.closest(".upgrade-node");
      if (!node) return;
      node.dataset.longPress = "pending";
      window.clearTimeout(treeTooltipTimer);
      treeTooltipTimer = window.setTimeout(() => {
        node.dataset.longPress = "true";
        node.classList.add("show-tooltip");
      }, 560);
    });
    dom.upgradeTree.addEventListener("pointerup", (event) => {
      const node = event.target.closest(".upgrade-node");
      if (!node) return;
      window.clearTimeout(treeTooltipTimer);
      if (node.dataset.longPress === "pending") node.dataset.longPress = "";
      window.setTimeout(() => { if (node.dataset.longPress !== "true") node.dataset.longPress = ""; }, 420);
    });
    dom.upgradeTree.addEventListener("pointercancel", (event) => {
      const node = event.target.closest(".upgrade-node");
      if (node) node.dataset.longPress = "";
      window.clearTimeout(treeTooltipTimer);
    });
    dom.upgradeTree.addEventListener("scroll", scheduleTreeLineDraw, { passive: true });
    window.addEventListener("resize", scheduleTreeLineDraw);
    window.addEventListener("tide:3d-ready", () => emitTide("tide:fish-density", { count: window.innerWidth <= 760 ? 36 : 64 }));
    document.addEventListener("pointermove", (event) => {
      const glass = event.target.closest?.(".rail-card,.topbar,.bottom-dock,.upgrade-drawer,.modal-shell,.keyboard-hint");
      if (!glass) return;
      const rect = glass.getBoundingClientRect();
      glass.style.setProperty("--glass-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      glass.style.setProperty("--glass-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    });


    dom.upgradeToggle.addEventListener("click", openDrawer);
    dom.closeDrawerButton.addEventListener("click", closeDrawer);
    dom.drawerBackdrop.addEventListener("click", closeDrawer);
    dom.achievementsButton.addEventListener("click", () => openModal("achievements"));
    dom.encyclopediaButton.addEventListener("click", () => openModal("encyclopedia"));
    dom.creditsButton.addEventListener("click", () => openModal("credits"));
    dom.equipmentButton.addEventListener("click", () => openModal("equipment"));
    dom.contractsButton.addEventListener("click", () => openModal("contracts"));
    dom.guideButton?.addEventListener("click", () => openModal("guide"));
    dom.expeditionButton?.addEventListener("click", () => openModal("expedition"));
    dom.bossButton.addEventListener("click", () => openModal("boss"));
    dom.leaderboardButton.addEventListener("click", openLeaderboard);
    dom.profileButton.addEventListener("click", () => openModal("profile"));
    dom.ascensionButton.addEventListener("click", () => openModal("ascension"));
    dom.keyboardToggle.addEventListener("click", toggleKeyboardGuide);
    dom.railBackdrop?.addEventListener("click", () => {
      updateRailState("left", false);
      updateRailState("right", false);
    });
    document.querySelectorAll("[data-rail-close]").forEach((button) => {
      button.addEventListener("click", () => updateRailState(button.dataset.railClose, false));
    });
    ["left", "right"].forEach((side) => {
      const rail = document.getElementById(`${side}Rail`);
      const toggle = document.getElementById(`${side}RailToggle`);
      const pin = document.getElementById(`${side}RailPin`);
      toggle?.addEventListener("click", (event) => { event.stopPropagation(); toggleRail(side); });
      pin?.addEventListener("click", (event) => {
        event.stopPropagation();
        const pinKey = side === "left" ? "leftPanelPinned" : "rightPanelPinned";
        updateRailState(side, true, !state.ui[pinKey]);
        saveGame(true);
      });
      rail?.addEventListener("pointerenter", () => { if (window.matchMedia?.("(hover: hover)").matches) updateRailState(side, true); });
      rail?.addEventListener("pointerleave", () => {
        const pinKey = side === "left" ? "leftPanelPinned" : "rightPanelPinned";
        if (!state.ui[pinKey]) updateRailState(side, false);
      });
    });

    dom.modalLayer.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-modal-close]");
      const claimButton = event.target.closest("[data-claim-offline]");
      const contractButton = event.target.closest("[data-claim-contract]");
      const researchButton = event.target.closest("[data-research]");
      const ascendButton = event.target.closest("[data-ascend]");
      const equipButton = event.target.closest("[data-equip-gear]");
      const upgradeGearButton = event.target.closest("[data-upgrade-gear]");
      const forgeGearButton = event.target.closest("[data-forge-gear]");
      const unlockButton = event.target.closest("[data-unlock-zone]");
      const tabButton = event.target.closest("[data-equip-tab]");
      const skillModeButton = event.target.closest("[data-toggle-skill-mode]");
      const loadoutButton = event.target.closest("[data-skill-loadout]");
      const profileSaveButton = event.target.closest("[data-profile-save]");
      const exportSaveButton = event.target.closest("[data-save-export]");
      const importSaveButton = event.target.closest("[data-save-import]");
      const deleteProfileButton = event.target.closest("[data-profile-delete]");
      const boardButton = event.target.closest("[data-leaderboard-board]");
      const refreshLeaderboardButton = event.target.closest("[data-leaderboard-refresh]");
      const bossToggle = event.target.closest("[data-boss-toggle]");
      const expeditionRouteButton = event.target.closest("[data-expedition-route]");
      const expeditionCrewButton = event.target.closest("[data-expedition-crew]");
      const expeditionChoiceButton = event.target.closest("[data-expedition-choice]");
      const expeditionReturnButton = event.target.closest("[data-expedition-return]");
      if (closeButton) closeModal();
      if (claimButton) claimOffline();
      if (contractButton) claimContract(contractButton.dataset.claimContract);
      if (expeditionRouteButton) startExpedition(expeditionRouteButton.dataset.expeditionRoute);
      if (expeditionCrewButton) { state.expedition.crewMode = expeditionCrewButton.dataset.expeditionCrew; renderModal(); saveGame(true); }
      if (expeditionChoiceButton) resolveExpeditionChoice(expeditionChoiceButton.dataset.expeditionChoice);
      if (expeditionReturnButton) finishExpedition(!state.expedition?.active?.expired);
      if (unlockButton) unlockZone(unlockButton.dataset.unlockZone);
      if (researchButton) buyResearch(researchButton.dataset.research);
      if (ascendButton) performAscension();      if (tabButton) { state.ui.equipmentTab = tabButton.dataset.equipTab; renderModal(); }
      if (skillModeButton) { state.equipment.skillMode = state.equipment.skillMode === "manual" ? "auto" : "manual"; renderModal(); renderGearSkillHud(); saveGame(true); }
      if (loadoutButton) {
        const skillId = loadoutButton.dataset.skillLoadout;
        const loadout = state.equipment.skillLoadout || [];
        state.equipment.skillLoadout = loadout.includes(skillId) ? loadout.filter((id) => id !== skillId) : [...loadout, skillId].slice(0, 3);
        renderModal(); saveGame(true);
      }
      if (equipButton) {
        const item = state.equipment.owned[equipButton.dataset.equipGear];
        if (item) { state.equipment.equipped[item.slot] = item.id; state.equipment.lockedSlots[item.slot] = true; renderModal(); renderGearSkillHud(); saveGame(true); }
      }
      if (profileSaveButton) saveCaptainNickname();
      if (exportSaveButton) exportSaveFile();
      if (importSaveButton) document.getElementById("saveImportInput")?.click();
      if (deleteProfileButton) removeCaptainProfile();
      if (boardButton) { state.leaderboard.board = boardButton.dataset.leaderboardBoard; openLeaderboard(); }
      if (refreshLeaderboardButton) openLeaderboard();
      if (bossToggle) { state.ui.bossBannerExpanded = !state.ui.bossBannerExpanded; renderBossHud(); }
      if (upgradeGearButton) upgradeEquipment(upgradeGearButton.dataset.upgradeGear);
      if (forgeGearButton) forgeBossEquipment(forgeGearButton.dataset.forgeGear);

      if (event.target === dom.modalLayer) closeModal();
    });

    document.addEventListener("change", (event) => {
      if (event.target?.id === "saveImportInput") importSaveFile(event.target.files?.[0]);
    });
    document.addEventListener("keydown", (event) => {
      if (event.target?.id === "profileNicknameInput" && event.key === "Enter") saveCaptainNickname();
    });
    document.addEventListener("click", (event) => {
      const skillButton = event.target.closest("[data-gear-skill]");
      const modeButton = event.target.closest("[data-gear-skill-mode]");
      if (skillButton) activateGearSkill(skillButton.dataset.gearSkill, true);
      if (modeButton) {
        state.equipment.skillMode = state.equipment.skillMode === "manual" ? "auto" : "manual";
        renderGearSkillHud();
        saveGame(true);
      }
    });
    document.addEventListener("keydown", (event) => {
      keyboardAction(event);
    });
    document.addEventListener("keyup", (event) => {
      if (event.code === "Space" || event.key === " ") keyboardCasting = false;
    });
    window.addEventListener("blur", () => { keyboardCasting = false; });
    document.addEventListener("visibilitychange", () => { if (document.hidden) keyboardCasting = false; });
  }

  function initWaterShimmers() {
    if (!dom.shimmerField) return;
    let markup = "";
    for (let i = 0; i < 34; i += 1) {
      const size = fxBetween(2, 7).toFixed(1);
      markup += `<i class="sun-spark" style="--x:${fxBetween(2, 98).toFixed(1)}%;--y:${fxBetween(6, 94).toFixed(1)}%;--size:${size}px;--delay:${(-fxRandom() * 8).toFixed(2)}s;--duration:${fxBetween(4, 9).toFixed(2)}s"></i>`;
    }
    dom.shimmerField.innerHTML = markup;
  }

  function spawnJumpingFish() {
    const rect = dom.seaPanel.getBoundingClientRect();
    if (!rect.width) return;
    const fish = document.createElement("i");
    const startX = rect.left + fxBetween(rect.width * 0.12, rect.width * 0.88);
    const startY = rect.top + rect.height * fxBetween(0.34, 0.5);
    fish.className = "jumping-fish";
    fish.style.left = `${startX}px`;
    fish.style.top = `${startY}px`;
    const jumpX = fxBetween(-90, 90);
    const jumpY = fxBetween(-92, -62);
    const jumpAngle = fxBetween(-16, 16);
    fish.style.setProperty("--jump-x", `${jumpX.toFixed(1)}px`);
    fish.style.setProperty("--jump-y", `${jumpY.toFixed(1)}px`);
    fish.style.setProperty("--jump-mid-x", `${(jumpX * 0.55).toFixed(1)}px`);
    fish.style.setProperty("--jump-mid-y", `${jumpY.toFixed(1)}px`);
    fish.style.setProperty("--jump-angle", `${jumpAngle.toFixed(1)}deg`);
    fish.style.setProperty("--jump-mid-angle", `${(jumpAngle * -0.5).toFixed(1)}deg`);
    dom.effectRoot.appendChild(fish);
    for (let i = 0; i < 5; i += 1) {
      const drop = document.createElement("i");
      drop.className = "jump-splash";
      drop.style.left = `${startX + fxBetween(-8, 8)}px`;
      drop.style.top = `${startY + fxBetween(-3, 5)}px`;
      drop.style.setProperty("--jump-drop-x", `${fxBetween(-48, 48).toFixed(1)}px`);
      drop.style.setProperty("--jump-drop-y", `${fxBetween(-62, -22).toFixed(1)}px`);
      drop.style.setProperty("--jump-delay", `${fxBetween(150, 310).toFixed(0)}ms`);
      dom.effectRoot.appendChild(drop);
      window.setTimeout(() => drop.remove(), 1550);
    }
    window.setTimeout(() => fish.remove(), 1600);
  }

  function startAmbientEffects() {
    const schedule = () => {
      spawnJumpingFish();
      window.setTimeout(schedule, fxBetween(3600, 7200));
    };
    window.setTimeout(schedule, fxBetween(2200, 4200));
  }

  function flyCoinsToGold(count = 6) {
    trimFx(dom.effectRoot, ".coin-flight", 32);
    const sourceRect = dom.sellButton.getBoundingClientRect();
    const targetRect = dom.goldStat.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width * 0.78;
    const startY = sourceRect.top + sourceRect.height * 0.5;
    const endX = targetRect.left + targetRect.width * 0.5;
    const endY = targetRect.top + targetRect.height * 0.5;
    const total = clamp(Math.ceil(count * 0.55), 4, 9);
    for (let i = 0; i < total; i += 1) {
      const coin = document.createElement("i");
      const dx = endX - startX + fxBetween(-24, 24);
      const dy = endY - startY + fxBetween(-18, 18);
      coin.className = "coin-flight";
      coin.textContent = "◆";
      coin.style.left = `${startX + fxBetween(-18, 18)}px`;
      coin.style.top = `${startY + fxBetween(-12, 12)}px`;
      coin.style.setProperty("--coin-x", `${dx}px`);
      coin.style.setProperty("--coin-y", `${dy}px`);
      coin.style.setProperty("--coin-mid-x", `${dx * 0.52}px`);
      coin.style.setProperty("--coin-mid-y", `${Math.min(-72, dy * 0.25 - 94)}px`);
      coin.style.setProperty("--coin-delay", `${(i * 42).toFixed(0)}ms`);
      dom.effectRoot.appendChild(coin);
      window.setTimeout(() => {
        coin.remove();
        dom.goldStat.classList.add("coin-receive");
        window.setTimeout(() => dom.goldStat.classList.remove("coin-receive"), 190);
      }, 820 + i * 42);
    }
  }

  function emitStarBurst(originX, originY, type = "rare") {
    trimFx(dom.effectRoot, ".star-particle", 40);
    for (let i = 0; i < 12; i += 1) {
      const star = document.createElement("i");
      const angle = (Math.PI * 2 * i) / 12 + fxBetween(-0.16, 0.16);
      const distance = fxBetween(42, 110);
      star.className = `star-particle ${type}`;
      star.textContent = i % 3 === 0 ? "✦" : "◆";
      star.style.left = `${originX}px`;
      star.style.top = `${originY}px`;
      star.style.setProperty("--star-x", `${Math.cos(angle) * distance}px`);
      star.style.setProperty("--star-y", `${Math.sin(angle) * distance}px`);
      star.style.setProperty("--star-delay", `${fxBetween(0, 80).toFixed(0)}ms`);
      dom.effectRoot.appendChild(star);
      window.setTimeout(() => star.remove(), 1050);
    }
  }
  async function checkPublishedVersion() {
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      const response = await fetch(`version.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const current = dom.app.dataset.appVersion || "";
      if (data.version && current && data.version !== current) {
        showEventBanner("发现新版本", "刷新页面即可加载最新舰长日志。", "gold", 7000);
        showToast("游戏已更新", `当前 ${current}，最新 ${data.version}。`, "info");
      }
    } catch {}
  }

  function registerOfflineApp() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  function initGame() {
    loadGame();
    ensureDailyContracts();
    spawnSonarHotspots();
    updateEcology(0);
    renderGearSkillHud();
    renderBossHud();
    initSceneDecor();
    initWaterShimmers();
    startAmbientEffects();
    bindEvents();
    updateAllUI();
    updateRailState("left", state.ui.leftPanelOpen, state.ui.leftPanelPinned);
    updateRailState("right", state.ui.rightPanelOpen, state.ui.rightPanelPinned);
    emitTide("tide:mute", { muted: state.audioMuted });
    if (window.innerWidth <= 900) { state.ui.keyGuideCollapsed = true; updateKeyboardGuide(); } else if (state.ui.keyGuideCollapsed) updateKeyboardGuide(); else showKeyboardHint(true);
    saveGame(true);

    ensureCaptainProfile();
    if (state.profile && !state.ui.guideSeen) window.setTimeout(() => { if (!activeModal) openModal("guide"); }, 1100);
    checkPublishedVersion();
    registerOfflineApp();
    if (state.pendingOffline) {
      window.setTimeout(() => openModal("offline"), 320);
    }

    window.setInterval(gameTick, 100);
    window.setInterval(() => saveGame(false), 1000);
    window.addEventListener("beforeunload", () => saveGame(true));
  }

  initGame();

  function showFloatingText(text, type = "gain", anchor = null, yOffset = 0) {
    const element = document.createElement("div");
    element.className = `float-text ${type}`;
    element.textContent = text;
    const rect = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 + yOffset : window.innerHeight / 2;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty("--float-x", `${fxBetween(-12, 12).toFixed(1)}px`);
    element.style.setProperty("--float-y", `${fxBetween(-12, -4).toFixed(1)}px`);
    dom.effectRoot.appendChild(element);
    window.setTimeout(() => element.remove(), 1500);
  }

  function flashScreen(type = "gold") {
    dom.screenFlash.className = "screen-flash";
    void dom.screenFlash.offsetWidth;
    dom.screenFlash.classList.add(type);
    window.setTimeout(() => dom.screenFlash.classList.remove(type), type === "ultimate" ? 1050 : 520);
  }

  function glowEdge(type = "gold") {
    dom.edgeGlow.className = "edge-glow";
    void dom.edgeGlow.offsetWidth;
    dom.edgeGlow.classList.add(type);
    window.setTimeout(() => dom.edgeGlow.classList.remove(type), 1800);
  }

  function showEventBanner(title, message, type = "gold", duration = 3200) {
    window.clearTimeout(eventBannerTimer);
    dom.eventBannerIcon.textContent = type === "rare" ? "✦" : type === "migration" ? "≋" : "◆";
    dom.eventBannerTitle.textContent = title;
    dom.eventBannerText.textContent = message;
    dom.eventBanner.className = `event-banner ${type} show`;
    eventBannerTimer = window.setTimeout(() => dom.eventBanner.classList.remove("show"), duration);
  }

  function showCriticalText(label, type = "crit") {
    const rect = dom.seaPanel.getBoundingClientRect();
    const element = document.createElement("div");
    element.className = `critical-text ${type}`;
    element.textContent = label;
    element.style.left = `${rect.left + rect.width * fxBetween(0.3, 0.7)}px`;
    element.style.top = `${rect.top + rect.height * fxBetween(0.36, 0.52)}px`;
    if (type === "rare" || type === "legendary") {
      emitStarBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.46, type);
    }
    dom.effectRoot.appendChild(element);
    window.setTimeout(() => element.remove(), 1400);
  }

  function triggerImpact(type = "normal", origin = null) {
    emitTide("tide:impact", { type, origin });
    emitTide("tide:impact3d", { type });
    const configs = {
      normal: { amp: 1.5, duration: 90, flash: "hit", vibrate: 0 },
      crit: { amp: 5, duration: 115, flash: "gold", vibrate: 10 },
      rare: { amp: 8, duration: 150, flash: "rare", vibrate: 18 },
      legendary: { amp: 11, duration: 185, flash: "gold", vibrate: 28 },
      ultimate: { amp: 12, duration: 200, flash: "ultimate", vibrate: 32 }
    };
    const config = configs[type] || configs.normal;
    const rect = dom.seaPanel.getBoundingClientRect();
    const originX = origin && Number.isFinite(origin.x) ? origin.x : rect.left + rect.width / 2;
    const originY = origin && Number.isFinite(origin.y) ? origin.y : rect.top + rect.height * 0.5;
    const direction = originX < rect.left + rect.width / 2 ? -1 : 1;
    const amp = config.amp * direction;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (type === "crit") showCriticalText("暴击！", "crit");
    if (type === "rare") showCriticalText("稀有！", "rare");
    if (type === "legendary") showCriticalText("传说！", "legendary");
    if (type === "ultimate") showCriticalText("终极！", "legendary");

    if (reduced) return;
    const token = `${Date.now()}-${Math.floor(fxRandom() * 100000)}`;
    dom.app.dataset.fxToken = token;
    dom.app.style.setProperty("--shake-a", `${amp.toFixed(1)}px`);
    dom.app.style.setProperty("--shake-b", `${(-amp * 0.72).toFixed(1)}px`);
    dom.app.style.setProperty("--shake-c", `${(amp * 0.34).toFixed(1)}px`);
    dom.app.style.setProperty("--shake-rotate", `${(amp * 0.03).toFixed(2)}deg`);
    dom.app.style.setProperty("--shake-rotate-neg", `${(amp * -0.02).toFixed(2)}deg`);
    dom.app.style.setProperty("--shake-duration", `${config.duration}ms`);
    dom.app.classList.remove("fx-shake");
    void dom.app.offsetWidth;
    dom.app.classList.add("fx-shake");
    flashScreen(config.flash);
    if (type !== "normal") glowEdge(type === "rare" ? "cyan" : "gold");
    if (config.vibrate && navigator.vibrate) navigator.vibrate(config.vibrate);
    window.setTimeout(() => {
      if (dom.app.dataset.fxToken === token) dom.app.classList.remove("fx-shake");
    }, config.duration + 80);
  }
  function triggerNetImpact(empty = false) {
    emitTide("tide:net-impact", { empty });
    dom.seaPanel.classList.remove("impact-active", "empty-impact");
    void dom.seaPanel.offsetWidth;
    dom.seaPanel.classList.add(empty ? "empty-impact" : "impact-active");
    window.setTimeout(() => dom.seaPanel.classList.remove("impact-active", "empty-impact"), 1050);
  }

  function emitSplash(count = 14, empty = false) {
    trimFx(dom.splashField, ".splash-drop", 24);
    for (let i = 0; i < count; i += 1) {
      const drop = document.createElement("i");
      drop.className = `splash-drop${empty ? " empty-drop" : ""}`;
      drop.style.setProperty("--drop-x", `${fxBetween(-160, 160).toFixed(1)}px`);
      drop.style.setProperty("--drop-y", `${fxBetween(-145, -32).toFixed(1)}px`);
      drop.style.setProperty("--drop-delay", `${fxBetween(0, 150).toFixed(0)}ms`);
      drop.style.setProperty("--drop-size", `${fxBetween(2, 7).toFixed(1)}px`);
      dom.splashField.appendChild(drop);
      window.setTimeout(() => drop.remove(), 1300);
    }
  }

  function flyFishToHold(count, tier = "normal", caughtSpecies = []) {
    trimFx(dom.effectRoot, ".fish-spark", 64);
    const source = pointerOrigin || (() => {
      const rect = dom.seaPanel.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.56 };
    })();
    const targetRect = dom.holdStat.getBoundingClientRect ? dom.holdStat.getBoundingClientRect() : null;
    const target = targetRect && targetRect.width ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 } : { x: window.innerWidth - 120, y: 42 };
    const total = clamp(Math.ceil(count * 0.55), 2, 9);
    for (let i = 0; i < total; i += 1) {
      const spark = document.createElement("i");
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const duration = fxBetween(680, 980);
      const sourceFish = caughtSpecies[i % caughtSpecies.length] || species[0];
      spark.className = `fish-spark has-image${tier === "rare" ? " rare" : ""}${tier === "legendary" ? " legendary" : ""}`;
      spark.style.setProperty("--spark-image", `url("${sourceFish.image}")`);
      spark.style.left = `${source.x + fxBetween(-65, 65)}px`;
      spark.style.top = `${source.y + fxBetween(-50, 45)}px`;
      const flightX = dx + fxBetween(-35, 35);
      const flightY = dy + fxBetween(-25, 25);
      spark.style.setProperty("--flight-x", `${flightX}px`);
      spark.style.setProperty("--flight-y", `${flightY}px`);
      spark.style.setProperty("--flight-mid-x", `${flightX * 0.5}px`);
      spark.style.setProperty("--flight-mid-y", `${flightY * 0.42 - 90}px`);
      spark.style.setProperty("--flight-end-x", `${flightX * 0.88}px`);
      spark.style.setProperty("--flight-end-y", `${flightY * 0.78 - 26}px`);
      spark.style.setProperty("--flight-duration", `${duration.toFixed(0)}ms`);
      spark.style.setProperty("--flight-delay", `${(i * 34).toFixed(0)}ms`);
      spark.style.setProperty("--flight-shake", `${fxBetween(-13, 13).toFixed(1)}px`);
      dom.effectRoot.appendChild(spark);
      window.setTimeout(() => {
        spark.remove();
        dom.holdStat.classList.add("hold-receive");
        window.setTimeout(() => dom.holdStat.classList.remove("hold-receive"), 180);
      }, duration + i * 34);
    }
  }

  function animateStatValue(element, direction = "increase") {
    element.classList.remove("value-increase", "value-decrease");
    void element.offsetWidth;
    element.classList.add(direction === "decrease" ? "value-decrease" : "value-increase");
    window.setTimeout(() => element.classList.remove("value-increase", "value-decrease"), 460);
  }

  function animateUpgradeNode(id, ultimate = false) {
    window.requestAnimationFrame(() => {
      const node = dom.upgradeTree.querySelector(`[data-upgrade="${id}"]`);
      if (!node) return;
      const wrap = node.closest(".node-wrap");
      const previous = wrap ? wrap.previousElementSibling : null;
      node.classList.add("upgrade-burst");
      if (wrap) wrap.classList.add("line-pulse");
      if (previous) previous.classList.add("line-pulse");
      if (ultimate) {
        node.classList.add("ultimate-glow");
        triggerImpact("ultimate", { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
      window.setTimeout(() => {
        node.classList.remove("upgrade-burst");
        if (wrap) wrap.classList.remove("line-pulse");
        if (previous) previous.classList.remove("line-pulse");
      }, 1250);
    });
  }
})();
