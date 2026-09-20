# Third-party assets

This game bundles locally hosted third-party assets. No runtime CDN requests are required.

## Three.js

- Source: https://www.npmjs.com/package/three
- Author: three.js authors
- License: MIT
- Bundled source files: `vendor/three/`
- Runtime compatibility files: `vendor/three/three.global.js`, `vendor/three/GLTFLoader.global.js`
- Usage: WebGL renderer, GLB parser and 3D scene graph.

## Fish Pack 2.0

- Source: https://kenney.nl/assets/fish-pack
- Author: Kenney
- License: CC0 1.0
- Bundled path: `assets/fish/kenney/`
- Usage: fallback 2D fish illustrations and encyclopedia visuals.

## 3D fish models

The following GLB models are used by the WebGL scene and are stored in `assets/fish/models/`:

- Fish (Quaternius): CC0, https://poly.pizza/m/BEcU9rjiAq
- Fish (Poly by Google): CC-BY 3.0, https://poly.pizza/m/aEyLrUMMoUK
- Goldfish (Poly by Google): CC-BY 3.0, https://poly.pizza/m/3GPUntjwqCa
- Fish (Quaternius): CC0, https://poly.pizza/m/XWl86YFtpF
- Blowfish (jeremy): CC-BY 3.0, https://poly.pizza/m/8DXeKkgTS_s
- Shark (Poly by Google): CC-BY 3.0, https://poly.pizza/m/1mVWW4RFVHc
- Angler Fish (Anonymous): CC-BY 3.0, https://poly.pizza/m/85n5_RiSeSf

The runtime copies are embedded in `assets/fish/models-data.js` for `file://` compatibility. The original GLB files remain in `assets/fish/models/` for source and attribution.

## Water and fishing sounds

- 40 CC0 water / splash / slime SFX, author rubberduck: CC0, https://opengameart.org/content/40-cc0-water-splash-slime-sfx
- Fisheefects, author You're Perfect Studio / Memoraphile: CC0, https://opengameart.org/content/fisheefects
- Bundled audio: `assets/audio/splash.wav`, `reel.wav`, `select.wav`, `bloop.wav`

No copyrighted game art, logo, UI, audio, or code from the referenced arcade games is included. The visual language is an original implementation inspired by broad arcade-fishing conventions.

## Procedural 3D fish prototypes

- 鳗形、鳐形、水母、头足类、旗鱼、食人鱼、海龙和巨鲸原型由项目内 Three.js 几何体与程序化材质构建，不包含外部模型或纹理。
- 这些原型与现有本地 GLB 模型组合成 15 种可动画鱼形，供普通、稀有和传说鱼共用；差异通过比例、色板、花纹、鳍片、发光和运动速度实现。
## Generated sprite assets

- `assets/fish/sprites/*.png` and `assets/fish/sprites-data.js` are project-local raster sprite sheets generated for this game.
- They contain no third-party artwork, photos, logos, textures, or online-hosted dependencies.
- The 3D organic boss meshes are assembled at runtime from local Three.js geometry and the existing local GLB fish models.
## Cartoon boss models

The following Poly Pizza models are bundled locally for the eight regional bosses. All are licensed CC0 1.0; the original GLB files are stored in `assets/fish/bosses/` and embedded into `assets/fish/boss-models-data.js` and loaded only when a boss appears.

- Tetra: https://poly.pizza/m/l6AhogdZHe
- Blobfish: https://poly.pizza/m/7Jh8vsARfN
- Snake: https://poly.pizza/m/x9x0viZs8V
- Whale: https://poly.pizza/m/JGFwp6xWgk
- Dragon: https://poly.pizza/m/3rUm1cN3yp
- Dragon Evolved: https://poly.pizza/m/LlwD0QNUPj
- Manta ray: https://poly.pizza/m/yzD8b7ZHZm
- Shark: https://poly.pizza/m/AyHTK3zUSG
## High-quality deepsea models

The final high-quality fish and sea-creature source models are stored in `assets/deepsea/downloads/`. Their authors, source URLs, face counts and CC0/CC-BY licenses are listed in `assets/deepsea/DEEPSEA_ASSET_SOURCES.md` and `assets/deepsea/sketchfab-downloads.json`. The gameplay sprite sheets are baked locally from these models and do not require a runtime Sketchfab connection.