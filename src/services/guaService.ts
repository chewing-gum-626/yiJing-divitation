import { getGuaDefinition, TRIGRAMS_BY_BITS } from '@/constants/guaInterpretations';
import type { QuestionType } from '@/constants/questionType';
import type { DivinationResult, GuaLine, GuaResult, LineKind, YaoInfo } from '@/types/gua';
import { getLunarDateInfo, type LunarDateInfo } from '@/utils/lunar';
import { generateSixYaos } from '@/utils/random';

export interface DailyGuaSeed {
  lunar: LunarDateInfo;
  seed: number;
}

/**
 * 将六个爻位转换为 6 位卦象 ID。
 * useChangedLines 为 true 时会把老阴/老阳动爻翻转，用于计算变卦；false 时保留本卦原始阴阳。
 */
function createGuaId(yaos: YaoInfo[], useChangedLines: boolean): string {
  return yaos
    .map((yao) => {
      const symbol = useChangedLines && yao.isChanging ? (yao.symbol === 'yang' ? 'yin' : 'yang') : yao.symbol;
      return symbol === 'yang' ? '1' : '0';
    })
    .join('');
}

/**
 * 创建确定性伪随机数生成器。
 * 每日一卦需要“同一天同一设备结果稳定”，因此不能直接用 Math.random；
 * seed 由农历日期和日序号推导，LCG 算法用于生成可复现的 0-1 随机序列。
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

/**
 * 使用 seeded random 模拟三枚铜钱，生成一个爻值。
 * 每枚铜钱按 2 或 3 计分，三枚相加只会得到 6/7/8/9，分别对应老阴/少阳/少阴/老阳。
 */
function generateSeededYao(random: () => number): YaoInfo['value'] {
  let score = 0;

  for (let i = 0; i < 3; i += 1) {
    score += random() < 0.5 ? 2 : 3;
  }

  return score as YaoInfo['value'];
}

function createLinesFromYaos(yaos: YaoInfo[]): GuaLine[] {
  return yaos.map((yao) => ({
    kind: yao.symbol,
    moving: yao.isChanging,
  }));
}

function getTrigramName(bits: string): string {
  return TRIGRAMS_BY_BITS[bits] ?? '未知';
}

/**
 * 生成统一的占卜结果结构。
 * questionType 用于后续文案选择，yaos 是由铜钱算法或每日算法生成的六爻，timestamp 用于缓存和结果排序。
 */
export function createDivinationResult(questionType: QuestionType, yaos: YaoInfo[], timestamp = Date.now()): DivinationResult {
  const originalGuaId = createGuaId(yaos, false);
  const changedGuaId = createGuaId(yaos, true);

  return {
    questionType,
    timestamp,
    originalGuaId,
    changedGuaId,
    displayYaos: yaos,
  };
}

export function generateCoinDivinationResult(questionType: QuestionType): DivinationResult {
  return createDivinationResult(questionType, generateSixYaos());
}

/**
 * 为每日一卦构建日期种子。
 * lunar 提供农历年月日和闰月信息，seed 把这些日期因素混合成数字，确保跨日自动变化、同日保持稳定。
 */
export function createDailyGuaSeed(date = new Date()): DailyGuaSeed {
  const lunar = getLunarDateInfo(date);
  const seed =
    lunar.lunarYear * 10_000 +
    lunar.lunarMonth * 100 +
    lunar.lunarDay +
    lunar.dayIndex * 13 +
    (lunar.isLeapMonth ? 97 : 0);

  return {
    lunar,
    seed,
  };
}

/**
 * 生成每日一卦结果。
 * 与普通铜钱起卦不同，此处使用日期种子驱动伪随机序列，目的是让“今日一卦”具备每日唯一且可缓存的特性。
 */
export function generateDailyDivinationResult(questionType: QuestionType, date = new Date()): DivinationResult {
  const { seed } = createDailyGuaSeed(date);
  const random = createSeededRandom(seed);
  const yaos: YaoInfo[] = Array.from({ length: 6 }, (_, index) => {
    const value = generateSeededYao(random);
    const symbol: LineKind = value === 7 || value === 9 ? 'yang' : 'yin';

    return {
      position: (index + 1) as YaoInfo['position'],
      value,
      isChanging: value === 6 || value === 9,
      symbol,
    };
  });

  return createDivinationResult(questionType, yaos, date.getTime());
}

/**
 * 将原始占卜结果解析为结果页可直接展示的视图模型。
 * 这里完成卦名、吉凶、上下卦、基础解读和爻线数据的组装，避免页面组件理解底层 0/1 卦 ID 规则。
 */
export function resolveGuaResult(result: DivinationResult): GuaResult {
  const definition = getGuaDefinition(result.originalGuaId);
  const text = definition.byQuestionType[result.questionType] ?? definition.default;
  const lowerBits = result.originalGuaId.slice(0, 3);
  const upperBits = result.originalGuaId.slice(3, 6);

  return {
    id: result.originalGuaId,
    name: definition.name,
    outcome: text.outcome,
    interpretation: text.text,
    lines: createLinesFromYaos(result.displayYaos),
    createdAt: new Date(result.timestamp).toISOString(),
    questionType: result.questionType,
    originalGuaId: result.originalGuaId,
    changedGuaId: result.changedGuaId,
    upperTrigram: definition.upperTrigram === '未定' ? getTrigramName(upperBits) : definition.upperTrigram,
    lowerTrigram: definition.lowerTrigram === '未定' ? getTrigramName(lowerBits) : definition.lowerTrigram,
  };
}

export function generateGuaResult(questionType: QuestionType = 'general'): GuaResult {
  return resolveGuaResult(generateCoinDivinationResult(questionType));
}
