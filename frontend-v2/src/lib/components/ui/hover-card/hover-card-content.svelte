<script lang="ts">
	import { cn } from '$lib/utils';
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = HoverCardPrimitive.ContentProps & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<HoverCardPrimitive.Portal>
	<HoverCardPrimitive.Content
		data-slot="hover-card-content"
		class={cn(
			'z-50 w-72 origin-[var(--bits-link-preview-content-transform-origin)] rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-hidden dark:ring-foreground/10',
			'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
			'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</HoverCardPrimitive.Content>
</HoverCardPrimitive.Portal>
