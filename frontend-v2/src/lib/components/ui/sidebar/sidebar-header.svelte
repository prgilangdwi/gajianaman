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
	data-slot="sidebar-header"
	data-sidebar="header"
	class={cn('flex flex-col gap-2 p-2 [--radius:var(--radius-xl)]', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
