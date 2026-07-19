<script lang="ts">
	import { cn } from '$lib/utils';
	import Skeleton from '../skeleton.svelte';

	type Props = {
		class?: string;
		showIcon?: boolean;
		[key: string]: unknown;
	};

	let { class: className, showIcon = false, ...restProps }: Props = $props();

	const width = `${Math.floor(Math.random() * 40) + 50}%`;
</script>

<div
	data-slot="sidebar-menu-skeleton"
	data-sidebar="menu-skeleton"
	class={cn('flex h-8 items-center gap-2 rounded-xl px-2', className)}
	{...restProps}
>
	{#if showIcon}
		<Skeleton class="size-4 rounded-xl" data-sidebar="menu-skeleton-icon" />
	{/if}
	<Skeleton
		class="h-4 flex-1"
		data-sidebar="menu-skeleton-text"
		style="max-width: {width}"
	/>
</div>
