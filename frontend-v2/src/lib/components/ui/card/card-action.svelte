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

<div
	data-slot="card-action"
	class={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
