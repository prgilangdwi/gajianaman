import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import { env as dynamicEnv } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const platformEnv = event.platform?.env;
	const jwtSecret = platformEnv?.SUPABASE_JWT_SECRET ?? dynamicEnv.SUPABASE_JWT_SECRET;
	const baseUrl = platformEnv?.API_BASE_URL ?? dynamicEnv.API_BASE_URL ?? 'http://localhost:8080';

	if (!jwtSecret) {
		throw error(500, 'SUPABASE_JWT_SECRET not configured');
	}

	const token = await mintSupabaseJWT(session.user.id, jwtSecret);
	const client = createApiClient(baseUrl, token);
	const result = await client.get<{ has_accounts: boolean }>('/api/accounts/check');

	if (!result.success) {
		throw error(400, result.message);
	}

	return json(result);
};
