<script lang="ts">
	import '../app.css';
	import Toaster from '$lib/components/ui/sonner.svelte';

	let { children, data } = $props();
</script>

<Toaster position="top-right" duration={5000} closeButton richColors />

<svelte:head>
	<title>Gajian Aman</title>
	<meta name="description" content="Personal finance tracker for Indonesian users" />
</svelte:head>

{@render children()}
