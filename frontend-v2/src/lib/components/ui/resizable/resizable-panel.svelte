<script lang="ts">
	import { Pane, type PaneProps } from 'paneforge';
	import type { Snippet } from 'svelte';

	type Props = PaneProps & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<Pane data-slot="resizable-panel" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</Pane>
