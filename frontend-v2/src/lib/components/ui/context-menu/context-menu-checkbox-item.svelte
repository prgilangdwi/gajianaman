<script lang="ts">
	import { cn } from '$lib/utils';
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { Check } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = ContextMenuPrimitive.CheckboxItemProps & {
		class?: string;
		inset?: boolean;
		label?: Snippet;
	};

	let { class: className, inset = false, label, ...restProps }: Props = $props();
</script>

<ContextMenuPrimitive.CheckboxItem
	data-slot="context-menu-checkbox-item"
	data-inset={inset}
	class={cn(
		'relative flex cursor-default items-center gap-2.5 rounded-lg py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none',
		'focus:bg-accent focus:text-accent-foreground',
		'data-[inset=true]:pl-9.5',
		'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span class="pointer-events-none absolute right-2">
			{#if checked}
				<Check class="size-4" />
			{/if}
		</span>
		{#if label}
			{@render label()}
		{/if}
	{/snippet}
</ContextMenuPrimitive.CheckboxItem>
