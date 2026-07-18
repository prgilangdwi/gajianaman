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
	data-slot="sidebar-group-content"
	data-sidebar="group-content"
	class={cn('w-full text-sm', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
