<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const inputGroupAddonVariants = cva(
		"flex h-auto cursor-text items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-4",
		{
			variants: {
				align: {
					'inline-start': 'order-first pl-3 has-[>button]:-ml-1',
					'inline-end': 'order-last pr-3 has-[>button]:-mr-1',
					'block-start': 'order-first w-full justify-start px-3 pt-3',
					'block-end': 'order-last w-full justify-start px-3 pb-3'
				}
			},
			defaultVariants: {
				align: 'inline-start'
			}
		}
	);

	export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>['align'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		align?: InputGroupAddonAlign;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, align = 'inline-start', children, ...restProps }: Props = $props();

	function handleClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('button')) return;
		(e.currentTarget as HTMLElement).parentElement?.querySelector('input')?.focus();
	}
</script>

<div
	role="group"
	data-slot="input-group-addon"
	data-align={align}
	class={cn(inputGroupAddonVariants({ align }), className)}
	onclick={handleClick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
