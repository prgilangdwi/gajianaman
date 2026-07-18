<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		showCloseButton?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		side = 'right',
		showCloseButton = true,
		children,
		...restProps
	}: Props = $props();

	const sideClasses = {
		top: 'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
		right:
			'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
		bottom:
			'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
		left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'
	};
</script>

<SheetPrimitive.Portal>
	<SheetPrimitive.Overlay
		data-slot="sheet-overlay"
		class="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 supports-[backdrop-filter]:backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
	/>
	<SheetPrimitive.Content
		data-slot="sheet-content"
		data-side={side}
		class={cn(
			'fixed z-50 flex flex-col bg-popover bg-clip-padding text-sm text-popover-foreground shadow-xl transition duration-200 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
			sideClasses[side],
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		{#if showCloseButton}
			<SheetPrimitive.Close
				data-slot="sheet-close"
				class="absolute top-4 right-4 rounded-md bg-secondary p-1.5 text-foreground/60 transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<X class="size-4" />
				<span class="sr-only">Close</span>
			</SheetPrimitive.Close>
		{/if}
	</SheetPrimitive.Content>
</SheetPrimitive.Portal>
