<script lang="ts">
	interface Props {
		value: number;
		onchange: (value: number) => void;
		placeholder?: string;
		inputClass?: string;
		id?: string;
	}

	let { value, onchange, placeholder = '-', inputClass = '', id }: Props = $props();

	let expr = $state(value ? formatNumber(value) : '');

	function formatNumber(n: number): string {
		return n.toLocaleString('id-ID');
	}

	function unformatNumber(s: string): string {
		return s.replace(/\./g, '');
	}

	function isPlainNumber(s: string): boolean {
		return /^[\d.]+$/.test(s.trim());
	}

	function evaluateExpr(e: string): number {
		if (!e.trim()) return 0;
		try {
			const unformatted = unformatNumber(e);
			const sanitized = unformatted.replace(/[^0-9+\-*/().\s]/g, '');
			if (!sanitized.trim()) return 0;
			const result = Function(`"use strict"; return (${sanitized})`)();
			return typeof result === 'number' && isFinite(result) ? Math.round(result) : 0;
		} catch {
			return 0;
		}
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const raw = target.value;
		const result = evaluateExpr(raw);

		if (isPlainNumber(raw)) {
			expr = formatNumber(result);
		} else {
			expr = raw;
		}
		onchange(result);
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const result = evaluateExpr(expr);
			if (result > 0) {
				expr = formatNumber(result);
			}
			onchange(result);
		}
	}
</script>

<input
	type="text"
	inputmode="decimal"
	{id}
	value={expr}
	oninput={handleInputChange}
	onkeydown={handleInputKeydown}
	{placeholder}
	class={inputClass}
/>
