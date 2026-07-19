<script lang="ts">
	import { cn } from '$lib/utils';
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';

	type Props = ContextMenuPrimitive.SeparatorProps & {
		class?: string;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<ContextMenuPrimitive.Separator
	data-slot="context-menu-separator"
	class={cn('-mx-1.5 my-1.5 h-px bg-border/50', className)}
	{...restProps}
/>
