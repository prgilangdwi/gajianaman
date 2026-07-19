<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<AccordionPrimitive.Content
	data-slot="accordion-content"
	class="overflow-hidden text-sm data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
	{...restProps}
>
	<div class={cn('px-4 pb-4 pt-0', className)}>
		{#if children}
			{@render children()}
		{/if}
	</div>
</AccordionPrimitive.Content>
