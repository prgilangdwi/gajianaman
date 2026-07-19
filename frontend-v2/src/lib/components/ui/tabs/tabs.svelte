<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value?: string;
		onValueChange?: (value: string) => void;
		orientation?: 'horizontal' | 'vertical';
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		value = $bindable(),
		onValueChange,
		orientation = 'horizontal',
		children,
		...restProps
	}: Props = $props();
</script>

<TabsPrimitive.Root
	bind:value
	{onValueChange}
	{orientation}
	data-slot="tabs"
	data-orientation={orientation}
	class={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TabsPrimitive.Root>
