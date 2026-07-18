<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Snippet, ComponentType } from 'svelte';
	import type { ChartConfig } from './chart-container.svelte';

	type PayloadItem = {
		name?: string;
		value?: number | string;
		dataKey?: string;
		color?: string;
		fill?: string;
		payload?: Record<string, unknown>;
		type?: string;
	};

	type Props = {
		class?: string;
		active?: boolean;
		payload?: PayloadItem[];
		label?: string;
		labelKey?: string;
		nameKey?: string;
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: 'line' | 'dot' | 'dashed';
		labelClassName?: string;
		labelFormatter?: (value: string | undefined, payload: PayloadItem[]) => string;
		formatter?: (
			value: number | string | undefined,
			name: string | undefined,
			item: PayloadItem,
			index: number,
			payload: Record<string, unknown> | undefined
		) => Snippet | string;
		color?: string;
	};

	let {
		class: className,
		active = false,
		payload = [],
		label,
		labelKey,
		nameKey,
		hideLabel = false,
		hideIndicator = false,
		indicator = 'dot',
		labelClassName,
		labelFormatter,
		formatter,
		color
	}: Props = $props();

	const chartContext = getContext<{ config: () => ChartConfig } | null>('chart-config');
	const config = $derived(chartContext?.config() ?? {});

	function getPayloadConfig(item: PayloadItem, key: string) {
		if (!item) return undefined;

		const payloadPayload = item.payload ?? {};
		let configLabelKey = key;

		if (key in item && typeof item[key as keyof PayloadItem] === 'string') {
			configLabelKey = item[key as keyof PayloadItem] as string;
		} else if (key in payloadPayload && typeof payloadPayload[key] === 'string') {
			configLabelKey = payloadPayload[key] as string;
		}

		return configLabelKey in config ? config[configLabelKey] : config[key];
	}

	const tooltipLabel = $derived.by(() => {
		if (hideLabel || !payload?.length) return null;

		const item = payload[0];
		const key = labelKey ?? item?.dataKey ?? item?.name ?? 'value';
		const itemConfig = getPayloadConfig(item, key);
		const value =
			!labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label;

		if (labelFormatter && payload) {
			return labelFormatter(value, payload);
		}

		return value;
	});

	const nestLabel = $derived(payload?.length === 1 && indicator !== 'dot');
	const visiblePayload = $derived(payload?.filter((item) => item.type !== 'none') ?? []);
</script>

{#if active && visiblePayload.length > 0}
	<div
		class={cn(
			'grid min-w-32 items-start gap-1.5 rounded-xl bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10',
			className
		)}
	>
		{#if !nestLabel && tooltipLabel}
			<div class={cn('font-medium', labelClassName)}>{tooltipLabel}</div>
		{/if}
		<div class="grid gap-1.5">
			{#each visiblePayload as item, index}
				{@const key = nameKey ?? item.name ?? item.dataKey ?? 'value'}
				{@const itemConfig = getPayloadConfig(item, key)}
				{@const indicatorColor = color ?? (item.payload?.fill as string | undefined) ?? item.color}
				<div
					class={cn(
						'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
						indicator === 'dot' && 'items-center'
					)}
				>
					{#if formatter && item.value !== undefined && item.name}
						{@const formatted = formatter(item.value, item.name, item, index, item.payload)}
						{#if typeof formatted === 'string'}
							{formatted}
						{:else}
							{@render formatted()}
						{/if}
					{:else}
						{#if itemConfig?.icon}
							{@const Icon = itemConfig.icon}
							<Icon />
						{:else if !hideIndicator}
							<div
								class={cn('shrink-0 rounded-[2px]', {
									'h-2.5 w-2.5': indicator === 'dot',
									'w-1': indicator === 'line',
									'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
									'my-0.5': nestLabel && indicator === 'dashed'
								})}
								style:background-color={indicatorColor}
								style:border-color={indicatorColor}
							></div>
						{/if}
						<div
							class={cn(
								'flex flex-1 justify-between leading-none',
								nestLabel ? 'items-end' : 'items-center'
							)}
						>
							<div class="grid gap-1.5">
								{#if nestLabel && tooltipLabel}
									<div class={cn('font-medium', labelClassName)}>{tooltipLabel}</div>
								{/if}
								<span class="text-muted-foreground">
									{itemConfig?.label ?? item.name}
								</span>
							</div>
							{#if item.value != null}
								<span class="font-mono font-medium text-foreground tabular-nums">
									{typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
								</span>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
