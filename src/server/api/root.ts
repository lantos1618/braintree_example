import { createTRPCRouter } from "~/server/api/trpc";
import { licenseRouter } from "~/server/api/routers/license";
import { paypalRouter } from "./routers/paypal";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  license: licenseRouter,
  paypal: paypalRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
