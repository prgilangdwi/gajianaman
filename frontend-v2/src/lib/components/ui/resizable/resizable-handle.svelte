<script lang="ts">
	import { cn } from '$lib/utils';
	import { PaneResizer, type PaneResizerProps } from 'paneforge';

	type Props = PaneResizerProps & {
		class?: string;
		withHandle?: boolean;
	};

	let { class: className, withHandle = false, ...restProps }: Props = $props();
</script>

<PaneResizer
	data-slot="resizable-handle"
	class={cn(
		'relative flex w-px items-center justify-center bg-border ring-offset-background after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
		'data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=horizontal]:after:left-0 data-[orientation=horizontal]:after:h-1 data-[orientation=horizontal]:after:w-full data-[orientation=horizontal]:after:translate-x-0 data-[orientation=horizontal]:after:-translate-y-1/2',
		'[&[data-orientation=horizontal]>div]:rotate-90',
		className
	)}
	{...restProps}
>
	{#if withHandle}
		<div class="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border"></div>
	{/if}
</PaneResizer>
