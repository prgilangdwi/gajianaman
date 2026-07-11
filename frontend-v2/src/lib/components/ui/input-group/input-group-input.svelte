<script lang="ts">
	import { cn } from '$lib/utils';
	import Input from '../input.svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = HTMLInputAttributes & {
		class?: string;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<Input
	data-slot="input-group-control"
	class={cn(
		'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
		className
	)}
	{...restProps}
/>
