<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const sidebarMenuButtonVariants = cva(
		'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!',
		{
			variants: {
				variant: {
					default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
					outline:
						'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]'
				},
				size: {
					default: 'h-9 text-sm',
					sm: 'h-8 text-xs',
					lg: 'h-14 px-3 text-sm group-data-[collapsible=icon]:p-0!'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	export type SidebarMenuButtonVariant = VariantProps<typeof sidebarMenuButtonVariants>['variant'];
	export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>['size'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: SidebarMenuButtonVariant;
		size?: SidebarMenuButtonSize;
		isActive?: boolean;
		href?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		isActive = false,
		href,
		children,
		...restProps
	}: Props = $props();
</script>

{#if href}
	<a
		{href}
		data-slot="sidebar-menu-button"
		data-sidebar="menu-button"
		data-size={size}
		data-active={isActive}
		class={cn(sidebarMenuButtonVariants({ variant, size }), className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button
		data-slot="sidebar-menu-button"
		data-sidebar="menu-button"
		data-size={size}
		data-active={isActive}
		class={cn(sidebarMenuButtonVariants({ variant, size }), className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
