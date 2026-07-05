import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { findOrCreateUser } from '$lib/supabase.server';

const isProduction = process.env.NODE_ENV === 'production';
const useSecure = true; // Always use secure since we're on HTTPS

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Google],
	pages: {
		signIn: '/login'
	},
	debug: true,
	trustHost: true,
	cookies: {
		sessionToken: {
			name: useSecure ? '__Secure-authjs.session-token' : 'authjs.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: useSecure
			}
		},
		callbackUrl: {
			name: useSecure ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: useSecure
			}
		},
		csrfToken: {
			name: useSecure ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: useSecure
			}
		}
	},
	callbacks: {
		async signIn({ user, account }) {
			console.log('[auth:signIn] provider:', account?.provider, 'email:', user.email);
			if (account?.provider === 'google' && user.email) {
				try {
					const dbUser = await findOrCreateUser(user.email, user.name ?? null);
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
			console.log('[auth:jwt] called, account:', !!account, 'user:', !!user);
			if (account && user?.email) {
				try {
					const dbUser = await findOrCreateUser(user.email, user.name ?? null);
					token.dbUserId = dbUser.id;
					token.telegramId = dbUser.telegram_id;
					token.currency = dbUser.currency;
					token.email = user.email;
					console.log('[auth:jwt] token updated with dbUserId:', dbUser.id);
				} catch (err) {
					console.error('[auth:jwt] error:', err);
				}
			}
			return token;
		},
		async session({ session, token }) {
			console.log('[auth:session] token.dbUserId:', token.dbUserId);
			if (token.dbUserId) {
				session.user.id = token.dbUserId as string;
				session.user.telegramId = token.telegramId as string | null;
				session.user.currency = token.currency as string;
			}
			return session;
		}
	}
});
