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

<nav
	aria-label="pagination"
	data-slot="pagination"
	class={cn('mx-auto flex w-full justify-center', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</nav>
