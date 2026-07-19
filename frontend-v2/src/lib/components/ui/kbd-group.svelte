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

<kbd data-slot="kbd-group" class={cn('inline-flex items-center gap-1', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</kbd>
