<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</CollapsiblePrimitive.Trigger>
