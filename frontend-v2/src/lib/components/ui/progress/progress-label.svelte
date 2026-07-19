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

<span data-slot="progress-label" class={cn('text-sm font-medium', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</span>
