import { authMiddleware } from "./middleware/auth";
import { loggingMiddleware } from "./middleware/logging";
import { t } from "./t";

export const router = t.router;
export const callerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(authMiddleware);
