<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</AlertDialogPrimitive.Trigger>
