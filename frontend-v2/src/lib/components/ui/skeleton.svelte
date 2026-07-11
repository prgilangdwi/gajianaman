<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<div data-slot="skeleton" class={cn('animate-pulse rounded-2xl bg-muted', className)} {...restProps}
></div>
