import { Prisma } from "@prisma/client";

/**
 * 可重试的 Prisma 错误码：
 * - P2034 事务冲突/序列化失败（重试安全）
 * - P2024 连接池超时、P1001/P1002/P1017 连接类瞬时错误
 */
const RETRYABLE_CODES = new Set(["P2034", "P2024", "P1001", "P1002", "P1017"]);

const MAX_ATTEMPTS = 3;

/**
 * 只重试传入的这一个事务函数。
 *
 * 用途：本所账单批次写库失败时，仅重试本所这一批账单事务。
 * 财务已登记的到账流水在 payment 模块的独立事务中写入，
 * 不进入本事务，因此账单重试/回滚都不会波及到账流水。
 */
export async function withTransactionRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(error.code);
      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw lastError;
}
