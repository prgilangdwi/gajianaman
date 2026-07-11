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

<AlertDialogPrimitive.Title
	data-slot="alert-dialog-title"
	class={cn(
		'font-heading text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</AlertDialogPrimitive.Title>
