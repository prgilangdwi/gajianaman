import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import { env as dynamicEnv } from '$env/dynamic/private';
import type { Account } from '$lib/api/types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth?.();

	if (!session) {
		throw redirect(303, '/login');
	}

	const platformEnv = event.platform?.env;
	const jwtSecret = platformEnv?.SUPABASE_JWT_SECRET ?? dynamicEnv.SUPABASE_JWT_SECRET;
	const baseUrl = platformEnv?.API_BASE_URL ?? dynamicEnv.API_BASE_URL ?? 'http://localhost:8080';

	if (!jwtSecret) {
		console.error('SUPABASE_JWT_SECRET not configured');
		return { session, accounts: [], error: 'Configuration error' };
	}

	const token = await mintSupabaseJWT(session.user.id, jwtSecret);
	const client = createApiClient(baseUrl, token);

	const result = await client.get<Account[]>('/api/accounts');

	if (!result.success) {
		console.error('Failed to fetch accounts:', result.message);
		return { session, accounts: [], error: result.message };
	}

	return {
		session,
		accounts: result.data ?? []
	};
};
