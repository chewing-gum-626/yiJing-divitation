
# Role & Context
你是一个精通 Vue3、TypeScript、Tailwind CSS 和 GSAP 动画的前端专家。
请根据以下给出的业务背景、技术栈约束和代码实现蓝图，在当前项目中实现一个全新的、极简现代风的“对话式/引导式手动起卦”功能（即方案 A 纯聊天流版）。

---

## 1. 业务需求描述 & 核心流程
用户点击首页的“手动起卦”按钮后，跳转或弹出对话框进入本全屏/居中页面。整体采用类似 ChatGPT 的单栏纵向聊天信息流。
- [步骤 1 - 开放提问]: 系统率先发出气泡问：“你好，请问你今天想要占卜什么问题？”，底部显示文本输入框。用户输入具体问题并点击发送。
- [步骤 2 - 仪式引导]: 输入完后，输入框消失。系统发出指引卡片提示用户净手、合掌摇硬币（字=阳、背=阴），并附带[我已准备好，开始记录]按钮。
- [步骤 3 - 六轮交互录入]: 点击准备好后，进入 6 次摇卦循环。系统逐一问“请掷出第 X 次，结果是？”，底部转化为 4 个硬币组合大按钮（两字一背、一字两背、三个背、三个字）。用户每点一次，系统往聊天流追加一条用户气泡，并紧接着发出下一次询问。
- [步骤 4 - 最终解卦]: 第 6 次（上爻）完成后，底部面板转为锁定状态。聊天流最后滚出一个包含年轻化图形爻象、卦名、吉凶标签、40-60字白话简明解读的“终极解卦卡片”。

---

## 2. 技术栈约束
- 框架: Vue 3 (Setup 组合式语法) + TypeScript
- 样式: Tailwind CSS (现代极简明亮风格)
- 状态管理: Pinia
- 动画效果: GSAP (实现新消息滑入时的平滑滚动与渐显微动画)

---

## 3. 请为我生成并创建以下三个核心文件

### 文件一：常量与逻辑推导
路径：`src/constants/gua.ts`
【要求】：
1. 定义硬币组合的联合类型：`CoinCombination = '3_HEADS' | '2_HEADS_1_TAIL' | '1_HEAD_2_TAILS' | '3_TAILS'`。
2. 定义爻位结构体接口：`YaoInfo`，包含 `type`（少阳/少阴/老阳/老阴）、`value`（6/7/8/9）、`isChanging`（是否为动爻）、`name`。
3. 导出一个映射函数 `deriveYao(combination: CoinCombination): YaoInfo`。
   - 3个字 -> 老阴 (6, 动爻)
   - 2字1背 -> 少阳 (7, 无动爻)
   - 1字2背 -> 少阴 (8, 无动爻)
   - 3个背 -> 老阳 (9, 动爻)

### 文件二：Pinia 状态管理
路径：`src/stores/manualGuaStore.ts`
【要求】：
1. 定义多态消息接口 `Message`，包含 `id`, `sender` ('system' | 'user'), `type` ('text' | 'guide' | 'coin_selector' | 'result_card'), `content`, `payload`。
2. 管理当前步骤状态：`currentStep` ('ask_question' | 'showing_guide' | 'rolling' | 'finished')。
3. 编写核心 Action：`initSession()`（重置会话）、`submitQuestion()`（提交问题并触发引导）、`startRolling()`（开启第一爻循环）、`recordCoinResult()`（记录当前爻并判定是否满 6 次。若满 6 次，则自动触发查表或生成模拟解卦卡片数据。注意：解卦包含卦名、吉凶、40-60字解读文案）。

### 文件三：主视图组件
路径：`src/views/ManualDivination.vue`
【要求】：
1. 页面整体布局限定在 `max-w-2xl mx-auto`，PC 端居中、移动端自适应全屏。
2. 对话流区域具备 `overflow-y-auto` 和 `scroll-smooth`。监听消息数组长度，当有新消息加入时，自动计算 `scrollTop` 确保平滑触底。
3. 引入 `gsap`，在新消息挂载时，针对最新滑入的气泡节点执行淡入上移（`opacity: 0, y: 15` 到 `opacity: 1, y: 0`）的丝滑动效。
4. 使用 `v-if` 对 `Message.type` 进行分发渲染：
   - 文本气泡：系统居左，用户居右（主色调）。
   - 仪式指引卡片：带有一个清晰的流程说明。
   - 硬币选择器：**加入防重复点击限制**（利用 `index === store.messages.length - 1` 判定，只有最新一条系统提问下的 4 个硬币组合按钮允许点击，历史按钮置灰或隐藏）。
   - 最终解卦卡片：渐变深色科技风或极简高级风。内含现代图形化六爻看板（用圆角方块或粗线条表示阳爻与阴爻，不用死板的传统横线，动爻用高亮小圆点标记）。
5. 底部固定工具栏根据 `currentStep` 动态切换输入框或展示“一事不二占”的锁定提示。

---

## 4. 编码规范
1. 保持所有 TypeScript 类型声明完整，严禁使用 `any`。
2. 样式完全采用 Tailwind CSS 类名，避免编写原生 CSS。
3. 代码结构要清晰、易读、可维护，并直接输出完整可用的代码。

————————————————————————————————————
# Role & Task
你是一个顶尖的 Vue3 + TypeScript 全栈前端专家。请根据以下产品需求文档（PRD）和技术设计，实现“系统模拟起卦”这一核心功能模块。

## 1. 核心需求与规则回顾
1. 概率逻辑：严格模拟 3 枚铜钱投掷（1:3:3:1 概率）。3个字=6(老阴, 1/8)；2字1面=7(少阳, 3/8)；1字2面=8(少阴, 3/8)；3个面=9(老阳, 1/8)。
2. 防刷机制：点击“系统模拟起卦”按钮的瞬间，必须往 localStorage 写入 `{ isDivining: true, timestamp: Date.now(), questionType: 'xxx' }` 的临时状态。若动画中途刷新，在应用挂载时检测到该状态则自动扣除当日次数并清除状态。
3. 扣费时机：点击瞬间锁定状态，动画完全结束、准备跳转至结果页的最后一刻，正式执行次数扣除 (`count - 1`)。
4. 动效设计：使用 GSAP 动效，让 6 行爻位像进度条/叠积木一样，从第一爻（最底部）到第六爻（最顶部）依次由下往上、带有些许弹性地渐显亮起（stagger 间隔 300ms）。
5. UI 规范：采用传统的阴阳爻横线（少阳为长横线，少阴为中间留空的双短线）。静态爻（7, 8）用深色，动爻（6, 9）用高亮主题色（如橙色）且右侧配有 Lucide 的 `RefreshCw` 旋转图标。

## 2. 待实现/修改的文件清单
请严格按照项目既定的目录结构，依次实现或完善以下核心文件。在编写代码前，请通盘考虑类型安全与状态流转。

### 步骤一：定义 TypeScript 类型
请在 `src/types/gua.ts` 中创建或补全以下定义：
- `YaoType`: 6 | 7 | 8 | 9
- `YaoInfo`: 包含 position(1-6), value, isChanging, symbol('yin'|'yang')
- `DivinationResult`: 包含 questionType, timestamp, originalGuaId, changedGuaId, displayYaos

### 步骤二：编写工具函数与业务服务
1. `src/utils/random.ts`: 
   - 实现 `generateOneYao(): YaoType`，内部通过循环3次模拟硬币正反面计算分值（0代表字计2分，1代表面计3分）。
   - 实现 `generateSixYaos(): YaoInfo[]`，生成从下往上（1 到 6）的六爻数组。
2. `src/stores/dailyStore.ts` & `guaStore.ts`:
   - 在 `dailyStore` 中处理每日次数限制（3次）、`localStorage` 同步。
   - 提供 `checkAndHandleCrash()` 方法，用于检测非正常退出的惩罚性扣费逻辑。
   - 在 `guaStore` 中暂存当前生成的卦象结果，供结果页消费。

### 步骤三：编写前端起卦组件
实现 `src/views/CoinDivination.vue`:
1. 包含问题类型切换栏（通用/事业/感情/财运/学业）。当切换类型后，如果当前已有生成的卦象，清空当前结果；如果不点击起卦，保持原有状态。
2. 摇卦区放置一个垂直容器（利用 Flex 布局反转 `flex-col-reverse`，确保数组首项在最底部渲染）。
3. 完美结合 Tailwind CSS 绘制阴阳爻。
4. 编写点击事件 `startDivination`：
   - 检查次数 -> 写入 `isDivining` 临时状态 -> 生成数据 -> 调用 GSAP 对类名为 `.yao-line` 的元素进行从下往上的交错显示（stagger: 0.3, ease: 'back.out'）。
   - 动画 `onComplete` 回调中：真正扣除次数 -> 清除临时状态 -> 路由推入 `/result`。

### 步骤四：全局拦截处理
在 `src/App.vue` 的 `onMounted` 阶段：
- 调用 `dailyStore.checkAndHandleCrash()`。检查用户是否在刚才的动画中途刷新了网页，如果是，执行扣费并提示用户。

## 3. 编码规范
- 坚持组合式 API (`<script setup lang="ts">`)。
- 所有 UI 样式使用 Tailwind CSS，保持现代极简明亮风。
- 图标组件全部引用 `lucide-vue-next`。
- 代码要具备极高的健壮性，不要省略任何类型断言或异常边界处理。

请一步步为我生成这些文件的完整代码。
=========================================

# Role & Task
你是一个精通 Vue3、TypeScript 和 Tailwind CSS 的资深前端开发专家。现在我们需要完善当前项目中“每日一卦（DailyGua.vue）”的核心生成逻辑。

目前项目的“每日一卦”需要从“随机起卦”改为**“基于当前日期的历法值日卦”**。请根据以下需求，修改或创建相关的 `utils/date.ts`、`constants/gua.ts`、`services/guaService.ts` 和 `views/DailyGua.vue`。

---

## 1. 核心算法与逻辑需求

### A. 公历转干支日算法 (utils/date.ts)
由于项目是纯前端无后端架构，请在 `utils/date.ts` 中实现一个轻量级的公历转干支纪日（六十甲子）的算法（可以使用蔡勒公式的变体，或内置一个基准日进行时间差计算，确保准确无误）。
- 输入：当前系统日期的 `Date` 对象。
- 输出：当日的干支日字符串（例如："甲子日"、"乙丑日"）。

### B. 干支日映射六十四卦逻辑 (services/guaService.ts)
根据传统值日卦（或六十甲子配卦）逻辑，我们需要将 60 个干支日映射到 64 卦中（由于 60 和 64 不等，请采用以下简化闭环映射算法）：
1. 建立一个包含 64 卦 ID 或索引的固定顺序数组（可按照《易经》通行本顺序或京房十六卦顺序，请在代码中注释说明）。
2. 计算当前干支日在六十甲子中的索引 `Index_gz` (0 到 59)。
3. 使用映射公式确定对应的卦象索引：`Index_gua = Index_gz % 64`（或者由你提供一套固定的 60 对应 64 卦的 Mapping 字典，确保每一天算出的卦是固定且唯一的）。

### C. 每日宜忌与基础解释生成
在 `constants/gua.ts` 或独立的 JSON 配置文件中，扩展原有的卦象数据结构，为每个卦象补充基于“日运”的属性：
- **基础解释**：结合问题类型（通用/事业/感情/财运/学业），提供 40~60 字的年轻化、现代口语化白话解读。
- **当日宜/忌**：根据当日卦象的特质，提取 2-3 个具体的“宜”和“忌”（例如：乾卦——宜：提案、晨跑；忌：频繁跳槽、优柔寡断）。

---

## 2. 代码实现规范与文件重构

### 📄 规范 1：扩展数据类型定义 (`types/gua.ts` 或 `types/result.ts`)
确保包含以下接口定义，并兼容现有的吉凶标签：
```typescript
export interface DailyGuaInterpretation {
  guaId: number;
  guaName: string;
  ganzhiDay: string; // 当日干支
  luckLevel: '吉' | '平' | '凶';
  suit: string[]; // 宜
  avoid: string[]; // 忌
  interpretations: {
    [key in 'universal' | 'career' | 'emotion' | 'wealth' | 'education']: string; // 40-60字解读
  };
}

### 规范 2：核心服务层逻辑 (services/guaService.ts)
实现一个函数 getDailyGua(questionType: string): DailyGuaInterpretation：
1. 获取当前系统日期。
2. 计算出 ganzhiDay。
3. 匹配对应的卦象，并根据用户选择的 questionType（通用/事业/感情/财运/学业）组装出最终的结果。
4. 注意：每日一卦无动爻，直接取本卦卦象即可。

### 规范 3：视图层与本地缓存对接 (views/DailyGua.vue & stores/dailyStore.ts)
1. 当用户进入 DailyGua.vue 并选择问题类型点击“起卦”后：
    * 触发 getDailyGua 计算结果。
    * 将结果存入 localStorage（通过 dailyStore.ts），并标记 daily_one_used = true，写入 daily_one_date = 当前日期。
2. 如果用户当日已占卜：
    * 页面加载时自动读取缓存 daily_one_result，直接展示结果。
    * 按钮置灰，并提示“今日已展现天机，请明日再来”。
3. UI 保持现代极简明亮风，使用 Tailwind CSS 排版“宜 / 忌”板块（建议采用亮绿色/亮红色小标签或方块化设计，视觉上要年轻化）。
## 3. 交付要求
1. 请一步步给出需要修改或新建的文件的完整 TypeScript 代码。
2. 确保算法部分不需要依赖任何外部 npm 农历库（如 lunar-javascript），完全采用原生 JS/TS 纯数学逻辑实现，保证无轻量化包体积。
3. 解读文案和宜忌数据可以先用 2-3 个卦象作为 Mock 示例，但映射逻辑和数据结构必须完整可用。




------------------------------
系统起卦业务流程实现
# Role & Task
你是一个顶尖的 Vue3 + TypeScript + Node.js 专家。请根据以下设计，为我的易经起卦项目实现基于 AI (DeepSeek-V3) 的流式动态解卦功能。

## 1. 技术栈与架构
- **前端**：Vue3 + TypeScript + Pinia + Tailwind CSS + Vue Router
- **后端 (Serverless)**：Vercel Edge Functions (Node.js)
- **安全防刷**：Upstash Redis (`@upstash/ratelimit`) 基于用户真实 IP 进行云端频率限制
- **大模型**：DeepSeek-V3 API (支持 Stream 传输)

## 2. 待实现/修改的文件清单与核心逻辑

### 步骤一：在云函数端建立 64 卦精简数据表
请在 `api/helpers/guaData.ts` 中建立一个静态映射对象，包含 64 卦的卦名、卦辞及白话简解。用于在云函数内部根据前端传来的 `originalGuaId` 和 `changedGuaId` 拼接周易原文，防止前端篡改。

### 步骤二：实现 Vercel Edge Function 中转服务
创建边缘函数 `api/divine.ts` (基于 Vercel Edge 运行时)：
1. **IP 限流**：通过 `request.headers.get('x-forwarded-for')` 获取用户真实 IP。利用 `@upstash/ratelimit` 限制单个 IP 每日最多调用 4 次 AI 解卦。若超限，返回 429 状态码。
2. **组装 Prompt**：接收前端传来的参数：`question`, `questionType`, `originalGuaId`, `changedGuaId`。从本地数据表查出对应的易经原文。
3. **拼装 System Prompt**：
   "你是一位精通周易占卜与现代心理疏导的专家。请根据以下易经本卦和变卦原文，结合用户占问的问题类型（${questionType}）和具体问题（${question}），给出定制化的白话解答。
   【硬性格式要求】：你的输出必须严格以 `[STATUS:吉]`、`[STATUS:平]` 或 `[STATUS:凶]` 作为第一行开头（基于卦象和问题自主判定），然后换行输出具体的解卦文本。不要有任何多余的解释。"
4. **流式转发**：使用 `fetch` 呼叫 DeepSeek-V3 的 `/v1/chat/completions` 接口，设置 `stream: true`。将 DeepSeek 的流式响应通过 `ReadableStream` 实时原样透传回前端。

### 步骤三：建立前端 Pinia Store 管理流状态
创建 `src/stores/aiStore.ts`：
- 定义状态：`aiResult: string`, `guaStatus: string` ('吉'|'平'|'凶'), `isStreaming: boolean`。
- 提供 `fetchAIResponse(payload)` 异步方法：
  - 使用 `window.fetch` 请求 `/api/divine`。
  - 获取 `response.body.getReader()`，通过 `TextDecoder` 循环读取流数据（Chunk）。
  - 在读取第一块 Chunk 时，利用正则表达式 `^\[STATUS:(吉|平|凶)\]` 截取并赋值给 `guaStatus`，剩余的文本流式追加到 `aiResult` 中。

### 步骤四：改造起卦组件实现「异步并行」
修改 `src/views/CoinDivination.vue` 的 `startDivination` 逻辑：
1. 点击按钮的瞬间，**一边**执行 1.8 秒的 GSAP 爻位叠积木逐行亮起动画。
2. **同一时间，在后台异步**调用 `aiStore.fetchAIResponse` 向云函数发起 AI 请求。
3. 当 1.8 秒的 GSAP 动画结束时，执行 `router.push({ name: 'Result' })` 跳转到结果页。

### 步骤五：改造结果页呈现流式打字机
修改 `src/views/Result.vue`：
- 从 `aiStore` 中解构出 `aiResult`、`guaStatus` 和 `isStreaming`。
- 页面顶部/侧边根据 `guaStatus`（吉/平/凶）渲染不同颜色的漂亮 Tailwind 徽章。
- 内容区直接绑定 `aiResult`。由于 Store 里的 `aiResult` 随着流式接收在动态追加，界面上会自动呈现极其流畅的字一个个蹦出来的打字机效果。

## 3. 编码规范
- 严格遵循 Vue3 `<script setup lang="ts">` 语法。
- 确保 Edge Function 符合 Vercel Edge Runtime 规范（不使用 Node.js 原生 fs/path 模块，全部用纯 JS 标准 API）。
- 完善错误处理：若 AI 报错或被限流，前端需给出优雅的年轻化 Toast 提示。

请一步一步为我生成完整的后端云函数代码和前端改造方案。

---------------------------------------------

请基于我之前已经实现的「Vue3 + TypeScript + Tailwind + Pinia + GSAP」手动起卦功能，只优化最终解卦卡片部分，按照以下需求进行升级改造：
需求总述
在原有六爻记录完成后，替换原来的模拟解卦逻辑，改为：
调用 DeepSeek-V3 API（/v1/chat/completions） 生成真正结合用户问题的解卦内容
根据卦象吉凶（吉 / 平 / 凶）自动切换三种完全不同的卡片风格
保持原有动画、聊天流、交互逻辑不变，只升级结果卡片

一、API 调用要求
使用 fetch 调用 https://api.deepseek.com/v1/chat/completions
请求头携带 Authorization: Bearer {API_KEY}（留空让用户自行填写）
请求体结构：
model: "deepseek-chat"
messages: 按以下 system prompt 构造
temperature: 0.7
stream: false（不使用流式）
等待接口返回完整结果后再渲染最终解卦卡片
加载期间显示简约加载动画
System Prompt 模板如下：
你是一位专业易经解卦师，语言现代、简洁、吉利、不迷信，80～100字。
用户问题：{{question}}
占得卦象：{{guaName}}
卦性：{{luckType}}（吉/平/凶）
请结合问题与卦意给出简明运势指引，语气温和专业。
二、吉凶三色卡片风格（必须严格实现）
1. 吉卦
主色调：青碧、暖橙、鎏金渐变
背景：明亮、朝阳、祥云、平地感
卡片：亮边、轻微金色光晕、圆角柔和
文字：白色 / 浅金，清晰明亮
爻条：青绿 / 金色，动爻高亮
2. 平卦
主色调：米赭、浅灰、素雅中性
背景：远山、静水、草木淡影
卡片：哑光质感、低对比
文字：深灰，温和稳重
爻条：灰棕系，简约中性
3. 凶卦
主色调：墨黑、暗靛蓝、冷灰
背景：乌云、深水、断崖暗纹
卡片：暗压纹质感、冷色阴影
文字：淡白 / 冷灰，高对比但不刺眼
爻条：深青 / 黑灰，动爻用冷色标记
三、代码修改范围
src/stores/manualGuaStore.ts
新增 luckType: 'ji' | 'ping' | 'xiong' 状态
新增 userQuestion 存储用户问题
新增异步 Action fetchGuaInterpretation()
六爻完成后调用 DeepSeek API 获取解读
根据卦象逻辑判断吉凶（可简单模拟或后续扩展）
src/views/ManualDivination.vue
重构最终解卦卡片，使用动态 class 根据 luckType 切换风格
吉 / 平 / 凶三套完整 Tailwind 样式
保持六爻图形化展示：阳爻实线、阴爻虚线、动爻标记
加载状态优化
保持 GSAP 入场动画不变
类型补充
新增 LuckType 联合类型
接口返回结构严格定义 TypeScript interface
不允许 any
四、风格与动画约束
全程只使用 Tailwind CSS，不写额外 CSS
卡片渐变、光晕、纹理均用 Tailwind 实现
新卡片依然使用 GSAP 淡入上滑动画
聊天流滚动逻辑保持不变
底部 “一事不二占” 提示保持不变
五、交付要求
请直接输出完整可替换的代码文件，包括：
升级后的 manualGuaStore.ts
升级后的解卦卡片部分（完整组件代码）
所有新增类型定义
接口调用代码（含 fetch + headers + body）
保持结构清晰、类型完整、可直接运行。





