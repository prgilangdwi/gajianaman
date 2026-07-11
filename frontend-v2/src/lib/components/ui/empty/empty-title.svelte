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
	data-slot="empty-title"
	class={cn('font-heading text-lg font-medium tracking-tight', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
