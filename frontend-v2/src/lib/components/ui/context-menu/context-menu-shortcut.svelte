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

<span
	data-slot="context-menu-shortcut"
	class={cn(
		'ml-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-accent-foreground',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</span>
