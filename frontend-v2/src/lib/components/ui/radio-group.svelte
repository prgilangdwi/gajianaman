<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	export type RadioGroupContext = {
		value: string;
		setValue: (val: string) => void;
	};

	const RADIO_GROUP_KEY = Symbol('radio-group');

	export function getRadioGroupContext(): RadioGroupContext | undefined {
		return getContext<RadioGroupContext>(RADIO_GROUP_KEY);
	}

	export function setRadioGroupContext(ctx: RadioGroupContext) {
		setContext(RADIO_GROUP_KEY, ctx);
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		value?: string;
		children?: Snippet;
	};

	let { class: className, value = $bindable(''), children, ...restProps }: Props = $props();

	setRadioGroupContext({
		get value() {
			return value;
		},
		setValue: (val: string) => {
			value = val;
		}
	});
</script>

<div
	role="radiogroup"
	data-slot="radio-group"
	class={cn('grid w-full gap-3', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
