import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_KEYS = ['DEEPSEEK_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const envPath = resolve(process.cwd(), '.env.local');

/**
 * 解析本地 .env.local 文件中的键值对。
 * 目的：Vercel CLI 拉取远端 development 变量时可能覆盖本地文件，本脚本用于启动前快速发现缺失的 AI 必需变量。
 */
function readLocalEnv() {
  if (!existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...valueParts] = line.split('=');
        return [key.trim(), valueParts.join('=').trim().replace(/^"|"$/g, '')];
      }),
  );
}

const envMap = readLocalEnv();
const missingKeys = REQUIRED_KEYS.filter((key) => !envMap[key]);

if (missingKeys.length > 0) {
  console.warn(`本地 AI 解卦环境变量缺失：${missingKeys.join(', ')}。请参考 .env.local.example 补充到 .env.local，或在 Vercel 项目 Development 环境中配置后重新 pull。`);
  process.exitCode = 1;
} else {
  console.log('AI 解卦环境变量检查通过。');
}
