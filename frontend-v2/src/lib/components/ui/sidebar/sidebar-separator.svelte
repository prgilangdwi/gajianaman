<script lang="ts">
	import { cn } from '$lib/utils';
	import Separator from '../separator.svelte';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<Separator
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn('mx-2 w-auto bg-sidebar-border', className)}
	{...restProps}
/>
