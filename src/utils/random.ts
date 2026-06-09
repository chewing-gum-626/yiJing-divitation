import type { YaoInfo, YaoType } from '@/types/gua';

export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tossCoin(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1;
}

export function generateOneYao(): YaoType {
  let score = 0;

  for (let i = 0; i < 3; i += 1) {
    score += tossCoin() === 0 ? 2 : 3;
  }

  if (score !== 6 && score !== 7 && score !== 8 && score !== 9) {
    throw new Error(`Invalid yao score generated: ${score}`);
  }

  return score;
}

export function generateSixYaos(): YaoInfo[] {
  return Array.from({ length: 6 }, (_, index) => {
    const value = generateOneYao();

    return {
      position: (index + 1) as YaoInfo['position'],
      value,
      isChanging: value === 6 || value === 9,
      symbol: value === 7 || value === 9 ? 'yang' : 'yin',
    };
  });
}
