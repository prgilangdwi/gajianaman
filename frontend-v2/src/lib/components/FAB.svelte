<script lang="ts">
	import { Plus } from 'lucide-svelte';

	let { onclick }: { onclick: () => void } = $props();
</script>

<button
	type="button"
	{onclick}
	class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
	aria-label="Add transaction"
>
	<Plus class="h-6 w-6" />
</button>
