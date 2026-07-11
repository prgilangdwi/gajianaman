<script lang="ts" module>
	import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel';

	export type CarouselApi = EmblaCarouselType;
	export type CarouselOptions = EmblaOptionsType;
	export type CarouselPlugin = EmblaPluginType;

	export type CarouselContext = {
		orientation: 'horizontal' | 'vertical';
		canScrollPrev: boolean;
		canScrollNext: boolean;
		scrollPrev: () => void;
		scrollNext: () => void;
		api: CarouselApi | undefined;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		opts?: CarouselOptions;
		plugins?: CarouselPlugin[];
		orientation?: 'horizontal' | 'vertical';
		onApiChange?: (api: CarouselApi) => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		opts = {},
		plugins = [],
		orientation = 'horizontal',
		onApiChange,
		children,
		...restProps
	}: Props = $props();

	let api = $state<CarouselApi | undefined>(undefined);
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);

	const emblaOptions = $derived({
		...opts,
		axis: orientation === 'horizontal' ? 'x' : 'y'
	} as EmblaOptionsType);

	function onInit(event: CustomEvent<EmblaCarouselType>) {
		api = event.detail;
		onApiChange?.(api);
		updateScrollState();
		api.on('select', updateScrollState);
		api.on('reInit', updateScrollState);
	}

	function updateScrollState() {
		if (!api) return;
		canScrollPrev = api.canScrollPrev();
		canScrollNext = api.canScrollNext();
	}

	function scrollPrev() {
		api?.scrollPrev();
	}

	function scrollNext() {
		api?.scrollNext();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			scrollPrev();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			scrollNext();
		}
	}

	setContext<CarouselContext>('carousel', {
		get orientation() {
			return orientation;
		},
		get canScrollPrev() {
			return canScrollPrev;
		},
		get canScrollNext() {
			return canScrollNext;
		},
		scrollPrev,
		scrollNext,
		get api() {
			return api;
		}
	});
</script>

<div
	data-slot="carousel"
	role="region"
	aria-roledescription="carousel"
	class={cn('relative', className)}
	onkeydown={handleKeyDown}
	{...restProps}
>
	<div
		class="overflow-hidden"
		data-slot="carousel-viewport"
		use:emblaCarouselSvelte={{ options: emblaOptions, plugins }}
		onemblaInit={onInit}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
