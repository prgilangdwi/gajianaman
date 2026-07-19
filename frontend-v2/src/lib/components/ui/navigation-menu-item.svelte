<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLLIElement> & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<li data-slot="navigation-menu-item" class={cn('relative', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</li>
