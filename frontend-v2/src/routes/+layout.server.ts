import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth?.();
	console.log('[layout] session:', session ? `user=${session.user?.email}` : 'null');
	return { session };
};
