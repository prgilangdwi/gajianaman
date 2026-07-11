<script lang="ts">
	import { Pane } from 'paneforge';
	import type { Snippet } from 'svelte';

	type Props = Pane.Props & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<Pane.Root data-slot="resizable-panel" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</Pane.Root>
