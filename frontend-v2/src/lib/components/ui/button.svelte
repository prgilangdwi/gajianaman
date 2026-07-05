<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const buttonVariants = cva(
		"[&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-[box-shadow,scale] active:scale-[0.96] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 disabled:active:scale-100 sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		{
			defaultVariants: {
				size: 'default',
				variant: 'default'
			},
			variants: {
				size: {
					default: 'h-9 px-[calc(var(--spacing)_*_3_-_1px)] sm:h-8',
					icon: 'size-9 sm:size-8',
					'icon-lg': 'size-10 sm:size-9',
					'icon-sm': 'size-8 sm:size-7',
					'icon-xl':
						"size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
					'icon-xs':
						"size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
					lg: 'h-10 px-[calc(var(--spacing)_*_3.5_-_1px)] sm:h-9',
					sm: 'h-8 gap-1.5 px-[calc(var(--spacing)_*_2.5_-_1px)] sm:h-7',
					xl: "h-11 px-[calc(var(--spacing)_*_4_-_1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
					xs: "h-7 gap-1 rounded-md px-[calc(var(--spacing)_*_2_-_1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5"
				},
				variant: {
					default:
						'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs hover:bg-primary/90 data-[pressed]:bg-primary/90 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none',
					destructive:
						'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive/90 data-[pressed]:bg-destructive/90 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none',
					'destructive-outline':
						'border-input bg-popover not-dark:bg-clip-padding text-destructive-foreground shadow-xs/5 not-disabled:not-active:not-data-[pressed]:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 data-[pressed]:border-destructive/32 data-[pressed]:bg-destructive/4 dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-[pressed]:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none',
					ghost: 'border-transparent text-foreground hover:bg-accent data-[pressed]:bg-accent',
					link: 'border-transparent underline-offset-4 hover:underline data-[pressed]:underline',
					outline:
						'border-input bg-popover not-dark:bg-clip-padding text-foreground shadow-xs/5 not-disabled:not-active:not-data-[pressed]:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 data-[pressed]:bg-accent/50 dark:bg-input/32 dark:data-[pressed]:bg-input/64 dark:hover:bg-input/64 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-[pressed]:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none',
					secondary:
						'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 data-[pressed]:bg-secondary/90 [:active,[data-pressed]]:bg-secondary/80'
				}
			}
		}
	);

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import Spinner from './spinner.svelte';

	type Props = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		isLoading?: boolean;
		loadingText?: string;
		children?: Snippet;
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		type = 'button',
		disabled = false,
		isLoading = false,
		loadingText,
		children,
		...restProps
	}: Props = $props();

	const isDisabled = $derived(disabled || isLoading);
</script>

<button
	data-slot="button"
	data-loading={isLoading || undefined}
	aria-busy={isLoading || undefined}
	{type}
	disabled={isDisabled}
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
>
	{#if isLoading}
		<Spinner class="size-4" />
		{#if loadingText}
			<span data-slot="button-content">{loadingText}</span>
		{:else if children}
			<span data-slot="button-content">{@render children()}</span>
		{/if}
	{:else if children}
		{@render children()}
	{/if}
</button>
