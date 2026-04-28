import { adminMiddleware, authMiddleware } from "./middleware/auth";
import { loggingMiddleware } from "./middleware/logging";
import { t } from "./t";
import { env } from "@sycom/env/server";

export const router = t.router;
export const callerFactory = t.createCallerFactory;

const isDebugPerformance = env.DEBUG_PERFORMANCE;

const baseProcedure = isDebugPerformance ? t.procedure.use(loggingMiddleware) : t.procedure;

export const publicProcedure = baseProcedure;
export const protectedProcedure = baseProcedure.use(authMiddleware);
export const adminProcedure = baseProcedure.use(adminMiddleware);
