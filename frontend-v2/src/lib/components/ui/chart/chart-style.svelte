<script lang="ts">
	import type { ChartConfig } from './chart-container.svelte';

	type Props = {
		id: string;
		config: ChartConfig;
	};

	let { id, config }: Props = $props();

	const THEMES = { light: '', dark: '.dark' } as const;

	const colorConfig = $derived(
		Object.entries(config).filter(([, cfg]) => cfg.theme ?? cfg.color)
	);

	const styleContent = $derived(
		colorConfig.length === 0
			? ''
			: Object.entries(THEMES)
					.map(([theme, prefix]) => {
						const vars = colorConfig
							.map(([key, itemConfig]) => {
								const color =
									itemConfig.theme?.[theme as keyof typeof THEMES] ?? itemConfig.color;
								return color ? `  --color-${key}: ${color};` : null;
							})
							.filter(Boolean)
							.join('\n');
						return `${prefix} [data-chart=${id}] {\n${vars}\n}`;
					})
					.join('\n')
	);
</script>

{#if colorConfig.length > 0}
	{@html `<style>${styleContent}</style>`}
{/if}
