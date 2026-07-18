<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronLeft } from 'lucide-svelte';
	import PaginationLink from './pagination-link.svelte';

	type Props = {
		class?: string;
		href?: string;
		text?: string;
		[key: string]: unknown;
	};

	let { class: className, href, text = 'Previous', ...restProps }: Props = $props();
</script>

<PaginationLink
	aria-label="Go to previous page"
	size="default"
	class={cn('pl-2!', className)}
	{href}
	{...restProps}
>
	<ChevronLeft class="size-4" data-icon="inline-start" />
	<span class="hidden sm:block">{text}</span>
</PaginationLink>
