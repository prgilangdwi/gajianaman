<script lang="ts">
	import { cn } from '$lib/utils';
	import { toggleVariants, type ToggleVariant, type ToggleSize } from './toggle.svelte';
	import { getToggleGroupContext } from './toggle-group.svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLButtonAttributes & {
		value: string;
		variant?: ToggleVariant;
		size?: ToggleSize;
		children?: Snippet;
	};

	let {
		class: className,
		value,
		variant = 'default',
		size = 'default',
		children,
		...restProps
	}: Props = $props();

	const context = getToggleGroupContext();
	const ctxVariant = $derived(context?.variant ?? variant);
	const ctxSize = $derived(context?.size ?? size);
	const isPressed = $derived(context?.value.includes(value) ?? false);

	function handleClick() {
		context?.toggle(value);
	}
</script>

<button
	type="button"
	data-slot="toggle-group-item"
	data-variant={ctxVariant}
	data-size={ctxSize}
	data-spacing={context?.spacing}
	data-state={isPressed ? 'on' : 'off'}
	aria-pressed={isPressed}
	onclick={handleClick}
	class={cn(
		'shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-3 group-data-[spacing=0]/toggle-group:shadow-none focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-[data-icon=inline-end]:pr-2.5 group-data-[spacing=0]/toggle-group:has-[data-icon=inline-start]:pl-2.5 group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:first:rounded-l-3xl group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:first:rounded-t-3xl group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:last:rounded-r-3xl group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:last:rounded-b-3xl data-[state=on]:bg-muted group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t',
		toggleVariants({ variant: ctxVariant, size: ctxSize }),
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>
