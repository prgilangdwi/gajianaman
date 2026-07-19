<script lang="ts">
	import { cn } from '$lib/utils';
	import Label from './label.svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLLabelAttributes & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<Label
	data-slot="field-label"
	class={cn(
		'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:bg-input/30 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4 has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</Label>
