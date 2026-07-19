<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		inset?: boolean;
		children?: Snippet;
	};

	let { class: className, inset = false, children, ...restProps }: Props = $props();
</script>

<div
	data-slot="dropdown-menu-label"
	data-inset={inset || undefined}
	class={cn('px-3 py-2.5 text-xs text-muted-foreground data-[inset]:pl-9.5', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
