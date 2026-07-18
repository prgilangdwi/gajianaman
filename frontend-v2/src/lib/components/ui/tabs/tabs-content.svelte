<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, value, children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.Content
	{value}
	data-slot="tabs-content"
	class={cn('flex-1 text-sm outline-none', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TabsPrimitive.Content>
