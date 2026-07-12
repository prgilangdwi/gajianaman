import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import type { Account, UpdateAccountRequest } from '$lib/api/types';
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
	const { id } = event.params;
	const result = await client.get<Account>(`/api/accounts/${id}`);

	if (!result.success) {
		throw error(result.error === 'ACCOUNT_NOT_FOUND' ? 404 : 400, result.message);
	}

	return json(result);
};

export const PATCH: RequestHandler = async (event) => {
	const { client } = await getAuthAndClient(event);
	const { id } = event.params;
	const body = (await event.request.json()) as UpdateAccountRequest;
	const result = await client.patch<Account>(`/api/accounts/${id}`, body);

	if (!result.success) {
		throw error(result.error === 'ACCOUNT_NOT_FOUND' ? 404 : 400, result.message);
	}

	return json(result);
};

export const DELETE: RequestHandler = async (event) => {
	const { client } = await getAuthAndClient(event);
	const { id } = event.params;
	const result = await client.delete<null>(`/api/accounts/${id}`);

	if (!result.success) {
		const status = result.error === 'ACCOUNT_NOT_FOUND' ? 404 : 400;
		throw error(status, result.message);
	}

	return new Response(null, { status: 204 });
};
