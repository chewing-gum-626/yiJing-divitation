import type { QuestionType } from '@/constants/questionType';
import type { GuaOutcome } from '@/types/gua';

export interface GuaInterpretationText {
  outcome: GuaOutcome;
  text: string;
}

export interface GuaDefinition {
  id: string;
  name: string;
  upperTrigram: string;
  lowerTrigram: string;
  default: GuaInterpretationText;
  byQuestionType: Partial<Record<QuestionType, GuaInterpretationText>>;
}

interface TrigramDefinition {
  bits: string;
  name: string;
}

interface HexagramSeed {
  name: string;
  outcome: GuaOutcome;
}

export const TRIGRAMS_BY_BITS: Record<string, string> = {
  '111': '乾',
  '000': '坤',
  '100': '震',
  '010': '坎',
  '001': '艮',
  '011': '巽',
  '101': '离',
  '110': '兑',
};

const TRIGRAM_ORDER: TrigramDefinition[] = [
  { bits: '111', name: '乾' },
  { bits: '110', name: '兑' },
  { bits: '101', name: '离' },
  { bits: '100', name: '震' },
  { bits: '011', name: '巽' },
  { bits: '010', name: '坎' },
  { bits: '001', name: '艮' },
  { bits: '000', name: '坤' },
];

const HEXAGRAM_MATRIX: HexagramSeed[][] = [
  [
    { name: '乾为天', outcome: 'good' },
    { name: '天泽履', outcome: 'neutral' },
    { name: '天火同人', outcome: 'good' },
    { name: '天雷无妄', outcome: 'neutral' },
    { name: '天风姤', outcome: 'neutral' },
    { name: '天水讼', outcome: 'bad' },
    { name: '天山遁', outcome: 'neutral' },
    { name: '天地否', outcome: 'bad' },
  ],
  [
    { name: '泽天夬', outcome: 'neutral' },
    { name: '兑为泽', outcome: 'good' },
    { name: '泽火革', outcome: 'neutral' },
    { name: '泽雷随', outcome: 'good' },
    { name: '泽风大过', outcome: 'bad' },
    { name: '泽水困', outcome: 'bad' },
    { name: '泽山咸', outcome: 'good' },
    { name: '泽地萃', outcome: 'good' },
  ],
  [
    { name: '火天大有', outcome: 'good' },
    { name: '火泽睽', outcome: 'bad' },
    { name: '离为火', outcome: 'neutral' },
    { name: '火雷噬嗑', outcome: 'neutral' },
    { name: '火风鼎', outcome: 'good' },
    { name: '火水未济', outcome: 'neutral' },
    { name: '火山旅', outcome: 'neutral' },
    { name: '火地晋', outcome: 'good' },
  ],
  [
    { name: '雷天大壮', outcome: 'good' },
    { name: '雷泽归妹', outcome: 'neutral' },
    { name: '雷火丰', outcome: 'good' },
    { name: '震为雷', outcome: 'neutral' },
    { name: '雷风恒', outcome: 'good' },
    { name: '雷水解', outcome: 'good' },
    { name: '雷山小过', outcome: 'neutral' },
    { name: '雷地豫', outcome: 'good' },
  ],
  [
    { name: '风天小畜', outcome: 'neutral' },
    { name: '风泽中孚', outcome: 'good' },
    { name: '风火家人', outcome: 'good' },
    { name: '风雷益', outcome: 'good' },
    { name: '巽为风', outcome: 'neutral' },
    { name: '风水涣', outcome: 'neutral' },
    { name: '风山渐', outcome: 'good' },
    { name: '风地观', outcome: 'neutral' },
  ],
  [
    { name: '水天需', outcome: 'neutral' },
    { name: '水泽节', outcome: 'neutral' },
    { name: '水火既济', outcome: 'good' },
    { name: '水雷屯', outcome: 'bad' },
    { name: '水风井', outcome: 'neutral' },
    { name: '坎为水', outcome: 'bad' },
    { name: '水山蹇', outcome: 'bad' },
    { name: '水地比', outcome: 'good' },
  ],
  [
    { name: '山天大畜', outcome: 'good' },
    { name: '山泽损', outcome: 'neutral' },
    { name: '山火贲', outcome: 'neutral' },
    { name: '山雷颐', outcome: 'good' },
    { name: '山风蛊', outcome: 'bad' },
    { name: '山水蒙', outcome: 'neutral' },
    { name: '艮为山', outcome: 'neutral' },
    { name: '山地剥', outcome: 'bad' },
  ],
  [
    { name: '地天泰', outcome: 'good' },
    { name: '地泽临', outcome: 'good' },
    { name: '地火明夷', outcome: 'bad' },
    { name: '地雷复', outcome: 'good' },
    { name: '地风升', outcome: 'good' },
    { name: '地水师', outcome: 'neutral' },
    { name: '地山谦', outcome: 'good' },
    { name: '坤为地', outcome: 'neutral' },
  ],
];

const INTERPRETATION_TEXT_BY_OUTCOME: Record<GuaOutcome, string> = {
  good: '整体趋势偏顺，适合把握机会主动推进。保持清晰节奏，先做好关键一步，贵在稳中求进，不必急着一次到位。',
  neutral: '局势仍在变化中，宜先观察再行动。把目标拆小、稳住节奏，少做冲动决定，顺着现实条件推进更容易见效。',
  bad: '眼前阻力较多，容易出现反复和卡顿。先收拢资源、确认风险，不宜硬冲，等关键问题理清后再继续推进。',
};

const QUESTION_TYPE_TEXT: Partial<Record<QuestionType, Record<GuaOutcome, string>>> = {
  career: {
    good: '事业运势偏顺，适合争取机会或推进计划。注意用结果建立信任，少说多做，关键节点稳住就能打开局面。',
    neutral: '工作处在调整期，先理清责任和优先级。别急着做大动作，把沟通和执行节奏稳住，后续会更好推进。',
    bad: '事业推进可能遇到阻碍，尤其要注意流程和沟通。先补齐信息、降低返工风险，再决定是否加速行动。',
  },
  love: {
    good: '感情趋势较温和，适合主动表达善意。少一点猜测，多一点真实沟通，把相处细节做好，关系会更容易升温。',
    neutral: '感情里需要耐心观察，不必急着确认答案。先照顾彼此感受，减少试探和情绪化表达，关系会更稳定。',
    bad: '感情中容易有误会或拉扯，先别急着逼问结果。给彼此一点空间，把真实需求说清，比反复试探更有效。',
  },
  wealth: {
    good: '财运有积极信号，适合稳健推进收入计划。注意控制贪快心态，先确认风险和成本，再考虑扩大投入。',
    neutral: '财务状态宜稳守，适合整理预算和现金流。短期不宜冲动消费或冒进投资，把基本盘守住就是收获。',
    bad: '财务上要格外谨慎，避免被短期热度带动。先减少不必要支出，重要决策多做核对，别急着承担高风险。',
  },
  study: {
    good: '学习状态正在变好，适合集中突破重点。把任务拆成小块持续完成，少分心，多复盘，很快能看到进步。',
    neutral: '学习适合打基础和查漏补缺。别急着追求速度，先稳定计划和节奏，把薄弱环节补上，后面会更顺。',
    bad: '学习容易分心或遇到瓶颈，先降低任务难度。把最卡的知识点拆开处理，多练基础题，状态会慢慢恢复。',
  },
  general: {
    good: '整体势头偏顺，适合主动处理重要事项。保持目标清晰和行动克制，先把最关键的一步走稳，机会会更明显。',
    neutral: '当前变化未完全明朗，适合边观察边推进。少做冲动选择，多确认信息，把能掌控的小事先做好。',
    bad: '当前不宜硬冲，先停下来整理问题。把风险、资源和真实需求看清楚，再做下一步决定，会更稳妥。',
  },
};

function createQuestionTypeInterpretations(outcome: GuaOutcome): Partial<Record<QuestionType, GuaInterpretationText>> {
  return Object.fromEntries(
    Object.entries(QUESTION_TYPE_TEXT).map(([questionType, texts]) => [
      questionType,
      {
        outcome,
        text: texts[outcome],
      },
    ]),
  ) as Partial<Record<QuestionType, GuaInterpretationText>>;
}

function createGuaDefinition(lower: TrigramDefinition, upper: TrigramDefinition, seed: HexagramSeed): GuaDefinition {
  const id = `${lower.bits}${upper.bits}`;

  return {
    id,
    name: seed.name,
    upperTrigram: upper.name,
    lowerTrigram: lower.name,
    default: {
      outcome: seed.outcome,
      text: INTERPRETATION_TEXT_BY_OUTCOME[seed.outcome],
    },
    byQuestionType: createQuestionTypeInterpretations(seed.outcome),
  };
}

export const GUA_DEFINITIONS: Record<string, GuaDefinition> = Object.fromEntries(
  HEXAGRAM_MATRIX.flatMap((row, upperIndex) =>
    row.map((seed, lowerIndex) => {
      const upper = TRIGRAM_ORDER[upperIndex];
      const lower = TRIGRAM_ORDER[lowerIndex];
      const definition = createGuaDefinition(lower, upper, seed);

      return [definition.id, definition];
    }),
  ),
) as Record<string, GuaDefinition>;

export const FALLBACK_GUA_DEFINITION: GuaDefinition = {
  id: 'fallback',
  name: '未济之象',
  upperTrigram: '未定',
  lowerTrigram: '未定',
  default: {
    outcome: 'neutral',
    text: '此卦暂未配置专属文案，先按平象处理。当前重点是看清趋势、减少冲动，把可控的小步骤做好即可。',
  },
  byQuestionType: {},
};

export function getGuaDefinition(guaId: string): GuaDefinition {
  return GUA_DEFINITIONS[guaId] ?? FALLBACK_GUA_DEFINITION;
}
