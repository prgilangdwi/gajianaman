<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { open = $bindable(false), onOpenChange, children, ...restProps }: Props = $props();
</script>

<SheetPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Root>
