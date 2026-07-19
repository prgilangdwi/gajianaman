import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import type { LedgerEntry } from '$lib/api/types';
import { env as dynamicEnv } from '$env/dynamic/private';

async function getAuthAndClient(event: Parameters<RequestHandler>[0]) {
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
	return { client: createApiClient(baseUrl, token), session };
}

export const GET: RequestHandler = async (event) => {
	const { client } = await getAuthAndClient(event);

	const url = event.url;
	const params = new URLSearchParams();

	const accountId = url.searchParams.get('account_id');
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');
	const page = url.searchParams.get('page');
	const limit = url.searchParams.get('limit');

	if (accountId) params.set('account_id', accountId);
	if (startDate) params.set('start_date', startDate);
	if (endDate) params.set('end_date', endDate);
	if (page) params.set('page', page);
	if (limit) params.set('limit', limit);

	const queryString = params.toString();
	const endpoint = queryString ? `/api/ledger?${queryString}` : '/api/ledger';

	const result = await client.get<LedgerEntry[]>(endpoint);

	if (!result.success) {
		throw error(400, result.message);
	}

	return json(result);
};
