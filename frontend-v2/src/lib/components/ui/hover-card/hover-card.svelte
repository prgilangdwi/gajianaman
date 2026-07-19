<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';

	type Props = HoverCardPrimitive.RootProps;

	let { ...restProps }: Props = $props();
</script>

<HoverCardPrimitive.Root {...restProps} />
