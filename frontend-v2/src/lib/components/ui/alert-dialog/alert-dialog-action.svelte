<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '../button.svelte';
	import type { ButtonVariant, ButtonSize } from '../button.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		onclick?: () => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		onclick,
		children,
		...restProps
	}: Props = $props();
</script>

<Button
	data-slot="alert-dialog-action"
	{variant}
	{size}
	{onclick}
	class={cn(className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</Button>
