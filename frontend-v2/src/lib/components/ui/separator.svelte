<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		orientation?: 'horizontal' | 'vertical';
	};

	let { class: className, orientation = 'horizontal', ...restProps }: Props = $props();
</script>

<div
	data-slot="separator"
	data-orientation={orientation}
	role="separator"
	aria-orientation={orientation}
	class={cn(
		'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
		className
	)}
	{...restProps}
></div>
