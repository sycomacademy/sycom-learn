import { authMiddleware } from "./middleware/auth";
import { loggingMiddleware } from "./middleware/logging";
import { t } from "./t";

export const router = t.router;
export const callerFactory = t.createCallerFactory;

const isDebugPerformance = process.env.DEBUG_PERFORMANCE === "true";

const baseProcedure = isDebugPerformance ? t.procedure.use(loggingMiddleware) : t.procedure;

export const publicProcedure = baseProcedure;
export const protectedProcedure = baseProcedure.use(authMiddleware);
