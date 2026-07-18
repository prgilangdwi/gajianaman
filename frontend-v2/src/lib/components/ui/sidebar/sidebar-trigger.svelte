<script lang="ts">
	import { cn } from '$lib/utils';
	import { PanelLeft } from 'lucide-svelte';
	import Button from '../button.svelte';
	import type { ButtonVariant, ButtonSize } from '../button.svelte';
	import { useSidebar } from './sidebar-context.svelte';

	type Props = {
		class?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		onclick?: (e: MouseEvent) => void;
		[key: string]: unknown;
	};

	let { class: className, variant = 'ghost', size = 'icon-sm', onclick, ...restProps }: Props = $props();

	const ctx = useSidebar();

	function handleClick(event: MouseEvent) {
		onclick?.(event);
		ctx.toggleSidebar();
	}
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	{variant}
	{size}
	class={cn(className)}
	onclick={handleClick}
	{...restProps}
>
	<PanelLeft class="size-4" />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
