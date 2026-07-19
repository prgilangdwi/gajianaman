<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		ratio: number;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { ratio, class: className, children, ...restProps }: Props = $props();
</script>

<div
	data-slot="aspect-ratio"
	style="--ratio: {ratio}"
	class={cn('relative aspect-[var(--ratio)]', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
