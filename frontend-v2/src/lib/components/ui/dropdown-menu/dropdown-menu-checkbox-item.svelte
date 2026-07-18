<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Check } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		inset?: boolean;
		disabled?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		checked = $bindable(false),
		onCheckedChange,
		inset = false,
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
	bind:checked
	{onCheckedChange}
	{disabled}
	data-slot="dropdown-menu-checkbox-item"
	data-inset={inset || undefined}
	class={cn(
		'relative flex cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-[inset]:pl-9.5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
		className
	)}
	{...restProps}
>
	<span
		class="pointer-events-none absolute right-2 flex items-center justify-center"
		data-slot="dropdown-menu-checkbox-item-indicator"
	>
		{#if checked}
			<Check class="size-4" strokeWidth={2} />
		{/if}
	</span>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.CheckboxItem>
