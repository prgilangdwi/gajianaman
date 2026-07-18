<script lang="ts">
	import { cn } from '$lib/utils';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLParagraphElement> & {
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
