<script lang="ts">
	import { cn } from '$lib/utils';
	import { PinInput as PinInputPrimitive } from 'bits-ui';

	type Props = PinInputPrimitive.CellProps & {
		class?: string;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<PinInputPrimitive.Cell
	data-slot="input-otp-slot"
	class={cn(
		'relative flex size-9 items-center justify-center border-y border-r border-input bg-input/50 text-sm transition-all outline-none',
		'first:rounded-l-xl first:border-l last:rounded-r-xl',
		'aria-invalid:border-destructive',
		'data-[active]:z-10 data-[active]:border-ring data-[active]:ring-3 data-[active]:ring-ring/30',
		'data-[active]:aria-invalid:ring-destructive/20 dark:data-[active]:aria-invalid:ring-destructive/40',
		className
	)}
	{...restProps}
/>
