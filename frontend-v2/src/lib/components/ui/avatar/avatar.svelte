<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		size?: 'default' | 'sm' | 'lg';
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, size = 'default', children, ...restProps }: Props = $props();
</script>

<span
	data-slot="avatar"
	data-size={size}
	class={cn(
		'group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</span>
