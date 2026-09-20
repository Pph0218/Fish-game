# 鱼类素材接入说明

当前游戏共有 **48 种鱼类**，按 8 个海域划分，每个海域 6 种。

## 推荐图片规格

- 格式：透明背景 PNG，鱼头朝右。
- 单帧尺寸：推荐 `512×256`，也可以提供更高分辨率后统一缩放。
- 静态替换：每个鱼种提供一张 PNG，文件名使用鱼种 ID，例如 `silver_scad.png`。
- 动画面板：推荐每张图使用 `4×2` 精灵表，即 `2048×512`：第一行 4 帧游动，第二行 4 帧转向、挣扎或捕获。
- GLB 替换：如需要真正的 3D 鱼，请提供带内嵌贴图和动画的 GLB；单独图片只能复刻为 2D 精灵层。
- 授权：公开部署前请确认素材为 CC0、CC-BY 或你自己的原创，并在 `THIRD_PARTY_ASSETS.md` 记录来源。

## 48 种鱼命名表

### 岸边浅滩 (`shallow`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 银鲹 | `silver_scad` | normal | `assets/fish/custom/silver_scad.png` |
| 沙丁鱼 | `sardine` | normal | `assets/fish/custom/sardine.png` |
| 斑石鲷 | `spotted_bream` | rare | `assets/fish/custom/spotted_bream.png` |
| 月光鲤 | `moon_carp` | legendary | `assets/fish/custom/moon_carp.png` |
| 棱镜鳉鱼 | `prism_guppy` | normal | `assets/fish/custom/prism_guppy.png` |
| 潟湖狗鱼 | `lagoon_pike` | rare | `assets/fish/custom/lagoon_pike.png` |

### 近海礁区 (`reef`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 红鳍笛鲷 | `red_snapper` | normal | `assets/fish/custom/red_snapper.png` |
| 礁石斑鱼 | `grouper` | normal | `assets/fish/custom/grouper.png` |
| 蓝点鲛 | `blue_spotted_ray` | rare | `assets/fish/custom/blue_spotted_ray.png` |
| 珊瑚龙鱼 | `coral_dragon` | legendary | `assets/fish/custom/coral_dragon.png` |
| 霓虹狮子鱼 | `neon_lionfish` | normal | `assets/fish/custom/neon_lionfish.png` |
| 水晶海龟 | `crystal_turtle` | rare | `assets/fish/custom/crystal_turtle.png` |

### 深海渔场 (`deep`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 深海鳕 | `deep_cod` | normal | `assets/fish/custom/deep_cod.png` |
| 蓝鳍金枪鱼 | `bluefin_tuna` | normal | `assets/fish/custom/bluefin_tuna.png` |
| 皇带鱼 | `oarfish` | rare | `assets/fish/custom/oarfish.png` |
| 灯笼巨口鱼 | `lanternfish` | legendary | `assets/fish/custom/lanternfish.png` |
| 幽暗剑鱼 | `gloom_sword` | normal | `assets/fish/custom/gloom_sword.png` |
| 等离子鳐 | `plasma_manta` | legendary | `assets/fish/custom/plasma_manta.png` |

### 远洋深渊 (`abyss`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 深渊鳗 | `abyss_eel` | normal | `assets/fish/custom/abyss_eel.png` |
| 黑棘鲷 | `black_sea_bream` | normal | `assets/fish/custom/black_sea_bream.png` |
| 幽灵鲨 | `ghost_shark` | rare | `assets/fish/custom/ghost_shark.png` |
| 星辉鲸 | `starlight_whale` | legendary | `assets/fish/custom/starlight_whale.png` |
| 星云鳗 | `nebula_eel` | rare | `assets/fish/custom/nebula_eel.png` |
| 泰坦鲸 | `titan_whale` | legendary | `assets/fish/custom/titan_whale.png` |

### 极光海沟 (`aurora`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 冰晶银鱼 | `crystal_smelt` | normal | `assets/fish/custom/crystal_smelt.png` |
| 极光鳕 | `aurora_cod` | normal | `assets/fish/custom/aurora_cod.png` |
| 磷光魟 | `phosphor_ray` | normal | `assets/fish/custom/phosphor_ray.png` |
| 幽蓝旗鱼 | `cobalt_marlin` | rare | `assets/fish/custom/cobalt_marlin.png` |
| 极光龙鳗 | `aurora_dragon_eel` | rare | `assets/fish/custom/aurora_dragon_eel.png` |
| 天穹水母 | `sky_jelly` | legendary | `assets/fish/custom/sky_jelly.png` |

### 热泉裂谷 (`rift`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 熔纹鲈 | `magma_bass` | normal | `assets/fish/custom/magma_bass.png` |
| 黑烟鳗 | `blacksmoke_eel` | normal | `assets/fish/custom/blacksmoke_eel.png` |
| 火纹马林 | `flame_marlin` | normal | `assets/fish/custom/flame_marlin.png` |
| 熔心鲷 | `ember_snapper` | rare | `assets/fish/custom/ember_snapper.png` |
| 熔岩鬼鲛 | `lava_goblin_shark` | rare | `assets/fish/custom/lava_goblin_shark.png` |
| 太古炎鲸 | `primordial_whalefish` | legendary | `assets/fish/custom/primordial_whalefish.png` |

### 沉没观测城 (`city`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 遗迹雀鲷 | `relic_damselfish` | normal | `assets/fish/custom/relic_damselfish.png` |
| 钛壳梭鱼 | `titanium_barracuda` | normal | `assets/fish/custom/titanium_barracuda.png` |
| 蓝钢鲳 | `blue_steel_pomfret` | normal | `assets/fish/custom/blue_steel_pomfret.png` |
| 守望剑鱼 | `watcher_swordfish` | rare | `assets/fish/custom/watcher_swordfish.png` |
| 机械幽灵鲨 | `mech_ghost_shark` | rare | `assets/fish/custom/mech_ghost_shark.png` |
| 深海智核 | `abyss_core` | legendary | `assets/fish/custom/abyss_core.png` |

### 星海归墟 (`void`)

| 中文名 | 鱼种 ID | 品质 | 推荐文件 |
| --- | --- | --- | --- |
| 星尘沙丁 | `stardust_sardine` | normal | `assets/fish/custom/stardust_sardine.png` |
| 幻月鳐 | `phantom_moon_ray` | normal | `assets/fish/custom/phantom_moon_ray.png` |
| 虚空金枪 | `void_tuna` | normal | `assets/fish/custom/void_tuna.png` |
| 重力皇带 | `gravity_oarfish` | rare | `assets/fish/custom/gravity_oarfish.png` |
| 归墟龙鲸 | `void_whale` | rare | `assets/fish/custom/void_whale.png` |
| 创世星鲸 | `genesis_whale` | legendary | `assets/fish/custom/genesis_whale.png` |

当前默认鱼形来自 `assets/fish/singles/`，是高质量 3D 模型烘焙出的单帧透明精灵。把图片放到 `assets/fish/custom/` 后，在 `assets/fish/custom-manifest.js` 中登记对应鱼种：

```js
window.TIDE_CUSTOM_FISH_ASSETS = {
  silver_scad: { src: "assets/fish/custom/silver_scad.png", atlas: false },
  sardine: { src: "assets/fish/custom/sardine-atlas.png", atlas: true }
};
```

`atlas: false` 表示单张静态图；`atlas: true` 表示 4×2 精灵表。

未登记图片的鱼种会继续使用当前内置精灵模板。替换素材不会修改捕鱼、价格、稀有度或存档逻辑。

## 当前运行时策略

- 桌面端宽度 `>= 760px`：按海域延迟加载 `assets/deepsea/downloads/` 中的高质量 GLB 鱼模型，保留源模型材质与贴图，单海域约 36 条同屏鱼。
- 手机与低性能设备：使用 `assets/fish/singles/` 的透明精灵作为性能降级层，保持 36 条鱼群覆盖。
- 模型加载完成后只会重新布置当前海域鱼群，不会同时常驻全部 15 个模型。
- 调试时可在控制台设置 `window.TIDE_FORCE_SPRITES = true`，用于强制检查精灵降级路径。
- `assets/fish/custom-manifest.js` 现在主要作为精灵兜底和自定义替换入口；桌面端优先使用下载的 GLB 模型。
