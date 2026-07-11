<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
		sideOffset?: number;
		align?: 'start' | 'center' | 'end';
		alignOffset?: number;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		side = 'top',
		sideOffset = 4,
		align = 'center',
		alignOffset = 0,
		children,
		...restProps
	}: Props = $props();
</script>

<TooltipPrimitive.Portal>
	<TooltipPrimitive.Content
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		data-slot="tooltip-content"
		class={cn(
			"z-50 inline-flex w-fit max-w-xs origin-[var(--bits-tooltip-content-transform-origin)] items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		<TooltipPrimitive.Arrow
			class="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=left]:-right-1 data-[side=left]:top-1/2 data-[side=left]:-translate-y-1/2 data-[side=right]:-left-1 data-[side=right]:top-1/2 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5"
		/>
	</TooltipPrimitive.Content>
</TooltipPrimitive.Portal>
