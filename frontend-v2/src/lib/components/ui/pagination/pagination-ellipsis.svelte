<script lang="ts">
	import { cn } from '$lib/utils';
	import { MoreHorizontal } from 'lucide-svelte';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<span
	aria-hidden="true"
	data-slot="pagination-ellipsis"
	class={cn("flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	<MoreHorizontal class="size-4" />
	<span class="sr-only">More pages</span>
</span>
