<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<td
	data-slot="table-cell"
	class={cn('p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</td>
