<script lang="ts">
	import { cn } from '$lib/utils';
	import { Minus } from 'lucide-svelte';

	type Props = {
		class?: string;
		[key: string]: unknown;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<div
	data-slot="input-otp-separator"
	class={cn("flex items-center [&_svg:not([class*='size-'])]:size-4", className)}
	role="separator"
	{...restProps}
>
	<Minus class="size-4" />
</div>
