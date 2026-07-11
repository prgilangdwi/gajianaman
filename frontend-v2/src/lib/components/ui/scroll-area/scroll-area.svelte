<script lang="ts">
	import { cn } from '$lib/utils';
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ScrollBar from './scroll-bar.svelte';

	type Props = ScrollAreaPrimitive.RootProps & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<ScrollAreaPrimitive.Root
	data-slot="scroll-area"
	class={cn('relative', className)}
	{...restProps}
>
	<ScrollAreaPrimitive.Viewport
		data-slot="scroll-area-viewport"
		class="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
	>
		{#if children}
			{@render children()}
		{/if}
	</ScrollAreaPrimitive.Viewport>
	<ScrollBar orientation="vertical" />
	<ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
