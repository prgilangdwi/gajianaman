<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';

	type Props = ContextMenuPrimitive.RootProps;

	let { ...restProps }: Props = $props();
</script>

<ContextMenuPrimitive.Root {...restProps} />
