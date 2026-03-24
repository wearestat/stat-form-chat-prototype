<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { answersStore, setAnswer } from '$lib/stores/answers.svelte.js';

	let { questions, onsubmit } = $props();

	let isSubmitted = $state(false);

	function handleSubmit(event) {
		event.preventDefault();
		isSubmitted = true;
		onsubmit?.(answersStore.data);
	}

	function handleEdit() {
		isSubmitted = false;
	}
</script>

{#if isSubmitted}
	<div class="bg-card rounded-2xl border p-10 shadow-sm text-center">
		<div
			class="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold"
		>
			✓
		</div>
		<h2 class="mb-1 text-lg font-semibold">Form submitted</h2>
		<p class="text-muted-foreground mb-6 text-sm">Your responses have been recorded.</p>
		<Button type="button" variant="outline" onclick={handleEdit}>Edit responses</Button>
	</div>
{:else}
	<form onsubmit={handleSubmit} class="bg-card flex flex-col gap-6 rounded-2xl border p-6 shadow-sm">
		{#each questions as question}
			<div class="flex flex-col gap-2">
				<label for={question.id} class="text-sm font-medium leading-none">
					{question.question}
				</label>

				{#if question.type === 'text'}
					<input
						id={question.id}
						type="text"
						value={answersStore.data[question.id] ?? ''}
						oninput={(e) => setAnswer(question.id, e.currentTarget.value)}
						class="border-input bg-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
						placeholder="Enter your answer"
						autocomplete="off"
					/>
				{:else if question.type === 'multiple_choice'}
					<div class="flex flex-wrap gap-2">
						{#each question.options ?? [] as option}
							<button
								type="button"
								class={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
									answersStore.data[question.id] === option
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-border bg-background hover:bg-muted'
								}`}
								onclick={() => setAnswer(question.id, option)}
							>
								{option}
							</button>
						{/each}
					</div>
				{:else if question.type === 'select'}
					<select
						id={question.id}
						onchange={(e) => setAnswer(question.id, e.currentTarget.value)}
						class="border-input bg-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
					>
						<option value="" disabled selected={!answersStore.data[question.id]}>
							Select an option
						</option>
						{#each question.options ?? [] as option}
							<option value={option} selected={answersStore.data[question.id] === option}>
								{option}
							</option>
						{/each}
					</select>
				{/if}
			</div>
		{/each}

		<div class="flex justify-end border-t pt-4">
			<Button type="submit">Submit Form</Button>
		</div>
	</form>
{/if}
