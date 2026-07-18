<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = HoverCardPrimitive.TriggerProps & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</HoverCardPrimitive.Trigger>
