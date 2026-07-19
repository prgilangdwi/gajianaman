<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronDown } from 'lucide-svelte';
	import { navigationMenuTriggerStyle } from './navigation-menu.svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLButtonAttributes & {
		open?: boolean;
		children?: Snippet;
	};

	let { class: className, open = false, children, ...restProps }: Props = $props();
</script>

<button
	type="button"
	data-slot="navigation-menu-trigger"
	data-open={open || undefined}
	class={cn(navigationMenuTriggerStyle(), 'group', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	<ChevronDown
		class="relative top-px ml-1 size-3 transition duration-300 group-data-[open]:rotate-180"
		aria-hidden="true"
	/>
</button>
