<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLUListElement> & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<ul
	data-slot="navigation-menu-list"
	class={cn('group flex flex-1 list-none items-center justify-center gap-0', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ul>
