<script lang="ts">
	import { cn } from '$lib/utils';
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-svelte';
	import { buttonVariants } from '../button.svelte';
	import type { Snippet } from 'svelte';
	import type { DateValue } from '@internationalized/date';

	type Props = CalendarPrimitive.RootProps & {
		class?: string;
		buttonVariant?: 'ghost' | 'outline';
	};

	let {
		class: className,
		buttonVariant = 'ghost',
		...restProps
	}: Props = $props();
</script>

<CalendarPrimitive.Root
	data-slot="calendar"
	class={cn(
		'group/calendar bg-background p-3 [--cell-radius:var(--radius-xl)] [--cell-size:2rem]',
		className
	)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<CalendarPrimitive.Header class="relative flex w-full items-center justify-between gap-1">
			<CalendarPrimitive.PrevButton
				class={cn(
					buttonVariants({ variant: buttonVariant }),
					'size-[var(--cell-size)] p-0 select-none aria-disabled:opacity-50'
				)}
			>
				<ChevronLeft class="size-4" />
			</CalendarPrimitive.PrevButton>
			<CalendarPrimitive.Heading
				class="flex h-[var(--cell-size)] items-center justify-center text-sm font-medium select-none"
			/>
			<CalendarPrimitive.NextButton
				class={cn(
					buttonVariants({ variant: buttonVariant }),
					'size-[var(--cell-size)] p-0 select-none aria-disabled:opacity-50'
				)}
			>
				<ChevronRight class="size-4" />
			</CalendarPrimitive.NextButton>
		</CalendarPrimitive.Header>
		{#each months as month (month.value.toString())}
			<CalendarPrimitive.Grid class="mt-4 w-full border-collapse">
				<CalendarPrimitive.GridHead>
					<CalendarPrimitive.GridRow class="flex">
						{#each weekdays as weekday}
							<CalendarPrimitive.HeadCell
								class="flex-1 rounded-[var(--cell-radius)] text-[0.8rem] font-normal text-muted-foreground select-none"
							>
								{weekday.slice(0, 2)}
							</CalendarPrimitive.HeadCell>
						{/each}
					</CalendarPrimitive.GridRow>
				</CalendarPrimitive.GridHead>
				<CalendarPrimitive.GridBody>
					{#each month.weeks as week, weekIndex}
						<CalendarPrimitive.GridRow class="mt-2 flex w-full">
							{#each week as date}
								<CalendarPrimitive.Cell
									{date}
									month={month.value}
									class="group/day relative aspect-square h-full w-full rounded-[var(--cell-radius)] p-0 text-center select-none"
								>
									<CalendarPrimitive.Day
										class={cn(
											buttonVariants({ variant: 'ghost' }),
											'relative isolate z-10 flex aspect-square size-auto w-full min-w-[var(--cell-size)] flex-col gap-1 border-0 leading-none font-normal',
											'data-[selected]:bg-primary data-[selected]:text-primary-foreground',
											'data-[today]:bg-muted data-[today]:text-foreground',
											'data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50',
											'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
											'data-[unavailable]:text-destructive data-[unavailable]:line-through',
											'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
										)}
									/>
								</CalendarPrimitive.Cell>
							{/each}
						</CalendarPrimitive.GridRow>
					{/each}
				</CalendarPrimitive.GridBody>
			</CalendarPrimitive.Grid>
		{/each}
	{/snippet}
</CalendarPrimitive.Root>
