import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Debug: log cookies
	const cookies = event.cookies.getAll();
	console.log('[hooks] cookies:', cookies.map(c => c.name));

	// Run auth handle
	const response = await authHandle({ event, resolve });

	// Debug: check if auth was set
	console.log('[hooks] locals.auth exists:', typeof event.locals.auth);

	return response;
};
