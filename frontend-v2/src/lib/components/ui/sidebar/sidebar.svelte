<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../sheet';
	import { useSidebar, SIDEBAR_WIDTH_MOBILE } from './sidebar-context.svelte';

	type Props = {
		class?: string;
		side?: 'left' | 'right';
		variant?: 'sidebar' | 'floating' | 'inset';
		collapsible?: 'offcanvas' | 'icon' | 'none';
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		side = 'left',
		variant = 'sidebar',
		collapsible = 'offcanvas',
		children,
		...restProps
	}: Props = $props();

	const ctx = useSidebar();
</script>

{#if collapsible === 'none'}
	<div
		data-slot="sidebar"
		class={cn('flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground', className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{:else if ctx.isMobile}
	<Sheet open={ctx.openMobile} onOpenChange={ctx.setOpenMobile}>
		<SheetContent
			data-sidebar="sidebar"
			data-slot="sidebar"
			data-mobile="true"
			class="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
			{side}
		>
			<SheetHeader class="sr-only">
				<SheetTitle>Sidebar</SheetTitle>
				<SheetDescription>Displays the mobile sidebar.</SheetDescription>
			</SheetHeader>
			<div class="flex h-full w-full flex-col">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</SheetContent>
	</Sheet>
{:else}
	<div
		class="group peer hidden text-sidebar-foreground md:block"
		data-state={ctx.state}
		data-collapsible={ctx.state === 'collapsed' ? collapsible : ''}
		data-variant={variant}
		data-side={side}
		data-slot="sidebar"
	>
		<div
			data-slot="sidebar-gap"
			class={cn(
				'relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear',
				'group-data-[collapsible=offcanvas]:w-0',
				'group-data-[side=right]:rotate-180',
				variant === 'floating' || variant === 'inset'
					? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]'
					: 'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]'
			)}
		></div>
		<div
			data-slot="sidebar-container"
			data-side={side}
			class={cn(
				'fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex',
				'data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]',
				'data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
				variant === 'floating' || variant === 'inset'
					? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]'
					: 'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l',
				className
			)}
			{...restProps}
		>
			<div
				data-sidebar="sidebar"
				data-slot="sidebar-inner"
				class="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-2xl group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
			>
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
