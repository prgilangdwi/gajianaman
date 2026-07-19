<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const emptyMediaVariants = cva(
		'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
		{
			variants: {
				variant: {
					default: 'bg-transparent',
					icon: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground [&_svg:not([class*='size-'])]:size-5"
				}
			},
			defaultVariants: {
				variant: 'default'
			}
		}
	);

	export type EmptyMediaVariant = VariantProps<typeof emptyMediaVariants>['variant'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: EmptyMediaVariant;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, variant = 'default', children, ...restProps }: Props = $props();
</script>

<div
	data-slot="empty-icon"
	data-variant={variant}
	class={cn(emptyMediaVariants({ variant }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
