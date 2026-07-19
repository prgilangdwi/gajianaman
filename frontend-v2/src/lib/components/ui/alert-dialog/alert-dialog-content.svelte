<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		size?: 'default' | 'sm';
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, size = 'default', children, ...restProps }: Props = $props();
</script>

<AlertDialogPrimitive.Portal>
	<AlertDialogPrimitive.Overlay
		data-slot="alert-dialog-overlay"
		class="fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-[backdrop-filter]:backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
	/>
	<AlertDialogPrimitive.Content
		data-slot="alert-dialog-content"
		data-size={size}
		class={cn(
			'group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none data-[size=default]:sm:max-w-md data-[size=sm]:max-w-xs dark:ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</AlertDialogPrimitive.Content>
</AlertDialogPrimitive.Portal>
