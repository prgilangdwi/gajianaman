<script lang="ts">
	import { cn } from '$lib/utils';
	import { PaneGroup } from 'paneforge';
	import type { Snippet } from 'svelte';

	type Props = PaneGroup.Props & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<PaneGroup.Root
	data-slot="resizable-panel-group"
	class={cn('flex h-full w-full data-[orientation=vertical]:flex-col', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</PaneGroup.Root>
