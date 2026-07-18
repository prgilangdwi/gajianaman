<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import { ChevronRight } from 'lucide-svelte';
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
	data-slot="carousel-next"
	{variant}
	{size}
	class={cn(
		'absolute touch-manipulation rounded-full',
		ctx.orientation === 'horizontal'
			? 'inset-y-0 -right-12 my-auto'
			: '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
		className
	)}
	disabled={!ctx.canScrollNext}
	onclick={ctx.scrollNext}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRight class="size-4" />
		<span class="sr-only">Next slide</span>
	{/if}
</Button>
