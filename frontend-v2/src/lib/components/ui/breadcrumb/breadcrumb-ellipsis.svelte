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
	data-slot="breadcrumb-ellipsis"
	role="presentation"
	aria-hidden="true"
	class={cn('flex size-5 items-center justify-center [&>svg]:size-4', className)}
	{...restProps}
>
	<MoreHorizontal strokeWidth={2} />
	<span class="sr-only">More</span>
</span>
