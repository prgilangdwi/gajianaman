<script lang="ts">
	import { cn } from '$lib/utils';
	import { LoaderCircle } from 'lucide-svelte';

	let { class: className, ...restProps }: { class?: string } = $props();
</script>

<LoaderCircle
	data-slot="spinner"
	role="status"
	aria-label="Loading"
	class={cn('size-4 animate-spin', className)}
	{...restProps}
/>
