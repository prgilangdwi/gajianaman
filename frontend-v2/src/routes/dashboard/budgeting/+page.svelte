<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		FixedExpenseCategory,
		FixedExpenseCategoryLabel,
		type FixedExpenseCategoryKey,
		type FixedExpenses
	} from '$lib/supabase';
	import { Button, Input, Label, Separator } from '$lib/components/ui';
	import { ChevronLeft } from 'lucide-svelte';

	let { data, form } = $props();

	let monthlyIncome = $state(data.config?.monthly_income ?? 0);
	let fixedExpenses = $state<FixedExpenses>((data.config?.fixed_expenses as FixedExpenses) ?? {});
	const currency = $derived(data.session?.user?.currency ?? 'IDR');
	let saving = $state(false);

	const categories = Object.keys(FixedExpenseCategory) as FixedExpenseCategoryKey[];

	const totalFixed = $derived(
		Object.values(fixedExpenses).reduce((sum, val) => sum + (val ?? 0), 0)
	);

	const remaining = $derived(monthlyIncome - totalFixed);

	const percentCommitted = $derived(monthlyIncome > 0 ? (totalFixed / monthlyIncome) * 100 : 0);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getPercentOfIncome(amount: number): string {
		if (!monthlyIncome || monthlyIncome <= 0) return '';
		const pct = (amount / monthlyIncome) * 100;
		return `${pct.toFixed(1)}%`;
	}

	function handleExpenseInput(category: FixedExpenseCategoryKey, e: Event) {
		const value = Number((e.target as HTMLInputElement).value) || 0;
		if (value > 0) {
			fixedExpenses[category] = value;
		} else {
			delete fixedExpenses[category];
		}
		fixedExpenses = { ...fixedExpenses };
	}
</script>

<div class="min-h-screen bg-background">
	<header class="bg-card border-b border-border px-4 py-3">
		<div class="max-w-4xl mx-auto flex items-center gap-4">
			<a
				href="/dashboard"
				class="text-muted-foreground hover:text-foreground transition-colors"
				aria-label="Kembali ke dashboard"
			>
				<ChevronLeft class="size-5" />
			</a>
			<h1 class="text-title text-foreground">Anggaran Bulanan</h1>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-4">
		{#if form?.success}
			<div class="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl">
				Konfigurasi berhasil disimpan
			</div>
		{/if}

		{#if form?.error}
			<div
				class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl"
			>
				{form.error}
			</div>
		{/if}

		<p class="text-caption text-center">Semua field opsional.</p>

		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="monthly_income" value={monthlyIncome} />
			<input type="hidden" name="fixed_expenses" value={JSON.stringify(fixedExpenses)} />

			<!-- Income Section -->
			<div class="bg-card rounded-xl shadow-sm px-4 py-3">
				<div class="flex items-center gap-3">
					<Label class="text-label flex-1">Pendapatan Bulanan</Label>
					<span class="text-sm text-muted-foreground">Rp</span>
					<Input
						type="number"
						bind:value={monthlyIncome}
						placeholder="-"
						class="w-36 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
				</div>
			</div>

			<!-- Fixed Expenses Section -->
			<div class="bg-card rounded-xl shadow-sm">
				<div class="px-4 py-3 border-b border-border">
					<h2 class="text-label text-foreground">Pengeluaran Tetap</h2>
					<p class="text-caption">Biaya rutin yang tidak berubah setiap bulan</p>
				</div>

				<div class="px-4 py-3 space-y-4">
					{#each categories as category (category)}
						{@const amount = fixedExpenses[category] ?? 0}
						{@const pct = getPercentOfIncome(amount)}
						<div class="py-1.5 flex items-center gap-3">
							<Label for={category} class="text-sm flex-1 min-w-0">
								{FixedExpenseCategoryLabel[category]}
							</Label>
							{#if pct}
								<span class="text-xs text-muted-foreground w-10 text-right">{pct}</span>
							{/if}
							<span class="text-sm text-muted-foreground">Rp</span>
							<Input
								type="number"
								id={category}
								value={amount || ''}
								oninput={(e) => handleExpenseInput(category, e)}
								placeholder="-"
								class="w-28 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Summary Section -->
			<div class="bg-card rounded-xl shadow-sm p-4 space-y-3">
				<h2 class="text-label text-foreground">Ringkasan</h2>

				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Total Pengeluaran Tetap</span>
						<span class="font-medium text-destructive">{formatCurrency(totalFixed)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Sisa untuk Pengeluaran Lain</span>
						<span
							class="font-medium"
							class:text-primary={remaining >= 0}
							class:text-destructive={remaining < 0}
						>
							{formatCurrency(remaining)}
						</span>
					</div>
					{#if monthlyIncome > 0}
						<Separator class="my-3" />
						<div>
							<div class="flex justify-between text-caption mb-1">
								<span>Komitmen Bulanan</span>
								<span>{percentCommitted.toFixed(1)}%</span>
							</div>
							<div class="h-2 bg-muted rounded-full overflow-hidden">
								<div
									class="h-full transition-all duration-normal"
									class:bg-primary={percentCommitted <= 70}
									class:bg-chart-2={percentCommitted > 70 && percentCommitted <= 90}
									class:bg-destructive={percentCommitted > 90}
									style="width: {Math.min(percentCommitted, 100)}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Save Button -->
			<Button type="submit" disabled={saving} isLoading={saving} class="w-full" size="lg">
				{saving ? 'Menyimpan...' : 'Simpan'}
			</Button>
		</form>
	</main>
</div>
