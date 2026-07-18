import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export function createAdminClient(serviceKey: string) {
	return createClient(PUBLIC_SUPABASE_URL, serviceKey);
}

export async function findOrCreateUser(email: string, name: string | null, serviceKey: string) {
	const supabaseAdmin = createAdminClient(serviceKey);

	// Try to find existing user by email
	const { data: existing } = await supabaseAdmin
		.from('users')
		.select('id, email, name, telegram_id, currency')
		.eq('email', email)
		.is('deleted_at', null)
		.maybeSingle();

	if (existing) {
		return existing;
	}

	// Create new user
	const { data: created, error } = await supabaseAdmin
		.from('users')
		.insert({
			id: crypto.randomUUID(),
			email,
			name,
			currency: 'IDR'
		})
		.select('id, email, name, telegram_id, currency')
		.single();

	if (error) {
		console.error('Failed to create user:', error);
		throw error;
	}

	return created;
}
