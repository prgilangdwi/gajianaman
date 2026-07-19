import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase, type FixedExpenses } from '$lib/supabase';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth?.();

	if (!session) {
		throw redirect(303, '/login');
	}

	const { data: config, error } = await supabase
		.from('user_config')
		.select('*')
		.eq('user_id', session.user.id)
		.is('deleted_at', null)
		.single();

	if (error && error.code !== 'PGRST116') {
		console.error('Failed to fetch user config:', error);
	}

	return {
		session,
		config: config ?? null
	};
};

export const actions: Actions = {
	save: async (event) => {
		const session = await event.locals.auth?.();
		if (!session) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const monthlyIncome = formData.get('monthly_income');
		const fixedExpensesRaw = formData.get('fixed_expenses');

		let fixedExpenses: FixedExpenses = {};
		try {
			fixedExpenses = fixedExpensesRaw ? JSON.parse(fixedExpensesRaw as string) : {};
		} catch {
			return fail(400, { error: 'Invalid fixed expenses format' });
		}

		const { error } = await supabase
			.from('user_config')
			.upsert(
				{
					user_id: session.user.id,
					monthly_income: monthlyIncome ? Number(monthlyIncome) : null,
					fixed_expenses: fixedExpenses
				},
				{ onConflict: 'user_id' }
			);

		if (error) {
			console.error('Failed to save user config:', error);
			return fail(500, { error: 'Failed to save configuration' });
		}

		return { success: true };
	}
};
