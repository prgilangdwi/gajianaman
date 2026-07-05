<script lang="ts">
	interface Props {
		value: number;
		onchange: (value: number) => void;
		placeholder?: string;
		inputClass?: string;
		id?: string;
	}

	let { value, onchange, placeholder = '-', inputClass = '', id }: Props = $props();

	let expr = $state(value ? String(value) : '');

	function evaluateExpr(e: string): number {
		if (!e.trim()) return 0;
		try {
			const sanitized = e.replace(/[^0-9+\-*/().\s]/g, '');
			if (!sanitized.trim()) return 0;
			const result = Function(`"use strict"; return (${sanitized})`)();
			return typeof result === 'number' && isFinite(result) ? Math.round(result) : 0;
		} catch {
			return 0;
		}
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		expr = target.value;
		const result = evaluateExpr(expr);
		onchange(result);
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const result = evaluateExpr(expr);
			if (result > 0) {
				expr = String(result);
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
