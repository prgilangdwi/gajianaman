<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		dismissible?: boolean;
		shouldScaleBackground?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { children, ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Root {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DrawerPrimitive.Root>
