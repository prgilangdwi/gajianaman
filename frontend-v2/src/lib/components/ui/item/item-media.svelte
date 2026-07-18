<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const itemMediaVariants = cva(
		'flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none',
		{
			variants: {
				variant: {
					default: 'bg-transparent',
					icon: "[&_svg:not([class*='size-'])]:size-4",
					image:
						'size-10 overflow-hidden rounded-xl group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 group-data-[size=xs]/item:rounded-lg [&_img]:size-full [&_img]:object-cover'
				}
			},
			defaultVariants: {
				variant: 'default'
			}
		}
	);

	export type ItemMediaVariant = VariantProps<typeof itemMediaVariants>['variant'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: ItemMediaVariant;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, variant = 'default', children, ...restProps }: Props = $props();
</script>

<div
	data-slot="item-media"
	data-variant={variant}
	class={cn(itemMediaVariants({ variant }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
