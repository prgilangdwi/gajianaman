<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '../button.svelte';
	import type { ButtonSize } from '../button.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		href?: string;
		isActive?: boolean;
		size?: ButtonSize;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		href,
		isActive = false,
		size = 'icon',
		children,
		...restProps
	}: Props = $props();
</script>

<Button
	variant={isActive ? 'outline' : 'ghost'}
	{size}
	{href}
	class={cn(className)}
	data-slot="pagination-link"
	data-active={isActive}
	aria-current={isActive ? 'page' : undefined}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</Button>
