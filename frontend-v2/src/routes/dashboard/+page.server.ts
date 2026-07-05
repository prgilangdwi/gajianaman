import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase, TransactionType } from '$lib/supabase';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth?.();

	if (!session) {
		throw redirect(303, '/login');
	}

	const today = new Date().toISOString().split('T')[0];

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

	// Calculate totals
	const totals = (transactions ?? []).reduce(
		(acc, t) => {
			if (t.type === TransactionType.INCOME) {
				acc.income += t.amount;
			} else if (t.type === TransactionType.EXPENSE) {
				acc.expense += t.amount;
			}
			return acc;
		},
		{ income: 0, expense: 0 }
	);

	return {
		session,
		transactions: transactions ?? [],
		totals,
		today
	};
};
