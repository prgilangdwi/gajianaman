<script lang="ts">
	import { cn } from '$lib/utils';
	import Textarea from '../textarea.svelte';

	type Props = {
		class?: string;
		value?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<Textarea
	data-slot="input-group-control"
	class={cn(
		'flex-1 resize-none rounded-none border-0 bg-transparent py-2.5 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
		className
	)}
	{...restProps}
/>
