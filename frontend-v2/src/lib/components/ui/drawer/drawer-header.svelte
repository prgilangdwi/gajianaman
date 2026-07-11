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
	data-slot="drawer-header"
	class={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
