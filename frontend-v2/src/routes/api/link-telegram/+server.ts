import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/supabase.server';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const session = await locals.auth?.();

	if (!session?.user?.id) {
		return error(401, { message: 'Unauthorized' });
	}

	const serviceKey = platform?.env?.SUPABASE_SERVICE_KEY ?? SUPABASE_SERVICE_KEY;
	const supabaseAdmin = createAdminClient(serviceKey);
	const { telegramId } = await request.json();

	if (!telegramId || typeof telegramId !== 'string') {
		return error(400, { message: 'Telegram ID diperlukan' });
	}

	// Check if telegram_id is already used by another user
	const { data: existing } = await supabaseAdmin
		.from('users')
		.select('id')
		.eq('telegram_id', telegramId)
		.is('deleted_at', null)
		.maybeSingle();

	if (existing && existing.id !== session.user.id) {
		return error(400, { message: 'Telegram ID sudah digunakan akun lain' });
	}

	// Update user's telegram_id
	const { error: updateError } = await supabaseAdmin
		.from('users')
		.update({ telegram_id: telegramId })
		.eq('id', session.user.id);

	if (updateError) {
		console.error('Failed to link telegram:', updateError);
		return error(500, { message: 'Gagal menghubungkan Telegram' });
	}

	return json({ success: true });
};
