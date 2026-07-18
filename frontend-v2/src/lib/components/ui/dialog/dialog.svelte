<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { open = $bindable(false), onOpenChange, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DialogPrimitive.Root>
