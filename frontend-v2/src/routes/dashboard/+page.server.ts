import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase, TransactionType } from '$lib/supabase';
import { createApiClient } from '$lib/api/client';
import { mintSupabaseJWT } from '$lib/api/jwt';
import { env as dynamicEnv } from '$env/dynamic/private';
import type { Account } from '$lib/api/types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth?.();

	if (!session) {
		throw redirect(303, '/login');
	}

	const today = new Date().toISOString().split('T')[0];

	// Fetch accounts from Go API
	const platformEnv = event.platform?.env;
	const jwtSecret = platformEnv?.SUPABASE_JWT_SECRET ?? dynamicEnv.SUPABASE_JWT_SECRET;
	const baseUrl = platformEnv?.API_BASE_URL ?? dynamicEnv.API_BASE_URL ?? 'http://localhost:8080';

	let accounts: Account[] = [];
	if (jwtSecret) {
		const token = await mintSupabaseJWT(session.user.id, jwtSecret);
		const client = createApiClient(baseUrl, token);
		const result = await client.get<Account[]>('/api/accounts');
		if (result.success && result.data) {
			accounts = result.data;
		}
	}

	// Calculate total balance across all accounts
	const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

	// Fetch today's transactions
	const { data: transactions, error } = await supabase
		.from('transactions')
		.select(`
			id,
			amount,
			type,
			note,
			date,
			created_at,
			category:categories(id, name, icon)
		`)
		.eq('user_id', session.user.id)
		.eq('date', today)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to fetch transactions:', error);
	}

	return {
		session,
		transactions: transactions ?? [],
		totalBalance,
		accounts,
		today
	};
};
