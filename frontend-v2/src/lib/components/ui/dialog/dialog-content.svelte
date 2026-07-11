<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import DialogOverlay from './dialog-overlay.svelte';

	type Props = {
		class?: string;
		showCloseButton?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, showCloseButton = true, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Portal>
	<DialogOverlay />
	<DialogPrimitive.Content
		data-slot="dialog-content"
		class={cn(
			'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md dark:ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		{#if showCloseButton}
			<DialogPrimitive.Close
				data-slot="dialog-close"
				class="absolute top-4 right-4 rounded-md bg-secondary p-1.5 text-foreground/60 transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<X class="size-4" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
