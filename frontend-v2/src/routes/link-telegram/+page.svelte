<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';

	let telegramId = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/link-telegram', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ telegramId: telegramId.trim() })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.message || 'Gagal menghubungkan Telegram';
				loading = false;
				return;
			}

			success = true;
			await invalidateAll();
			setTimeout(() => goto('/dashboard'), 1500);
		} catch {
			error = 'Terjadi kesalahan';
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-white rounded-xl p-6 shadow-sm">
		<h1 class="text-xl font-bold text-gray-900 mb-2">Hubungkan Telegram</h1>
		<p class="text-sm text-gray-600 mb-6">
			Masukkan Telegram ID untuk menghubungkan akun.
		</p>

		{#if success}
			<div class="text-center py-4">
				<p class="text-green-600 font-medium">Telegram berhasil terhubung!</p>
				<p class="text-sm text-gray-500">Mengalihkan ke dashboard...</p>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="telegramId" class="block text-sm font-medium text-gray-700 mb-1">
						Telegram ID
					</label>
					<input
						type="text"
						id="telegramId"
						bind:value={telegramId}
						placeholder="123456789"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
						required
					/>
				</div>

				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
				>
					{loading ? 'Menghubungkan...' : 'Hubungkan'}
				</button>
			</form>

			<a href="/dashboard" class="block mt-4 text-center text-sm text-gray-500 hover:text-gray-700">
				Lewati
			</a>
		{/if}
	</div>
</div>
