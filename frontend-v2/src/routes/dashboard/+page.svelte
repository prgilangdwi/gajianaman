<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { TransactionType } from '$lib/supabase';
	import { Button, Separator } from '$lib/components/ui';
	import FAB from '$lib/components/FAB.svelte';
	import QuickAddTransaction from '$lib/components/QuickAddTransaction.svelte';

	let { data } = $props();

	let quickAddOpen = $state(false);
	let balanceHidden = $state(false);

	function formatCurrency(amount: number): string {
		if (balanceHidden) return '••••••••';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: data.session?.user?.currency ?? 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleLogout() {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/auth/signout';
		document.body.appendChild(form);
		form.submit();
	}
</script>

<div class="min-h-screen bg-background">
	<header class="bg-card border-b border-border px-4 py-3">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<div class="flex items-center gap-4">
				<h1 class="text-title text-primary">Gajian Aman</h1>
				<nav class="flex items-center gap-2 text-sm">
					<a href="/dashboard/accounts" class="text-muted-foreground hover:text-foreground">Akun</a>
				</nav>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">{data.session?.user?.name}</span>
				<Button variant="ghost" size="sm" onclick={handleLogout}>Logout</Button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-4">
		<!-- Total Balance Card -->
		<div class="bg-card rounded-xl p-6 shadow-sm">
			<div class="flex items-center justify-between mb-1">
				<p class="text-caption uppercase tracking-wide">Total Saldo</p>
				<button
					type="button"
					onclick={() => (balanceHidden = !balanceHidden)}
					class="text-muted-foreground hover:text-foreground p-1"
					aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
				>
					{#if balanceHidden}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
					{/if}
				</button>
			</div>
			<p class="text-3xl font-bold" class:text-primary={data.totalBalance >= 0} class:text-destructive={data.totalBalance < 0}>
				{formatCurrency(data.totalBalance ?? 0)}
			</p>
			<p class="text-sm text-muted-foreground mt-2">
				{data.accounts?.length ?? 0} akun
			</p>
		</div>

		<!-- Today's Transactions -->
		<div class="bg-card rounded-xl shadow-sm">
			<div class="px-4 py-3 border-b border-border">
				<h2 class="text-label text-foreground">Transaksi Hari Ini</h2>
			</div>

			{#if !data.transactions || data.transactions.length === 0}
				<div class="p-8 text-center text-muted-foreground">
					<p>Belum ada transaksi hari ini</p>
				</div>
			{:else}
				<ul class="divide-y divide-border">
					{#each data.transactions as tx (tx.id)}
						{@const isIncome = tx.type === TransactionType.INCOME}
						<li class="px-4 py-3 flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center text-lg {isIncome
									? 'bg-primary/10'
									: 'bg-destructive/10'}"
							>
								{tx.category?.icon ?? (isIncome ? '💰' : '💸')}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-foreground truncate">
									{tx.category?.name ?? 'Uncategorized'}
								</p>
								{#if tx.note}
									<p class="text-sm text-muted-foreground truncate">{tx.note}</p>
								{/if}
							</div>
							<div class="text-right">
								<p class="font-semibold" class:text-primary={isIncome} class:text-destructive={!isIncome}>
									{isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
								</p>
								<p class="text-caption">{formatTime(tx.created_at)}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- User Info (collapsed) -->
		<details class="bg-card rounded-xl shadow-sm">
			<summary class="px-4 py-3 cursor-pointer text-sm text-muted-foreground">Info Akun</summary>
			<div class="px-4 pb-4 space-y-2 text-sm">
				<div class="flex gap-2">
					<span class="text-muted-foreground">Email:</span>
					<span class="text-foreground">{data.session?.user?.email}</span>
				</div>
				<div class="flex gap-2">
					<span class="text-muted-foreground">Telegram:</span>
					{#if data.session?.user?.telegramId}
						<span class="text-primary">Terhubung ({data.session.user.telegramId})</span>
					{:else}
						<a href="/link-telegram" class="text-primary hover:underline">Hubungkan</a>
					{/if}
				</div>
			</div>
		</details>
	</main>

	<FAB onclick={() => (quickAddOpen = true)} />
	<QuickAddTransaction bind:open={quickAddOpen} onSuccess={() => invalidateAll()} />
</div>
