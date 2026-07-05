<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		FixedExpenseCategory,
		FixedExpenseCategoryLabel,
		type FixedExpenseCategoryKey,
		type FixedExpenses
	} from '$lib/supabase';

	let { data, form } = $props();

	let monthlyIncome = $state(data.config?.monthly_income ?? 0);
	let fixedExpenses = $state<FixedExpenses>(
		(data.config?.fixed_expenses as FixedExpenses) ?? {}
	);
	const currency = $derived(data.session?.user?.currency ?? 'IDR');
	let saving = $state(false);

	const categories = Object.keys(FixedExpenseCategory) as FixedExpenseCategoryKey[];

	const totalFixed = $derived(
		Object.values(fixedExpenses).reduce((sum, val) => sum + (val ?? 0), 0)
	);

	const remaining = $derived(monthlyIncome - totalFixed);

	const percentCommitted = $derived(
		monthlyIncome > 0 ? (totalFixed / monthlyIncome) * 100 : 0
	);

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

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 px-4 py-3">
		<div class="max-w-4xl mx-auto flex items-center gap-4">
			<a href="/dashboard" class="text-gray-500 hover:text-gray-700" aria-label="Kembali ke dashboard">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<h1 class="text-xl font-bold text-gray-900">Anggaran Bulanan</h1>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-4 space-y-4">
		{#if form?.success}
			<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
				Konfigurasi berhasil disimpan
			</div>
		{/if}

		{#if form?.error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{form.error}
			</div>
		{/if}

		<!-- Hint -->
		<p class="text-sm text-gray-500 text-center">
			Semua field opsional.
		</p>

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
			<div class="bg-white rounded-xl shadow-sm px-4 py-3">
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium text-gray-700 flex-1">Pendapatan Bulanan</span>
					<span class="text-sm text-gray-500">Rp</span>
					<input
						type="number"
						bind:value={monthlyIncome}
						placeholder="-"
						class="w-36 px-3 py-2 border border-gray-200 rounded-xl text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
				</div>
			</div>

			<!-- Fixed Expenses Section -->
			<div class="bg-white rounded-xl shadow-sm">
				<div class="px-4 py-3 border-b border-gray-100">
					<h2 class="font-semibold text-gray-900">Pengeluaran Tetap</h2>
					<p class="text-sm text-gray-500">Biaya rutin yang tidak berubah setiap bulan</p>
				</div>

				<div class="px-4 py-3 space-y-4">
					{#each categories as category (category)}
						{@const amount = fixedExpenses[category] ?? 0}
						{@const pct = getPercentOfIncome(amount)}
						<div class="py-1.5 flex items-center gap-3">
							<label for={category} class="text-sm text-gray-700 flex-1 min-w-0">
								{FixedExpenseCategoryLabel[category]}
							</label>
							{#if pct}
								<span class="text-xs text-gray-400 w-10 text-right">{pct}</span>
							{/if}
							<span class="text-sm text-gray-500">Rp</span>
							<input
								type="number"
								id={category}
								value={amount || ''}
								oninput={(e) => handleExpenseInput(category, e)}
								placeholder="-"
								class="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Summary Section -->
			<div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
				<h2 class="font-semibold text-gray-900">Ringkasan</h2>

				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Total Pengeluaran Tetap</span>
						<span class="font-medium text-red-600">{formatCurrency(totalFixed)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Sisa untuk Pengeluaran Lain</span>
						<span class="font-medium" class:text-emerald-600={remaining >= 0} class:text-red-600={remaining < 0}>
							{formatCurrency(remaining)}
						</span>
					</div>
					{#if monthlyIncome > 0}
						<div class="pt-2">
							<div class="flex justify-between text-xs text-gray-500 mb-1">
								<span>Komitmen Bulanan</span>
								<span>{percentCommitted.toFixed(1)}%</span>
							</div>
							<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
								<div
									class="h-full transition-all duration-300"
									class:bg-emerald-500={percentCommitted <= 70}
									class:bg-yellow-500={percentCommitted > 70 && percentCommitted <= 90}
									class:bg-red-500={percentCommitted > 90}
									style="width: {Math.min(percentCommitted, 100)}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Save Button -->
			<button
				type="submit"
				disabled={saving}
				class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-colors"
			>
				{saving ? 'Menyimpan...' : 'Simpan'}
			</button>
		</form>
	</main>
</div>
