<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		href?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, href, children, ...restProps }: Props = $props();
</script>

<a
	data-slot="breadcrumb-link"
	{href}
	class={cn('transition-colors hover:text-foreground', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</a>
