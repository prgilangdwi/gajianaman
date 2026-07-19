<script lang="ts" module>
	import { getContext, setContext } from 'svelte';
	import type { ToggleVariant, ToggleSize } from './toggle.svelte';

	export type ToggleGroupContext = {
		variant: ToggleVariant;
		size: ToggleSize;
		spacing: number;
		orientation: 'horizontal' | 'vertical';
		value: string[];
		toggle: (val: string) => void;
		type: 'single' | 'multiple';
	};

	const TOGGLE_GROUP_KEY = Symbol('toggle-group');

	export function getToggleGroupContext(): ToggleGroupContext | undefined {
		return getContext<ToggleGroupContext>(TOGGLE_GROUP_KEY);
	}

	export function setToggleGroupContext(ctx: ToggleGroupContext) {
		setContext(TOGGLE_GROUP_KEY, ctx);
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: ToggleVariant;
		size?: ToggleSize;
		spacing?: number;
		orientation?: 'horizontal' | 'vertical';
		type?: 'single' | 'multiple';
		value?: string[];
		children?: Snippet;
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		spacing = 2,
		orientation = 'horizontal',
		type = 'single',
		value = $bindable([]),
		children,
		...restProps
	}: Props = $props();

	function toggle(val: string) {
		if (type === 'single') {
			value = value.includes(val) ? [] : [val];
		} else {
			value = value.includes(val) ? value.filter((v) => v !== val) : [...value, val];
		}
	}

	setToggleGroupContext({
		get variant() {
			return variant;
		},
		get size() {
			return size;
		},
		get spacing() {
			return spacing;
		},
		get orientation() {
			return orientation;
		},
		get value() {
			return value;
		},
		toggle,
		get type() {
			return type;
		}
	});
</script>

<div
	data-slot="toggle-group"
	data-variant={variant}
	data-size={size}
	data-spacing={spacing}
	data-orientation={orientation}
	role="group"
	style="--gap: {spacing}"
	class={cn(
		'group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-[spacing=0]:data-[variant=outline]:rounded-3xl data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
