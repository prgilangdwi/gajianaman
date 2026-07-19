<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
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
		align = 'start',
		alignOffset = 0,
		children,
		...restProps
	}: Props = $props();
</script>

<DropdownMenuPrimitive.Portal>
	<DropdownMenuPrimitive.Content
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		data-slot="dropdown-menu-content"
		class={cn(
			'z-50 max-h-[var(--bits-dropdown-menu-content-available-height)] min-w-48 origin-[var(--bits-dropdown-menu-content-transform-origin)] overflow-x-hidden overflow-y-auto rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:overflow-hidden data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</DropdownMenuPrimitive.Content>
</DropdownMenuPrimitive.Portal>
