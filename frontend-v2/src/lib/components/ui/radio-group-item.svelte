<script lang="ts">
	import { cn } from '$lib/utils';
	import { getRadioGroupContext } from './radio-group.svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		value: string;
	};

	let { class: className, value, ...restProps }: Props = $props();

	const context = getRadioGroupContext();
	const isChecked = $derived(context?.value === value);

	function handleClick() {
		context?.setValue(value);
	}
</script>

<button
	type="button"
	role="radio"
	aria-checked={isChecked}
	data-slot="radio-group-item"
	data-checked={isChecked || undefined}
	onclick={handleClick}
	class={cn(
		'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-transparent bg-input/90 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[checked]:bg-primary data-[checked]:text-primary-foreground dark:data-[checked]:bg-primary',
		className
	)}
	{...restProps}
>
	{#if isChecked}
		<span data-slot="radio-group-indicator" class="flex size-4 items-center justify-center">
			<span
				class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground dark:size-2.5"
			></span>
		</span>
	{/if}
</button>
