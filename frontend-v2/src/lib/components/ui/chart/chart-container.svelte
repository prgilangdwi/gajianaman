<script lang="ts" module>
	import type { ComponentType } from 'svelte';

	export type ChartConfig = Record<
		string,
		{
			label?: string;
			icon?: ComponentType;
		} & (
			| { color?: string; theme?: never }
			| { color?: never; theme: Record<'light' | 'dark', string> }
		)
	>;
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import ChartStyle from './chart-style.svelte';

	type Props = {
		class?: string;
		id?: string;
		config: ChartConfig;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, id, config, children, ...restProps }: Props = $props();

	const chartId = $derived(`chart-${id ?? Math.random().toString(36).slice(2, 9)}`);

	setContext('chart-config', { config: () => config });
</script>

<div
	data-slot="chart"
	data-chart={chartId}
	class={cn(
		'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-surface]:outline-hidden',
		className
	)}
	{...restProps}
>
	<ChartStyle id={chartId} {config} />
	{#if children}
		{@render children()}
	{/if}
</div>
