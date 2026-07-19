<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<li
	data-slot="breadcrumb-separator"
	role="presentation"
	aria-hidden="true"
	class={cn('[&>svg]:size-3.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRight strokeWidth={2} />
	{/if}
</li>
