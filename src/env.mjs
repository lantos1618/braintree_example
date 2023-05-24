import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    BRAINTREE_PRIVATE_KEY: z.string().min(1),
    BRAINTREE_MERCHANT_ID: z.string().min(1),
    EMAIL_HOST: z.string().min(1),
    EMAIL_USER: z.string().min(1).email(),
    EMAIL_PASSWORD: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
    NEXT_PUBLIC_BRAINTREE_PUBLIC_KEY: z.string().min(1),

  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BRAINTREE_PRIVATE_KEY: process.env.BRAINTREE_PRIVATE_KEY,
    BRAINTREE_MERCHANT_ID: process.env.BRAINTREE_MERCHANT_ID,
    NEXT_PUBLIC_BRAINTREE_PUBLIC_KEY: process.env.NEXT_PUBLIC_BRAINTREE_PUBLIC_KEY,

    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
});
