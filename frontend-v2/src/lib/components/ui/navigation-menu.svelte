<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const navigationMenuTriggerStyle = cva(
		'group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-3xl px-4.5 py-2.5 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[open]:bg-muted/50 data-[open]:hover:bg-muted data-[open]:focus:bg-muted'
	);
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLElement> & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<nav
	data-slot="navigation-menu"
	class={cn(
		'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</nav>
