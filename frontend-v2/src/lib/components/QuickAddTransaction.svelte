<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		Button,
		Input,
		Label,
		Select,
		SelectTrigger,
		SelectValue,
		SelectContent,
		SelectItem,
		ToggleGroup,
		ToggleGroupItem
	} from '$lib/components/ui';
	import CalculatorInput from './CalculatorInput.svelte';
	import { TransactionType, AccountType, AccountTypeLabels } from '$lib/supabase';
	import type { Account, Category, CreateTransactionRequest } from '$lib/api/types';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), onOpenChange, onSuccess }: Props = $props();

	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let loading = $state(false);
	let submitting = $state(false);
	let mode = $state<'transaction' | 'create-account'>('transaction');

	// Transaction form
	let amount = $state(0);
	let txType = $state<string[]>([String(TransactionType.EXPENSE)]);
	let accountId = $state<string>('');
	let category = $state<string>('');
	let note = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);

	// Account form
	let accountName = $state('');
	let accountType = $state<string>(String(AccountType.CASH));

	const selectedTxType = $derived(txType[0] ?? String(TransactionType.EXPENSE));

	$effect(() => {
		if (open) {
			if (accounts.length === 0) fetchAccounts();
			if (categories.length === 0) fetchCategories();
		}
	});

	async function fetchAccounts() {
		loading = true;
		try {
			const res = await fetch('/api/accounts');
			const data = await res.json();
			if (data.success && data.data) {
				accounts = data.data;
				if (accounts.length === 0) {
					mode = 'create-account';
				} else {
					mode = 'transaction';
					accountId = accounts[0]?.id ?? '';
				}
			}
		} catch (e) {
			toast.error('Failed to load accounts');
		} finally {
			loading = false;
		}
	}

	async function fetchCategories() {
		try {
			const res = await fetch('/api/categories');
			const data = await res.json();
			if (data.success && data.data) {
				categories = data.data;
			}
		} catch (e) {
			toast.error('Failed to load categories');
		}
	}

	async function createAccount() {
		if (!accountName.trim()) {
			toast.error('Account name is required');
			return;
		}
		submitting = true;
		try {
			const res = await fetch('/api/accounts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: accountName,
					type: Number(accountType),
					balance: 0,
					currency: 'IDR'
				})
			});
			const data = await res.json();
			if (data.success) {
				toast.success('Account created');
				accounts = [...accounts, data.data];
				accountId = data.data.id;
				mode = 'transaction';
				accountName = '';
			} else {
				toast.error(data.message || 'Failed to create account');
			}
		} catch (e) {
			toast.error('Failed to create account');
		} finally {
			submitting = false;
		}
	}

	async function submitTransaction() {
		if (amount <= 0) {
			toast.error('Amount must be greater than 0');
			return;
		}
		if (!accountId) {
			toast.error('Please select an account');
			return;
		}

		submitting = true;
		try {
			const body: CreateTransactionRequest = {
				account_id: accountId,
				amount: amount,
				type: Number(selectedTxType),
				note: note || undefined,
				date: date || undefined
			};
			if (category) {
				body.category_id = category;
			}

			const res = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = await res.json();
			if (data.success) {
				toast.success('Transaction added');
				resetForm();
				open = false;
				onSuccess?.();
			} else {
				toast.error(data.message || 'Failed to add transaction');
			}
		} catch (e) {
			toast.error('Failed to add transaction');
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		amount = 0;
		txType = [String(TransactionType.EXPENSE)];
		category = '';
		note = '';
		date = new Date().toISOString().split('T')[0];
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		onOpenChange?.(isOpen);
	}

	const filteredCategories = $derived(
		categories.filter((c) => c.type === Number(selectedTxType))
	);

	const selectedCategory = $derived(categories.find((c) => c.id === category));
	const selectedAccount = $derived(accounts.find((a) => a.id === accountId));

	const accountTypeOptions = Object.entries(AccountTypeLabels).map(([value, label]) => ({
		value,
		label
	}));
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	<DialogContent class="max-w-sm">
		<DialogHeader>
			<DialogTitle>
					{#if mode === 'create-account'}
						Create Account
					{:else}
						Add Transaction
					{/if}
				</DialogTitle>
		</DialogHeader>

			{#if loading}
				<div class="flex justify-center py-8">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
				</div>
			{:else if mode === 'create-account'}
				<div class="space-y-4 px-4">
					<p class="text-sm text-muted-foreground">
						Create your first account to start tracking transactions.
					</p>
					<div class="space-y-2">
						<Label for="account-name">Account Name</Label>
						<Input
							id="account-name"
							bind:value={accountName}
							placeholder="e.g., Cash, BCA, GoPay"
						/>
					</div>
					<div class="space-y-2">
						<Label for="account-type">Account Type</Label>
						<Select bind:value={accountType}>
							<SelectTrigger id="account-type">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{#each accountTypeOptions as opt}
									<SelectItem value={opt.value}>{opt.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button onclick={createAccount} disabled={submitting}>
						{submitting ? 'Creating...' : 'Create Account'}
					</Button>
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				</DialogFooter>
			{:else}
				<div class="space-y-4 px-4">
					<div class="space-y-2">
						<Label>Type</Label>
						<ToggleGroup type="single" bind:value={txType} class="justify-start">
							<ToggleGroupItem value={String(TransactionType.EXPENSE)}>Expense</ToggleGroupItem>
							<ToggleGroupItem value={String(TransactionType.INCOME)}>Income</ToggleGroupItem>
						</ToggleGroup>
					</div>

					<div class="space-y-2">
						<Label for="amount">Amount</Label>
						<CalculatorInput
							id="amount"
							value={amount}
							onchange={(v) => (amount = v)}
							placeholder="0"
							inputClass="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						/>
					</div>

					<div class="space-y-2">
						<Label for="account">Account</Label>
						<Select bind:value={accountId}>
							<SelectTrigger id="account">
								{#if selectedAccount}
									<span>{selectedAccount.name}</span>
								{:else}
									<SelectValue placeholder="Select account" />
								{/if}
							</SelectTrigger>
							<SelectContent>
								{#each accounts as acc}
									<SelectItem value={acc.id}>{acc.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Select bind:value={category}>
							<SelectTrigger id="category">
								{#if selectedCategory}
									<span>{selectedCategory.icon} {selectedCategory.name}</span>
								{:else}
									<SelectValue placeholder="Select category" />
								{/if}
							</SelectTrigger>
							<SelectContent>
								{#each filteredCategories as cat}
									<SelectItem value={cat.id}>{cat.icon} {cat.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="note">Note (optional)</Label>
						<Input id="note" bind:value={note} placeholder="What's this for?" />
					</div>

					<div class="space-y-2">
						<Label for="date">Date</Label>
						<Input id="date" type="date" bind:value={date} />
					</div>
				</div>

				<DialogFooter>
					<Button onclick={submitTransaction} disabled={submitting}>
						{submitting ? 'Adding...' : 'Add Transaction'}
					</Button>
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				</DialogFooter>
			{/if}
	</DialogContent>
</Dialog>
