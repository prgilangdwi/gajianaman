<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Group
	data-slot="select-group"
	class={cn('scroll-my-1.5 p-1.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</SelectPrimitive.Group>
