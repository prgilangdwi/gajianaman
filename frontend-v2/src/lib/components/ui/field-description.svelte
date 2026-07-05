<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLParagraphElement> & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<p
	data-slot="field-description"
	class={cn(
		'text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5 last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</p>
