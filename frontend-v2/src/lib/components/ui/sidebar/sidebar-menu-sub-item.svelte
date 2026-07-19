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

<li
	data-slot="sidebar-menu-sub-item"
	data-sidebar="menu-sub-item"
	class={cn('group/menu-sub-item relative', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</li>
