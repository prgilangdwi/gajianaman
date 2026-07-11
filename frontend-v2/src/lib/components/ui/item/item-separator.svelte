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
	data-slot="item-separator"
	orientation="horizontal"
	class={cn('my-2', className)}
	{...restProps}
/>
