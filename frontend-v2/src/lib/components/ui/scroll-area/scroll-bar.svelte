<script lang="ts">
	import { cn } from '$lib/utils';
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';

	type Props = ScrollAreaPrimitive.ScrollbarProps & {
		class?: string;
	};

	let { class: className, orientation = 'vertical', ...restProps }: Props = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	data-slot="scroll-area-scrollbar"
	data-orientation={orientation}
	{orientation}
	class={cn(
		'flex touch-none p-px transition-colors select-none data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent',
		className
	)}
	{...restProps}
>
	<ScrollAreaPrimitive.Thumb
		data-slot="scroll-area-thumb"
		class="relative flex-1 rounded-full bg-border"
	/>
</ScrollAreaPrimitive.Scrollbar>
