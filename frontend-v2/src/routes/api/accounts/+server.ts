import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import type { Account, CreateAccountRequest } from '$lib/api/types';
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
	const result = await client.get<Account[]>('/api/accounts');

	if (!result.success) {
		throw error(400, result.message);
	}

	return json(result);
};

export const POST: RequestHandler = async (event) => {
	const { client } = await getAuthAndClient(event);
	const body = (await event.request.json()) as CreateAccountRequest;
	const result = await client.post<Account>('/api/accounts', body);

	if (!result.success) {
		throw error(400, result.message);
	}

	return json(result, { status: 201 });
};
