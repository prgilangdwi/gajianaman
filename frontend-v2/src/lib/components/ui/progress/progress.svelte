<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		value?: number;
		max?: number;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, value = 0, max = 100, children, ...restProps }: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div
	data-slot="progress"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	class={cn('flex flex-wrap gap-3', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	<div
		data-slot="progress-track"
		class="relative flex h-3 w-full items-center overflow-x-hidden rounded-full bg-muted"
	>
		<div
			data-slot="progress-indicator"
			class="h-full bg-primary transition-all"
			style="width: {percentage}%"
		></div>
	</div>
</div>
