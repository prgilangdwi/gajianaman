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

<ul
	data-slot="sidebar-menu-sub"
	data-sidebar="menu-sub"
	class={cn(
		'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ul>
