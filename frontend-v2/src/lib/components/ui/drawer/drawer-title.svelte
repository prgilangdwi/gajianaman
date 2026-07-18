<script lang="ts">
	import { cn } from '$lib/utils';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet, ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DrawerPrimitive.Title> & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Title
	data-slot="drawer-title"
	class={cn('text-lg font-semibold leading-none tracking-tight', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DrawerPrimitive.Title>
