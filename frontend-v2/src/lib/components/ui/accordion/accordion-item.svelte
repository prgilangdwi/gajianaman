<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value: string;
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, value, disabled = false, children, ...restProps }: Props = $props();
</script>

<AccordionPrimitive.Item
	{value}
	{disabled}
	data-slot="accordion-item"
	class={cn('not-last:border-b data-[state=open]:bg-muted/50', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</AccordionPrimitive.Item>
