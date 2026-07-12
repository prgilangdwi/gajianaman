import { toast } from 'svelte-sonner';
import type { ApiResponse } from './types';

export async function apiClient<T>(
	baseUrl: string,
	path: string,
	token: string,
	options?: RequestInit
): Promise<ApiResponse<T>> {
	const res = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...options?.headers
		}
	});

	if (!res.ok && res.status === 204) {
		return { success: true, message: 'No content' };
	}

	return res.json();
}

export function createApiClient(baseUrl: string, token: string) {
	return {
		get: <T>(path: string) => apiClient<T>(baseUrl, path, token),
		post: <T>(path: string, body: unknown) =>
			apiClient<T>(baseUrl, path, token, {
				method: 'POST',
				body: JSON.stringify(body)
			}),
		patch: <T>(path: string, body: unknown) =>
			apiClient<T>(baseUrl, path, token, {
				method: 'PATCH',
				body: JSON.stringify(body)
			}),
		delete: <T>(path: string) =>
			apiClient<T>(baseUrl, path, token, {
				method: 'DELETE'
			})
	};
}

export function handleApiResponse<T>(response: ApiResponse<T>): T | null {
	if (!response.success) {
		toast.error(response.error || response.message || 'Something went wrong');
		return null;
	}
	return response.data ?? null;
}
