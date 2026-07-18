<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { ChevronDown } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<AccordionPrimitive.Header class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		class={cn(
			'group/accordion-trigger relative flex flex-1 items-center justify-between gap-6 border border-transparent p-4 text-left text-sm font-medium transition-all outline-none hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:shrink-0 [&>svg]:text-muted-foreground [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		<ChevronDown class="size-4" />
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
