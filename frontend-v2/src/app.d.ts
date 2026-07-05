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
	}
}

export {};
