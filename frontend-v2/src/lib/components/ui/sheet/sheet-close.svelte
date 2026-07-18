<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<SheetPrimitive.Close data-slot="sheet-close" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Close>
