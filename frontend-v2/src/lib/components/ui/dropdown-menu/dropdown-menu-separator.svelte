<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Separator
	data-slot="dropdown-menu-separator"
	class={cn('-mx-1.5 my-1.5 h-px bg-border/50', className)}
	{...restProps}
/>
