<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		onValueChange?: (value: string | undefined) => void;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		disabled?: boolean;
		name?: string;
		required?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		value = $bindable(),
		onValueChange,
		open = $bindable(false),
		onOpenChange,
		disabled = false,
		name,
		required = false,
		children,
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Root
	type="single"
	bind:value
	{onValueChange}
	bind:open
	{onOpenChange}
	{disabled}
	{name}
	{required}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</SelectPrimitive.Root>
