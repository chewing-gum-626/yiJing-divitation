import { getGuaDefinition, TRIGRAMS_BY_BITS } from '@/constants/guaInterpretations';
import type { QuestionType } from '@/constants/questionType';
import type { DivinationResult, GuaLine, GuaResult, LineKind, YaoInfo } from '@/types/gua';
import { getLunarDateInfo, type LunarDateInfo } from '@/utils/lunar';
import { generateSixYaos } from '@/utils/random';

export interface DailyGuaSeed {
  lunar: LunarDateInfo;
  seed: number;
}

function createGuaId(yaos: YaoInfo[], useChangedLines: boolean): string {
  return yaos
    .map((yao) => {
      const symbol = useChangedLines && yao.isChanging ? (yao.symbol === 'yang' ? 'yin' : 'yang') : yao.symbol;
      return symbol === 'yang' ? '1' : '0';
    })
    .join('');
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

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
