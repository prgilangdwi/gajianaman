<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		value?: string;
		size?: 'sm' | 'default';
		[key: string]: unknown;
	};

	let {
		class: className,
		checked = $bindable(false),
		onCheckedChange,
		disabled = false,
		required = false,
		name,
		value,
		size = 'default',
		...restProps
	}: Props = $props();
</script>

<SwitchPrimitive.Root
	bind:checked
	{onCheckedChange}
	{disabled}
	{required}
	{name}
	{value}
	data-slot="switch"
	data-size={size}
	class={cn(
		'peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:border-transparent data-[state=unchecked]:bg-input/90 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform group-data-[size=default]/switch:h-4 group-data-[size=default]/switch:w-6 group-data-[size=sm]/switch:h-3 group-data-[size=sm]/switch:w-4 data-[state=checked]:translate-x-[calc(100%-8px)] dark:data-[state=checked]:bg-primary-foreground data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-foreground"
	/>
</SwitchPrimitive.Root>
