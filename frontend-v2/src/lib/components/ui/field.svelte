<script lang="ts" module>
	import { cva, type VariantProps } from 'class-variance-authority';

	export const fieldVariants = cva(
		'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
		{
			variants: {
				orientation: {
					vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
					horizontal:
						'flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
					responsive:
						'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px'
				}
			},
			defaultVariants: {
				orientation: 'vertical'
			}
		}
	);

	export type FieldOrientation = VariantProps<typeof fieldVariants>['orientation'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		orientation?: FieldOrientation;
		invalid?: boolean;
		disabled?: boolean;
		children?: Snippet;
	};

	let {
		class: className,
		orientation = 'vertical',
		invalid = false,
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<div
	role="group"
	data-slot="field"
	data-orientation={orientation}
	data-invalid={invalid || undefined}
	data-disabled={disabled || undefined}
	class={cn(fieldVariants({ orientation }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
