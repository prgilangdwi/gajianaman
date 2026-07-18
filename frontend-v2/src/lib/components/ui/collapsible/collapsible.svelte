<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<CollapsiblePrimitive.Root bind:open {onOpenChange} {disabled} data-slot="collapsible" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</CollapsiblePrimitive.Root>
