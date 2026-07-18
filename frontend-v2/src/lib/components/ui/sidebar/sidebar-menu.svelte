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
	data-slot="sidebar-menu"
	data-sidebar="menu"
	class={cn('flex w-full min-w-0 flex-col gap-0.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ul>
