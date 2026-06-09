export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export interface LunarDateInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  dayIndex: number;
}

const LUNAR_YEAR_DATA: Record<number, number> = {
  1900: 0x04bd8,
  1901: 0x04ae0,
  1902: 0x0a570,
  1903: 0x054d5,
  1904: 0x0d260,
  1905: 0x0d950,
  1906: 0x16554,
  1907: 0x056a0,
  1908: 0x09ad0,
  1909: 0x055d2,
  1910: 0x04ae0,
  1911: 0x0a5b6,
  1912: 0x0a4d0,
  1913: 0x0d250,
  1914: 0x1d255,
  1915: 0x0b540,
  1916: 0x0d6a0,
  1917: 0x0ada2,
  1918: 0x095b0,
  1919: 0x14977,
  1920: 0x04970,
  1921: 0x0a4b0,
  1922: 0x0b4b5,
  1923: 0x06a50,
  1924: 0x06d40,
  1925: 0x1ab54,
  1926: 0x02b60,
  1927: 0x09570,
  1928: 0x052f2,
  1929: 0x04970,
  1930: 0x06566,
  1931: 0x0d4a0,
  1932: 0x0ea50,
  1933: 0x06e95,
  1934: 0x05ad0,
  1935: 0x02b60,
  1936: 0x186e3,
  1937: 0x092e0,
  1938: 0x1c8d7,
  1939: 0x0c950,
  1940: 0x0d4a0,
  1941: 0x1d8a6,
  1942: 0x0b550,
  1943: 0x056a0,
  1944: 0x1a5b4,
  1945: 0x025d0,
  1946: 0x092d0,
  1947: 0x0d2b2,
  1948: 0x0a950,
  1949: 0x0b557,
  1950: 0x06ca0,
  1951: 0x0b550,
  1952: 0x15355,
  1953: 0x04da0,
  1954: 0x0a5d0,
  1955: 0x14573,
  1956: 0x052d0,
  1957: 0x0a9a8,
  1958: 0x0e950,
  1959: 0x06aa0,
  1960: 0x0aea6,
  1961: 0x0ab50,
  1962: 0x04b60,
  1963: 0x0aae4,
  1964: 0x0a570,
  1965: 0x05260,
  1966: 0x0f263,
  1967: 0x0d950,
  1968: 0x05b57,
  1969: 0x056a0,
  1970: 0x096d0,
  1971: 0x04dd5,
  1972: 0x04ad0,
  1973: 0x0a4d0,
  1974: 0x0d4d4,
  1975: 0x0d250,
  1976: 0x0d558,
  1977: 0x0b540,
  1978: 0x0b6a0,
  1979: 0x195a6,
  1980: 0x095b0,
  1981: 0x049b0,
  1982: 0x0a974,
  1983: 0x0a4b0,
  1984: 0x0b27a,
  1985: 0x06a50,
  1986: 0x06d40,
  1987: 0x0af46,
  1988: 0x0ab60,
  1989: 0x09570,
  1990: 0x04af5,
  1991: 0x04970,
  1992: 0x064b0,
  1993: 0x074a3,
  1994: 0x0ea50,
  1995: 0x06b58,
  1996: 0x055c0,
  1997: 0x0ab60,
  1998: 0x096d5,
  1999: 0x092e0,
  2000: 0x0c960,
  2001: 0x0d954,
  2002: 0x0d4a0,
  2003: 0x0da50,
  2004: 0x07552,
  2005: 0x056a0,
  2006: 0x0abb7,
  2007: 0x025d0,
  2008: 0x092d0,
  2009: 0x0cab5,
  2010: 0x0a950,
  2011: 0x0b4a0,
  2012: 0x0baa4,
  2013: 0x0ad50,
  2014: 0x055d9,
  2015: 0x04ba0,
  2016: 0x0a5b0,
  2017: 0x15176,
  2018: 0x052b0,
  2019: 0x0a930,
  2020: 0x07954,
  2021: 0x06aa0,
  2022: 0x0ad50,
  2023: 0x05b52,
  2024: 0x04b60,
  2025: 0x0a6e6,
  2026: 0x0a4e0,
  2027: 0x0d260,
  2028: 0x0ea65,
  2029: 0x0d530,
  2030: 0x05aa0,
  2031: 0x076a3,
  2032: 0x096d0,
  2033: 0x04afb,
  2034: 0x04ad0,
  2035: 0x0a4d0,
  2036: 0x1d0b6,
  2037: 0x0d250,
  2038: 0x0d520,
  2039: 0x0dd45,
  2040: 0x0b5a0,
  2041: 0x056d0,
  2042: 0x055b2,
  2043: 0x049b0,
  2044: 0x0a577,
  2045: 0x0a4b0,
  2046: 0x0aa50,
  2047: 0x1b255,
  2048: 0x06d20,
  2049: 0x0ada0,
  2050: 0x14b63,
};

const BASE_DATE_UTC = Date.UTC(1900, 0, 31);
const BASE_GANZHI_DAY_OFFSET = 40;

function getLunarYearCode(year: number): number {
  const code = LUNAR_YEAR_DATA[year];

  if (code === undefined) {
    throw new RangeError('当前纯数学农历算法仅支持 1900-2050 年。');
  }

  return code;
}

function getLeapMonth(year: number): number {
  return getLunarYearCode(year) & 0x0f;
}

function getLeapMonthDays(year: number): number {
  const leapMonth = getLeapMonth(year);

  if (leapMonth === 0) {
    return 0;
  }

  return (getLunarYearCode(year) & 0x10000) === 0 ? 29 : 30;
}

function getLunarMonthDays(year: number, month: number): number {
  return (getLunarYearCode(year) & (0x10000 >> month)) === 0 ? 29 : 30;
}

function getLunarYearDays(year: number): number {
  let days = 348;
  const code = getLunarYearCode(year);

  for (let mask = 0x8000; mask > 0x8; mask >>= 1) {
    if ((code & mask) !== 0) {
      days += 1;
    }
  }

  return days + getLeapMonthDays(year);
}

function getUtcStartOfDate(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getGanZhi(index: number): string {
  return `${HEAVENLY_STEMS[index % 10]}${EARTHLY_BRANCHES[index % 12]}`;
}

export function getLunarDateInfo(inputDate = new Date()): LunarDateInfo {
  let offsetDays = Math.floor((getUtcStartOfDate(inputDate) - BASE_DATE_UTC) / 86_400_000);

  if (offsetDays < 0) {
    throw new RangeError('当前纯数学农历算法仅支持 1900-2050 年。');
  }

  let lunarYear = 1900;
  let yearDays = getLunarYearDays(lunarYear);

  while (offsetDays >= yearDays) {
    offsetDays -= yearDays;
    lunarYear += 1;
    yearDays = getLunarYearDays(lunarYear);
  }

  const leapMonth = getLeapMonth(lunarYear);
  let lunarMonth = 1;
  let isLeapMonth = false;
  let monthDays = getLunarMonthDays(lunarYear, lunarMonth);

  while (offsetDays >= monthDays) {
    offsetDays -= monthDays;

    if (leapMonth === lunarMonth && !isLeapMonth) {
      isLeapMonth = true;
    } else {
      if (isLeapMonth) {
        isLeapMonth = false;
      }

      lunarMonth += 1;
    }

    monthDays = isLeapMonth ? getLeapMonthDays(lunarYear) : getLunarMonthDays(lunarYear, lunarMonth);
  }

  const lunarDay = offsetDays + 1;
  const gregorianYear = inputDate.getFullYear();
  const dayIndex = Math.floor((getUtcStartOfDate(inputDate) - BASE_DATE_UTC) / 86_400_000);
  const yearGanZhi = getGanZhi((lunarYear - 4) % 60);
  const monthGanZhi = getGanZhi((gregorianYear * 12 + inputDate.getMonth() + 12) % 60);
  const dayGanZhi = getGanZhi((dayIndex + BASE_GANZHI_DAY_OFFSET) % 60);

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    dayIndex,
  };
}
