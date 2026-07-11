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

<SheetPrimitive.Trigger data-slot="sheet-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Trigger>
