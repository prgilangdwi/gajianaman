<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import Button from '../button.svelte';
	import type { ButtonVariant, ButtonSize } from '../button.svelte';
	import type { CarouselContext } from './carousel.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		variant = 'outline',
		size = 'icon-sm',
		children,
		...restProps
	}: Props = $props();

	const ctx = getContext<CarouselContext>('carousel');
</script>

<Button
	data-slot="carousel-previous"
	{variant}
	{size}
	class={cn(
		'absolute touch-manipulation rounded-full',
		ctx.orientation === 'horizontal'
			? 'inset-y-0 -left-12 my-auto'
			: '-top-12 left-1/2 -translate-x-1/2 rotate-90',
		className
	)}
	disabled={!ctx.canScrollPrev}
	onclick={ctx.scrollPrev}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronLeft class="size-4" />
		<span class="sr-only">Previous slide</span>
	{/if}
</Button>
