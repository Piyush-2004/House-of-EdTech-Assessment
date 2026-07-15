import { prisma } from "./db";

/**
 * Checks if a user is within their rate limit for a specific action.
 * If allowed, logs the action and returns the status.
 *
 * @param userId - The ID of the user performing the action.
 * @param action - The action identifier (e.g. "gemini_call").
 * @param maxRequests - Maximum requests allowed in the window. Default is 20.
 * @param durationHours - Duration of the rolling window in hours. Default is 1.
 */
export async function checkRateLimit(
  userId: string,
  action: string = "gemini_call",
  maxRequests: number = 20,
  durationHours: number = 1
): Promise<{ allowed: boolean; remaining: number; resetInMinutes: number }> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - durationHours * 60 * 60 * 1000);

    // Count recent actions in the database
    const count = await prisma.rateLimit.count({
      where: {
        userId,
        action,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    // Clean up older records for this user asynchronously to optimize database size
    prisma.rateLimit
      .deleteMany({
        where: {
          userId,
          action,
          timestamp: {
            lt: windowStart,
          },
        },
      })
      .catch((e) => console.error("Rate limit database cleanup error:", e));

    if (count >= maxRequests) {
      // Find the oldest record in the window to calculate reset time
      const oldestRecord = await prisma.rateLimit.findFirst({
        where: {
          userId,
          action,
          timestamp: {
            gte: windowStart,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      let resetInMinutes = 60;
      if (oldestRecord) {
        const resetTime = new Date(oldestRecord.timestamp.getTime() + durationHours * 60 * 60 * 1000);
        resetInMinutes = Math.max(1, Math.ceil((resetTime.getTime() - now.getTime()) / (60 * 1000)));
      }

      return {
        allowed: false,
        remaining: 0,
        resetInMinutes,
      };
    }

    // Log the current action
    await prisma.rateLimit.create({
      data: {
        userId,
        action,
        timestamp: now,
      },
    });

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetInMinutes: 0,
    };
  } catch (error) {
    console.error("Rate limiter check failure, allowing fallback request:", error);
    // If rate limiter fails, allow the call as a fallback so user is not blocked
    return {
      allowed: true,
      remaining: 1,
      resetInMinutes: 0,
    };
  }
}
