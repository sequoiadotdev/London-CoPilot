import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		OPENAI_API_KEY: z.string().min(1).optional(),
		GEMINI_API_KEY: z.string().min(1).optional(),
		BACKEND_URL: z.string().url().optional(),
		LOGO_DEV_TOKEN: z.string().min(1).optional(),
		LOGO_DEV_PUBLISHABLE_KEY: z.string().min(1).optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_API_URL: z.string().url(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		LOGO_DEV_TOKEN: process.env.LOGO_DEV_TOKEN,
		LOGO_DEV_PUBLISHABLE_KEY: process.env.LOGO_DEV_PUBLISHABLE_KEY,
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		BACKEND_URL: process.env.BACKEND_URL,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
