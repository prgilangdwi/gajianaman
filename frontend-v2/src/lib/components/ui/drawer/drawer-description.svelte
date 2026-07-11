<script lang="ts">
	import { cn } from '$lib/utils';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet, ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DrawerPrimitive.Description> & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Description
	data-slot="drawer-description"
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DrawerPrimitive.Description>
