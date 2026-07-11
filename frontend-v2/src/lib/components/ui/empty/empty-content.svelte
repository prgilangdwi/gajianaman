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
	data-slot="empty-content"
	class={cn(
		'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
