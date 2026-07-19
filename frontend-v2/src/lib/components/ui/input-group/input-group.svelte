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
	data-slot="input-group"
	role="group"
	class={cn(
		'group/input-group relative flex h-9 w-full min-w-0 items-center rounded-xl border border-transparent bg-input/50 transition-[color,box-shadow,background-color] outline-none',
		'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30',
		'has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
		'has-[textarea]:rounded-lg has-[>textarea]:h-auto',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
