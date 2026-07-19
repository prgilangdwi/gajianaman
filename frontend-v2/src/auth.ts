import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import {
	AUTH_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	SUPABASE_SERVICE_KEY
} from '$env/static/private';

export const { handle, signIn, signOut } = SvelteKitAuth(async (event) => {
	const env = event.platform?.env;
	const secret = env?.AUTH_SECRET ?? AUTH_SECRET;
	const googleId = env?.AUTH_GOOGLE_ID ?? AUTH_GOOGLE_ID;
	const googleSecret = env?.AUTH_GOOGLE_SECRET ?? AUTH_GOOGLE_SECRET;
	const serviceKey = env?.SUPABASE_SERVICE_KEY ?? SUPABASE_SERVICE_KEY;

	const isSecure = event.url.protocol === 'https:';

	return {
		providers: [
			Google({
				clientId: googleId,
				clientSecret: googleSecret
			})
		],
		secret,
		trustHost: true,
		useSecureCookies: isSecure,
		pages: {
			signIn: '/login'
		},
		callbacks: {
			async signIn({ user, account }) {
				if (account?.provider === 'google' && user.email) {
					const { findOrCreateUser } = await import('$lib/supabase.server');
					try {
						const dbUser = await findOrCreateUser(user.email, user.name ?? null, serviceKey);
						console.log('[auth:signIn] DB user created/found:', dbUser?.id);
						return true;
					} catch (err) {
						console.error('[auth:signIn] error:', err);
						return false;
					}
				}
				return true;
			},
			async jwt({ token, user, account }) {
				if (account && user?.email) {
					const { findOrCreateUser } = await import('$lib/supabase.server');
					try {
						const dbUser = await findOrCreateUser(user.email, user.name ?? null, serviceKey);
						token.dbUserId = dbUser.id;
						token.telegramId = dbUser.telegram_id;
						token.currency = dbUser.currency;
						token.email = user.email;
					} catch (err) {
						console.error('[auth:jwt] error:', err);
					}
				}
				return token;
			},
			async session({ session, token }) {
				if (token.dbUserId) {
					session.user.id = token.dbUserId as string;
					session.user.telegramId = token.telegramId as string | null;
					session.user.currency = token.currency as string;
				}
				return session;
			}
		}
	};
});
