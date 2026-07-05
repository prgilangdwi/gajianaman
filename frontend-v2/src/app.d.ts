import type { Session } from '@auth/sveltekit';

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			email: string;
			name?: string | null;
			image?: string | null;
			telegramId?: string | null;
			currency?: string;
		};
	}
}

declare global {
	namespace App {
		interface Locals {
			auth: () => Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
		interface Platform {
			env: {
				AUTH_SECRET: string;
				AUTH_GOOGLE_ID: string;
				AUTH_GOOGLE_SECRET: string;
				SUPABASE_SERVICE_KEY: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
