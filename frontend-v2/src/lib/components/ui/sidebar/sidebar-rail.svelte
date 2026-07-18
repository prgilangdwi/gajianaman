<script lang="ts">
	import { cn } from '$lib/utils';
	import { useSidebar } from './sidebar-context.svelte';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();

	const ctx = useSidebar();
</script>

<button
	data-sidebar="rail"
	data-slot="sidebar-rail"
	aria-label="Toggle Sidebar"
	tabindex={-1}
	onclick={ctx.toggleSidebar}
	title="Toggle Sidebar"
	class={cn(
		'absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear sm:flex',
		'group-data-[side=left]:-right-4 group-data-[side=right]:left-0',
		'after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border',
		'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
		'[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
		'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
		className
	)}
	{...restProps}
/>
