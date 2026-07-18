<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<div
	data-slot="select-separator"
	class={cn('pointer-events-none -mx-1.5 my-1.5 h-px bg-border', className)}
	{...restProps}
></div>
