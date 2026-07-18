<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<TooltipPrimitive.Trigger data-slot="tooltip-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</TooltipPrimitive.Trigger>
