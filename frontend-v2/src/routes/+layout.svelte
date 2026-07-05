<script lang="ts">
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>Gajian Aman</title>
	<meta name="description" content="Personal finance tracker for Indonesian users" />
</svelte:head>

{@render children()}
