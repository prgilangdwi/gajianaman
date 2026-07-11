<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { Button, Input, Label, Field, FieldError } from '$lib/components/ui';

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

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-card rounded-xl p-6 shadow-sm">
		<h1 class="text-title text-foreground mb-2">Hubungkan Telegram</h1>
		<p class="text-sm text-muted-foreground mb-6">
			Masukkan Telegram ID untuk menghubungkan akun.
		</p>

		{#if success}
			<div class="text-center py-4">
				<p class="text-primary font-medium">Telegram berhasil terhubung!</p>
				<p class="text-sm text-muted-foreground">Mengalihkan ke dashboard...</p>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4">
				<Field invalid={!!error}>
					<Label for="telegramId">Telegram ID</Label>
					<Input
						type="text"
						id="telegramId"
						bind:value={telegramId}
						placeholder="123456789"
						required
					/>
					{#if error}
						<FieldError>{error}</FieldError>
					{/if}
				</Field>

				<Button type="submit" disabled={loading} isLoading={loading} class="w-full">
					{loading ? 'Menghubungkan...' : 'Hubungkan'}
				</Button>
			</form>

			<a
				href="/dashboard"
				class="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				Lewati
			</a>
		{/if}
	</div>
</div>
