<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
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
		side = 'bottom',
		sideOffset = 4,
		align = 'center',
		alignOffset = 0,
		children,
		...restProps
	}: Props = $props();
</script>

<PopoverPrimitive.Portal>
	<PopoverPrimitive.Content
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		data-slot="popover-content"
		class={cn(
			'z-50 flex w-72 origin-[var(--bits-popover-content-transform-origin)] flex-col gap-4 rounded-3xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
