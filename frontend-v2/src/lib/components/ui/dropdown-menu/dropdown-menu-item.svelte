<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		inset?: boolean;
		variant?: 'default' | 'destructive';
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		inset = false,
		variant = 'default',
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<DropdownMenuPrimitive.Item
	{disabled}
	data-slot="dropdown-menu-item"
	data-inset={inset || undefined}
	data-variant={variant}
	class={cn(
		'group/dropdown-menu-item relative flex cursor-default items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[inset]:pl-9.5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Item>
