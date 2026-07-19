<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Separator, Skeleton } from '$lib/components/ui';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui';
	import FAB from '$lib/components/FAB.svelte';
	import QuickAddTransaction from '$lib/components/QuickAddTransaction.svelte';
	import type { Account, LedgerEntry, ApiResponse } from '$lib/api/types';

	let { data } = $props();

	const accountTypes: Record<number, string> = {
		0: 'Cash',
		1: 'Bank',
		2: 'E-Wallet',
		3: 'Credit Card',
		4: 'Investment'
	};

	const accountTypeColors: Record<number, string> = {
		0: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
		3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
		4: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
	};

	let selectedAccountId = $state<string | null>(null);
	let ledgerEntries = $state<LedgerEntry[]>([]);
	let ledgerLoading = $state(false);
	let ledgerError = $state<string | null>(null);
	let ledgerPagination = $state<{ page: number; limit: number; total: number } | null>(null);
	let quickAddOpen = $state(false);

	let startDate = $state('');
	let endDate = $state('');
	let currentPage = $state(1);
	const pageSize = 20;

	const selectedAccount = $derived(
		data.accounts.find((a: Account) => a.id === selectedAccountId) ?? null
	);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: data.session?.user?.currency ?? 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function fetchLedger() {
		if (!selectedAccountId) return;

		ledgerLoading = true;
		ledgerError = null;

		const params = new URLSearchParams();
		params.set('account_id', selectedAccountId);
		params.set('page', currentPage.toString());
		params.set('limit', pageSize.toString());
		if (startDate) params.set('start_date', startDate);
		if (endDate) params.set('end_date', endDate);

		try {
			const res = await fetch(`/api/ledger?${params.toString()}`);
			const result: ApiResponse<LedgerEntry[]> = await res.json();

			if (!result.success) {
				ledgerError = result.message;
				ledgerEntries = [];
			} else {
				ledgerEntries = result.data ?? [];
				ledgerPagination = result.pagination ?? null;
			}
		} catch (err) {
			ledgerError = 'Failed to fetch ledger entries';
			ledgerEntries = [];
		} finally {
			ledgerLoading = false;
		}
	}

	function selectAccount(accountId: string) {
		if (selectedAccountId === accountId) {
			selectedAccountId = null;
			ledgerEntries = [];
			ledgerPagination = null;
			ledgerLoading = false;
		} else {
			selectedAccountId = accountId;
			currentPage = 1;
			ledgerEntries = [];
			ledgerLoading = true;
			fetchLedger();
		}
	}

	function applyFilters() {
		currentPage = 1;
		fetchLedger();
	}

	function goToPage(page: number) {
		currentPage = page;
		fetchLedger();
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
				<a href="/dashboard" class="text-title text-primary hover:opacity-80">Gajian Aman</a>
				<span class="text-muted-foreground">/</span>
				<span class="text-foreground font-medium">Akun</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">{data.session?.user?.name}</span>
				<Button variant="ghost" size="sm" onclick={handleLogout}>Logout</Button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-6">
		<!-- Accounts Grid -->
		<section>
			<h2 class="text-lg font-semibold mb-4">Akun Keuangan</h2>

			{#if data.error}
				<div class="bg-destructive/10 text-destructive rounded-lg p-4">
					{data.error}
				</div>
			{:else if data.accounts.length === 0}
				<div class="bg-card rounded-xl p-8 text-center text-muted-foreground">
					<p>Belum ada akun. Buat akun baru untuk mulai mencatat transaksi.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.accounts as account (account.id)}
						{@const isSelected = selectedAccountId === account.id}
						{@const isLoadingThis = isSelected && ledgerLoading}
						<button
							type="button"
							onclick={() => selectAccount(account.id)}
							class="text-left w-full"
						>
							<Card
								class="transition-all hover:shadow-md cursor-pointer {isSelected
									? 'ring-2 ring-primary'
									: ''} {isLoadingThis ? 'opacity-75' : ''}"
							>
								<CardHeader class="pb-2">
									<div class="flex items-center justify-between">
										<CardTitle class="text-base">{account.name}</CardTitle>
										<div class="flex items-center gap-2">
											{#if isLoadingThis}
												<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
											{/if}
											{#if account.is_default}
												<Badge variant="secondary" class="text-xs">Default</Badge>
											{/if}
										</div>
									</div>
									<Badge class={accountTypeColors[account.type] ?? 'bg-gray-100 text-gray-800'}>
										{accountTypes[account.type] ?? 'Unknown'}
									</Badge>
								</CardHeader>
								<CardContent>
									<p class="text-xl font-bold text-primary">
										{formatCurrency(account.balance)}
									</p>
								</CardContent>
							</Card>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Ledger Section -->
		{#if selectedAccount}
			<Separator />

			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold">
						Riwayat Ledger: {selectedAccount.name}
					</h2>
					<Button variant="ghost" size="sm" onclick={() => selectAccount(selectedAccount.id)}>
						Tutup
					</Button>
				</div>

				<!-- Date Filters -->
				<div class="flex flex-wrap gap-4 mb-4">
					<div class="flex items-center gap-2">
						<label for="start-date" class="text-sm text-muted-foreground">Dari:</label>
						<input
							type="date"
							id="start-date"
							bind:value={startDate}
							class="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
						/>
					</div>
					<div class="flex items-center gap-2">
						<label for="end-date" class="text-sm text-muted-foreground">Sampai:</label>
						<input
							type="date"
							id="end-date"
							bind:value={endDate}
							class="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
						/>
					</div>
					<Button variant="outline" size="sm" onclick={applyFilters}>Terapkan</Button>
				</div>

				<!-- Ledger Table -->
				{#if ledgerLoading}
					<div class="space-y-2">
						{#each Array(5) as _}
							<Skeleton class="h-12 w-full" />
						{/each}
					</div>
				{:else if ledgerError}
					<div class="bg-destructive/10 text-destructive rounded-lg p-4">
						{ledgerError}
					</div>
				{:else if ledgerEntries.length === 0}
					<div class="bg-card rounded-xl p-8 text-center text-muted-foreground">
						<p>Belum ada entri ledger untuk akun ini.</p>
					</div>
				{:else}
					<div class="bg-card rounded-xl shadow-sm overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tanggal</TableHead>
									<TableHead>Tipe</TableHead>
									<TableHead class="text-right">Jumlah</TableHead>
									<TableHead class="text-right">Saldo Setelah</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each ledgerEntries as entry (entry.id)}
									<TableRow>
										<TableCell class="text-sm">{formatDate(entry.created_at)}</TableCell>
										<TableCell>
											<Badge
												class={entry.type === 'credit'
													? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
													: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
											>
												{entry.type === 'credit' ? 'Masuk' : 'Keluar'}
											</Badge>
										</TableCell>
										<TableCell class="text-right font-medium">
											<span class={entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
												{entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
											</span>
										</TableCell>
										<TableCell class="text-right">{formatCurrency(entry.ending_balance)}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>

					<!-- Pagination -->
					{#if ledgerPagination && ledgerPagination.total > pageSize}
						{@const totalPages = Math.ceil(ledgerPagination.total / pageSize)}
						<div class="flex items-center justify-center gap-2 mt-4">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage <= 1}
								onclick={() => goToPage(currentPage - 1)}
							>
								Sebelumnya
							</Button>
							<span class="text-sm text-muted-foreground">
								Halaman {currentPage} dari {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage >= totalPages}
								onclick={() => goToPage(currentPage + 1)}
							>
								Selanjutnya
							</Button>
						</div>
					{/if}
				{/if}
			</section>
		{/if}
	</main>

	<FAB onclick={() => (quickAddOpen = true)} />
	<QuickAddTransaction bind:open={quickAddOpen} onSuccess={() => invalidateAll()} />
</div>
