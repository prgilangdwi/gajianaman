<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		placeholder?: string;
		[key: string]: unknown;
	};

	let { class: className, placeholder, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Value
	data-slot="select-value"
	{placeholder}
	class={cn('flex flex-1 text-left', className)}
	{...restProps}
/>
