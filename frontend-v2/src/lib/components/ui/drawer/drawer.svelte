<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DrawerPrimitive.Root>;

	let { ...restProps }: Props = $props();
</script>

<DrawerPrimitive.Root data-slot="drawer" {...restProps} />
