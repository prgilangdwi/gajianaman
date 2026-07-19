// Backend API response envelope
export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data?: T;
	pagination?: { page: number; limit: number; total: number };
	error?: string;
}

// Account types matching Go backend
export interface Account {
	id: string;
	user_id: string;
	name: string;
	type: number; // 0=Cash, 1=Bank, 2=E-Wallet, 3=Credit, 4=Investment
	balance: number;
	currency: string;
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateAccountRequest {
	name: string;
	type: number;
	balance?: number;
	currency?: string;
	is_default?: boolean;
}

export interface UpdateAccountRequest {
	name?: string;
	type?: number;
	is_default?: boolean;
}

// Transaction types
export interface Transaction {
	id: string;
	user_id: string;
	account_id: string;
	category_id: string | null;
	amount: number;
	type: number; // 0=Expense, 1=Income, 2=Transfer
	note: string;
	date: string;
	source: number;
	ai_confidence: number | null;
	created_at: string;
	updated_at: string;
}

export interface CreateTransactionRequest {
	account_id: string;
	category_id?: string;
	amount: number;
	type: number;
	note?: string;
	date?: string;
}

export interface UpdateTransactionRequest {
	account_id?: string;
	category_id?: string;
	amount?: number;
	type?: number;
	note?: string;
	date?: string;
}

// Category types
export interface Category {
	id: string;
	user_id: string | null;
	code: string;
	name: string;
	icon: string;
	type: number; // 0=Expense, 1=Income, 2=Transfer
	parent_id: string | null;
	created_at: string;
	updated_at: string;
}

// Ledger entry types
export interface LedgerEntry {
	id: string;
	account_id: string;
	transaction_id: string | null;
	type: 'credit' | 'debit';
	amount: number;
	starting_balance: number;
	ending_balance: number;
	created_at: string;
}
