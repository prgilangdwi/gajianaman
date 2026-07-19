<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Close data-slot="dialog-close" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DialogPrimitive.Close>
