<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const toggleVariants = cva(
		"group/toggle inline-flex items-center justify-center gap-1 rounded-3xl text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		{
			variants: {
				variant: {
					default: 'bg-transparent',
					outline: 'border border-input bg-transparent hover:bg-muted'
				},
				size: {
					default:
						'h-9 min-w-9 px-3 has-[data-icon=inline-end]:pr-2.5 has-[data-icon=inline-start]:pl-2.5',
					sm: 'h-8 min-w-8 px-3 has-[data-icon=inline-end]:pr-2 has-[data-icon=inline-start]:pl-2',
					lg: 'h-10 min-w-10 px-4 has-[data-icon=inline-end]:pr-3 has-[data-icon=inline-start]:pl-3'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	export type ToggleVariant = VariantProps<typeof toggleVariants>['variant'];
	export type ToggleSize = VariantProps<typeof toggleVariants>['size'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLButtonAttributes & {
		variant?: ToggleVariant;
		size?: ToggleSize;
		pressed?: boolean;
		children?: Snippet;
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		pressed = $bindable(false),
		children,
		...restProps
	}: Props = $props();

	function handleClick() {
		pressed = !pressed;
	}
</script>

<button
	type="button"
	data-slot="toggle"
	aria-pressed={pressed}
	onclick={handleClick}
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>
