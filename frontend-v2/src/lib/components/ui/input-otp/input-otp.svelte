<script lang="ts">
	import { cn } from '$lib/utils';
	import { PinInput as PinInputPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = PinInputPrimitive.RootProps & {
		class?: string;
		containerClass?: string;
		children?: Snippet;
	};

	let { class: className, containerClass, children, ...restProps }: Props = $props();
</script>

<PinInputPrimitive.Root
	data-slot="input-otp"
	class={cn('flex items-center has-[:disabled]:opacity-50', containerClass)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</PinInputPrimitive.Root>
