<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const tabsListVariants = cva(
		'group/tabs-list inline-flex w-fit items-center justify-center rounded-full p-1 text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:rounded-2xl data-[variant=line]:rounded-none',
		{
			variants: {
				variant: {
					default: 'bg-muted',
					line: 'gap-1 bg-transparent'
				}
			},
			defaultVariants: {
				variant: 'default'
			}
		}
	);

	export type TabsListVariant = VariantProps<typeof tabsListVariants>['variant'];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: TabsListVariant;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, variant = 'default', children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.List
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TabsPrimitive.List>
