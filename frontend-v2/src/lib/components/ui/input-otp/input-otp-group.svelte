<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div
	data-slot="input-otp-group"
	class={cn(
		'flex items-center rounded-xl has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
