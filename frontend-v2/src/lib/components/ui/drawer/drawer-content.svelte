<script lang="ts">
	import { cn } from '$lib/utils';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Portal>
	<DrawerPrimitive.Overlay
		data-slot="drawer-overlay"
		class="fixed inset-0 z-50 bg-black/80"
	/>
	<DrawerPrimitive.Content
		data-slot="drawer-content"
		class={cn(
			'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl bg-background',
			className
		)}
		{...restProps}
	>
		<div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"></div>
		{#if children}
			{@render children()}
		{/if}
	</DrawerPrimitive.Content>
</DrawerPrimitive.Portal>
