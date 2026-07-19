<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		errors?: Array<{ message?: string } | undefined>;
		children?: Snippet;
	};

	let { class: className, errors, children, ...restProps }: Props = $props();

	const uniqueErrors = $derived(() => {
		if (!errors?.length) return [];
		const seen = new Set<string>();
		return errors.filter((e) => {
			if (!e?.message || seen.has(e.message)) return false;
			seen.add(e.message);
			return true;
		});
	});

	const hasContent = $derived(children || (errors && errors.length > 0));
</script>

{#if hasContent}
	<div
		role="alert"
		data-slot="field-error"
		class={cn('text-sm font-normal text-destructive', className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{:else if uniqueErrors().length === 1}
			{uniqueErrors()[0]?.message}
		{:else if uniqueErrors().length > 1}
			<ul class="ml-4 flex list-disc flex-col gap-1">
				{#each uniqueErrors() as error}
					{#if error?.message}
						<li>{error.message}</li>
					{/if}
				{/each}
			</ul>
		{/if}
	</div>
{/if}
