<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value?: string[];
		onValueChange?: (value: string[]) => void;
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		value = $bindable([]),
		onValueChange,
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<AccordionPrimitive.Root
	type="multiple"
	bind:value
	{onValueChange}
	{disabled}
	data-slot="accordion"
	class={cn('flex w-full flex-col overflow-hidden rounded-2xl border', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</AccordionPrimitive.Root>
