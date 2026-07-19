<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		value?: number[];
		onValueChange?: (value: number[]) => void;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		orientation?: 'horizontal' | 'vertical';
		[key: string]: unknown;
	};

	let {
		class: className,
		value = $bindable([0]),
		onValueChange,
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		orientation = 'horizontal',
		...restProps
	}: Props = $props();
</script>

<SliderPrimitive.Root
	type="multiple"
	bind:value
	{onValueChange}
	{min}
	{max}
	{step}
	{disabled}
	{orientation}
	data-slot="slider"
	class={cn('relative flex w-full touch-none select-none items-center', className)}
	{...restProps}
>
	{#snippet children({ thumbs })}
		<span
			data-slot="slider-track"
			class="relative h-2 w-full grow overflow-hidden rounded-full bg-input/90"
		>
			<SliderPrimitive.Range data-slot="slider-range" class="absolute h-full bg-primary" />
		</span>
		{#each thumbs as _, index}
			<SliderPrimitive.Thumb
				{index}
				data-slot="slider-thumb"
				class="block h-4 w-6 shrink-0 rounded-full border-2 border-primary bg-background shadow-md ring-0 transition-colors focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
