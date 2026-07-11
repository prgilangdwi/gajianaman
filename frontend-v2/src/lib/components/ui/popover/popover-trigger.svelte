<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<PopoverPrimitive.Trigger data-slot="popover-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</PopoverPrimitive.Trigger>
