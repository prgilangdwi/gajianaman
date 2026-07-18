<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		inset?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, inset = false, children, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Label
	data-slot="dropdown-menu-label"
	data-inset={inset || undefined}
	class={cn('px-3 py-2.5 text-xs text-muted-foreground data-[inset]:pl-9.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Label>
