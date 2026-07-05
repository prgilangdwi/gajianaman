<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAnchorAttributes & {
		active?: boolean;
		children?: Snippet;
	};

	let { class: className, active = false, children, ...restProps }: Props = $props();
</script>

<a
	data-slot="navigation-menu-link"
	data-active={active || undefined}
	class={cn(
		"flex items-center gap-1.5 rounded-3xl p-3 text-sm transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 in-data-[slot=navigation-menu-content]:rounded-2xl data-[active=true]:bg-muted/50 data-[active=true]:hover:bg-muted data-[active=true]:focus:bg-muted [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</a>
