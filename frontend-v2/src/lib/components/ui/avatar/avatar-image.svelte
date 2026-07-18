<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		src?: string;
		alt?: string;
		onload?: () => void;
		onerror?: () => void;
		[key: string]: unknown;
	};

	let { class: className, src, alt = '', onload, onerror, ...restProps }: Props = $props();
</script>

<img
	data-slot="avatar-image"
	{src}
	{alt}
	{onload}
	{onerror}
	class={cn('aspect-square size-full rounded-full object-cover', className)}
	{...restProps}
/>
