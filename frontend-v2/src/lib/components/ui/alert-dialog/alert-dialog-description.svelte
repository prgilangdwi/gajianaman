<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<AlertDialogPrimitive.Description
	data-slot="alert-dialog-description"
	class={cn(
		'text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</AlertDialogPrimitive.Description>
