<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { CarouselContext } from './carousel.svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();

	const ctx = getContext<CarouselContext>('carousel');
</script>

<div
	data-slot="carousel-content"
	class={cn('flex', ctx.orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
