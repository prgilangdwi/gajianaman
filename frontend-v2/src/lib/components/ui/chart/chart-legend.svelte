<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { ChartConfig } from './chart-container.svelte';

	type LegendPayloadItem = {
		value?: string;
		dataKey?: string;
		color?: string;
		type?: string;
	};

	type Props = {
		class?: string;
		payload?: LegendPayloadItem[];
		verticalAlign?: 'top' | 'bottom';
		hideIcon?: boolean;
		nameKey?: string;
	};

	let {
		class: className,
		payload = [],
		verticalAlign = 'bottom',
		hideIcon = false,
		nameKey
	}: Props = $props();

	const chartContext = getContext<{ config: () => ChartConfig } | null>('chart-config');
	const config = $derived(chartContext?.config() ?? {});

	function getPayloadConfig(item: LegendPayloadItem, key: string) {
		if (!item) return undefined;
		return key in config ? config[key] : config[item.dataKey ?? 'value'];
	}

	const visiblePayload = $derived(payload?.filter((item) => item.type !== 'none') ?? []);
</script>

{#if visiblePayload.length > 0}
	<div
		class={cn(
			'flex items-center justify-center gap-4',
			verticalAlign === 'top' ? 'pb-3' : 'pt-3',
			className
		)}
	>
		{#each visiblePayload as item, index}
			{@const key = nameKey ?? item.dataKey ?? 'value'}
			{@const itemConfig = getPayloadConfig(item, key)}
			<div
				class={cn(
					'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
				)}
			>
				{#if itemConfig?.icon && !hideIcon}
					{@const Icon = itemConfig.icon}
					<Icon />
				{:else}
					<div
						class="h-2 w-2 shrink-0 rounded-[2px]"
						style:background-color={item.color}
					></div>
				{/if}
				<span class="text-sm text-muted-foreground">{itemConfig?.label ?? item.value}</span>
			</div>
		{/each}
	</div>
{/if}
