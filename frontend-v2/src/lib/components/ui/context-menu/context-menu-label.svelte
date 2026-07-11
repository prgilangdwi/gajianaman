<script lang="ts">
	import { cn } from '$lib/utils';
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = ContextMenuPrimitive.GroupHeadingProps & {
		class?: string;
		inset?: boolean;
		children?: Snippet;
	};

	let { class: className, inset = false, children, ...restProps }: Props = $props();
</script>

<ContextMenuPrimitive.GroupHeading
	data-slot="context-menu-label"
	data-inset={inset}
	class={cn('px-3 py-2.5 text-xs text-muted-foreground data-[inset=true]:pl-9.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ContextMenuPrimitive.GroupHeading>
