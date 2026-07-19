<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet, ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DrawerPrimitive.Trigger> & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Trigger data-slot="drawer-trigger" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DrawerPrimitive.Trigger>
