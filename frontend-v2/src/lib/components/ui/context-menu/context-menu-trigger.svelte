<script lang="ts">
	import { cn } from '$lib/utils';
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = ContextMenuPrimitive.TriggerProps & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<ContextMenuPrimitive.Trigger
	data-slot="context-menu-trigger"
	class={cn('select-none', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ContextMenuPrimitive.Trigger>
