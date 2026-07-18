<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '../button.svelte';
	import type { ButtonVariant, ButtonSize } from '../button.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		variant = 'outline',
		size = 'default',
		children,
		...restProps
	}: Props = $props();
</script>

<AlertDialogPrimitive.Cancel
	data-slot="alert-dialog-cancel"
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</AlertDialogPrimitive.Cancel>
