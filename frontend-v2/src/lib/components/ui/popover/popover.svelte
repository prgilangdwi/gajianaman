<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { open = $bindable(false), onOpenChange, children, ...restProps }: Props = $props();
</script>

<PopoverPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</PopoverPrimitive.Root>
