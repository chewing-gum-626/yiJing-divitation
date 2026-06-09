# 技术设计

## 技术栈
- Vue3 + TypeScript + Vite
- Tailwind CSS
- Pinia
- GSAP
- Lucide
- html-to-image（分享图片）
- Vercel（部署）
- localStorage（本地存储）

## 项目结构
src/
├── api/                       # 未来后端接口层
│
├── assets/
│   ├── icons/
│   ├── illustrations/
│   ├── audio/
│   └── textures/
│
├── animations/               # GSAP动画
│   ├── coin/
│   ├── gua/
│   ├── reveal/
│   └── transition/
│
├── components/
│   ├── common/
│   ├── gua/
│   ├── card/
│   ├── animation/
│   └── layout/
│
├── composables/              # Vue组合式逻辑
│   ├── useGua.ts
│   ├── useDailyLimit.ts
│   ├── useShare.ts
│   └── useAnimation.ts
│
├── constants/
│   ├── gua.ts
│   ├── questionType.ts
│   └── animation.ts
│
├── router/
│
├── services/                 # 核心业务逻辑
│   ├── guaService.ts
│   ├── interpretationService.ts
│   ├── shareService.ts
│   └── storageService.ts
│
├── stores/
│   ├── guaStore.ts
│   ├── dailyStore.ts
│   └── uiStore.ts
│
├── styles/
│   ├── tailwind.css
│   ├── variables.css
│   └── animation.css
│
├── types/
│   ├── gua.ts
│   ├── result.ts
│   └── share.ts
│
├── utils/
│   ├── date.ts
│   ├── random.ts
│   └── storage.ts
│
├── views/
│   ├── Home.vue
│   ├── CoinDivination.vue
│   ├── DailyGua.vue
│   └── Result.vue
│
├── App.vue
└── main.ts

## 核心功能
- 免登录/游客模式：完全不收集用户信息，打开即用。
- 手动模拟摇卦：用户需手动点击 6 次按钮，依次从下往上生成六个爻位。
- 次数防刷与跨日重置：普通起卦每日限 3 次，每日一卦每日限 1 次，基于本地系统时间跨日自动重置。
- 解耦式文案驱动：当前版本采用本地静态 JSON 驱动卦象解读，解耦设计以备后期平滑接入大模型接口。

## 非功能需求
- 无服务端依赖：当前版本零后台、零网络请求（纯离线可用）。
- 响应式设计：优先适配PC 端居中显示，同时兼容移动端浏览器（微信内置浏览器、手机 Safari/Chrome）。
