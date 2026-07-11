<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<CollapsiblePrimitive.Content
	data-slot="collapsible-content"
	class={cn('overflow-hidden', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</CollapsiblePrimitive.Content>
