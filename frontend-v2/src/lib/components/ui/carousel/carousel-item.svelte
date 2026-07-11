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
	data-slot="carousel-item"
	role="group"
	aria-roledescription="slide"
	class={cn(
		'min-w-0 shrink-0 grow-0 basis-full',
		ctx.orientation === 'horizontal' ? 'pl-4' : 'pt-4',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
