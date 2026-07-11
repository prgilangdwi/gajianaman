<script lang="ts">
	import { cn } from '$lib/utils';
	import Input from '../input.svelte';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<Input
	data-slot="sidebar-input"
	data-sidebar="input"
	class={cn('h-8 w-full bg-input/50 shadow-none', className)}
	{...restProps}
/>
