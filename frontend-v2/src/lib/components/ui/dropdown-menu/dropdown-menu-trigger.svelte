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

<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" class={className} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Trigger>
