<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<SheetPrimitive.Title
	data-slot="sheet-title"
	class={cn('font-heading text-base font-medium text-foreground', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Title>
