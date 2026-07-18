<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		[key: string]: unknown;
	};

	let { children, ...restProps }: Props = $props();
</script>

<li data-slot="pagination-item" {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</li>
