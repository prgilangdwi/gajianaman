<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/state';

	const session = $derived(page.data.session);
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 px-4 py-3">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<h1 class="text-xl font-bold text-emerald-600">Gajian Aman</h1>
			<div class="flex items-center gap-4">
				<span class="text-sm text-gray-600">{session?.user?.name}</span>
				<button
					onclick={() => signOut({ callbackUrl: '/' })}
					class="text-sm text-gray-500 hover:text-gray-700"
				>
					Logout
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-4">
		<div class="bg-white rounded-xl p-6 shadow-sm">
			<h2 class="text-lg font-semibold mb-4">Selamat datang, {session?.user?.name}!</h2>

			<dl class="space-y-2 text-sm">
				<div class="flex gap-2">
					<dt class="text-gray-500">Email:</dt>
					<dd>{session?.user?.email}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500">User ID:</dt>
					<dd class="font-mono text-xs">{session?.user?.id}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500">Telegram:</dt>
					<dd>
						{#if session?.user?.telegramId}
							<span class="text-green-600">Terhubung ({session.user.telegramId})</span>
						{:else}
							<a href="/link-telegram" class="text-emerald-600 hover:underline">
								Hubungkan Telegram
							</a>
						{/if}
					</dd>
				</div>
			</dl>
		</div>

		<div class="bg-white rounded-xl p-6 shadow-sm">
			<p class="text-gray-500 text-center">Fitur transaksi akan segera hadir.</p>
		</div>
	</main>
</div>
