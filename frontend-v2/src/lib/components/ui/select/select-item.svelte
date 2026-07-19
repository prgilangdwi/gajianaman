<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Check } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value: string;
		label?: string;
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		value,
		label,
		disabled = false,
		children: childrenSnippet,
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Item
	{value}
	{label}
	{disabled}
	data-slot="select-item"
	class={cn(
		'relative flex w-full cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected }: { selected: boolean })}
		<span class="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
			{#if childrenSnippet}
				{@render childrenSnippet()}
			{/if}
		</span>
		{#if selected}
			<span class="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
				<Check class="pointer-events-none size-4" strokeWidth={2} />
			</span>
		{/if}
	{/snippet}
</SelectPrimitive.Item>
