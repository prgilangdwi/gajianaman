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

<ul data-slot="pagination-content" class={cn('flex items-center gap-1', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</ul>
