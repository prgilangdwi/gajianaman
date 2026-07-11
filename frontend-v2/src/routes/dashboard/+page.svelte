<script lang="ts">
	import { TransactionType } from '$lib/supabase';
	import { Button, Separator } from '$lib/components/ui';

	let { data } = $props();

	const net = $derived((data.totals?.income ?? 0) - (data.totals?.expense ?? 0));

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: data.session?.user?.currency ?? 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount / 100);
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
			<h1 class="text-title text-primary">Gajian Aman</h1>
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">{data.session?.user?.name}</span>
				<Button variant="ghost" size="sm" onclick={handleLogout}>Logout</Button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-4">
		<!-- Summary Cards -->
		<div class="grid grid-cols-3 gap-3">
			<div class="bg-card rounded-xl p-4 shadow-sm">
				<p class="text-caption uppercase tracking-wide">Pemasukan</p>
				<p class="text-lg font-semibold text-primary">
					{formatCurrency(data.totals?.income ?? 0)}
				</p>
			</div>
			<div class="bg-card rounded-xl p-4 shadow-sm">
				<p class="text-caption uppercase tracking-wide">Pengeluaran</p>
				<p class="text-lg font-semibold text-destructive">
					{formatCurrency(data.totals?.expense ?? 0)}
				</p>
			</div>
			<div class="bg-card rounded-xl p-4 shadow-sm">
				<p class="text-caption uppercase tracking-wide">Net</p>
				<p class="text-lg font-semibold" class:text-primary={net >= 0} class:text-destructive={net < 0}>
					{formatCurrency(net)}
				</p>
			</div>
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
</div>
