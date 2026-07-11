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

<div data-slot="table-container" class="relative w-full overflow-x-auto">
	<table data-slot="table" class={cn('w-full caption-bottom text-sm', className)} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</table>
</div>
