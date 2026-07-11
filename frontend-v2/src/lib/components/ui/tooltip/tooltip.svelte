<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		delayDuration?: number;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		delayDuration = 200,
		children,
		...restProps
	}: Props = $props();
</script>

<TooltipPrimitive.Root bind:open {onOpenChange} {delayDuration} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</TooltipPrimitive.Root>
