<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const inputGroupButtonVariants = cva(
		'flex items-center gap-2 rounded-xl text-sm shadow-none',
		{
			variants: {
				size: {
					xs: "h-6 gap-1 rounded-lg px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
					sm: '',
					'icon-xs': 'size-6 rounded-lg p-0 has-[>svg]:p-0',
					'icon-sm': 'size-8 p-0 has-[>svg]:p-0'
				}
			},
			defaultVariants: {
				size: 'xs'
			}
		}
	);

	export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>['size'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '../button.svelte';
	import type { ButtonVariant } from '../button.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		variant?: ButtonVariant;
		size?: InputGroupButtonSize;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		type = 'button',
		variant = 'ghost',
		size = 'xs',
		children,
		...restProps
	}: Props = $props();
</script>

<Button
	{type}
	data-size={size}
	{variant}
	class={cn(inputGroupButtonVariants({ size }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</Button>
