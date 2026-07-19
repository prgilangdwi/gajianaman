<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div
	data-slot="sidebar-group-label"
	data-sidebar="group-label"
	class={cn(
		'flex h-8 shrink-0 items-center rounded-xl px-3 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear',
		'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
		'focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
