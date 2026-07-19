<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Group>
