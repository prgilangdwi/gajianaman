<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		delayDuration?: number;
		skipDelayDuration?: number;
		disableHoverableContent?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		delayDuration = 200,
		skipDelayDuration = 300,
		disableHoverableContent = false,
		children,
		...restProps
	}: Props = $props();
</script>

<TooltipPrimitive.Provider
	{delayDuration}
	{skipDelayDuration}
	{disableHoverableContent}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TooltipPrimitive.Provider>
