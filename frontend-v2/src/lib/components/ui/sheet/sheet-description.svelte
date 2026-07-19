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

<SheetPrimitive.Description
	data-slot="sheet-description"
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Description>
