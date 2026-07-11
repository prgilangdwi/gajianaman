<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import PaginationLink from './pagination-link.svelte';

	type Props = {
		class?: string;
		href?: string;
		text?: string;
		[key: string]: unknown;
	};

	let { class: className, href, text = 'Next', ...restProps }: Props = $props();
</script>

<PaginationLink
	aria-label="Go to next page"
	size="default"
	class={cn('pr-2!', className)}
	{href}
	{...restProps}
>
	<span class="hidden sm:block">{text}</span>
	<ChevronRight class="size-4" data-icon="inline-end" />
</PaginationLink>
