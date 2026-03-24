<script>
	import { tick, untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { answersStore, setAnswer, resetAnswers } from '$lib/stores/answers.svelte.js';

	let { questions } = $props();

	function findStartIndex() {
		for (let i = 0; i < questions.length; i++) {
			if (answersStore.data[questions[i].id] === undefined) {
				return i;
			}
		}
		return questions.length;
	}

	// Use untrack to read initial values without reactive tracking warnings
	const startIndex = untrack(findStartIndex);
	const startComplete = untrack(() => startIndex >= questions.length);
	let currentQuestionIndex = $state(startIndex);
	let currentInput = $state('');
	let inputEl = $state();
	let messagesEl = $state();
	let hasCompleted = $state(startComplete);
	let isSubmitting = $state(false);
	let isAssistantBusy = $state(false);
	let showThinking = $state(false);
	let hasInitialized = $state(false);
	let flowVersion = $state(0);
	let messageIdCounter = $state(0);
	let messages = $state([]);

	const currentQuestion = $derived(questions[currentQuestionIndex]);
	const isTextQuestion = $derived(currentQuestion?.type === 'text');
	const canSubmitText = $derived(
		!isSubmitting && !isAssistantBusy && currentInput.trim().length > 0
	);

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function nextMessageId() {
		messageIdCounter += 1;
		return messageIdCounter;
	}

	async function scrollToBottom() {
		await tick();
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	async function queueAssistantMessage(text, token, thinkDelay = 550) {
		isAssistantBusy = true;
		showThinking = true;
		await scrollToBottom();

		try {
			await sleep(thinkDelay);
			if (token !== flowVersion) return;

			showThinking = false;
			const id = nextMessageId();
			messages = [...messages, { id, role: 'assistant', text: '' }];
			await scrollToBottom();

			for (let i = 0; i < text.length; i += 1) {
				if (token !== flowVersion) return;
				const partial = text.slice(0, i + 1);
				messages = messages.map((m) => (m.id === id ? { ...m, text: partial } : m));
				await scrollToBottom();
				await sleep(18);
			}
		} finally {
			if (token === flowVersion) {
				showThinking = false;
				isAssistantBusy = false;
			}
		}
	}

	async function recordAnswer(answerValue) {
		const question = currentQuestion;
		if (!question || isSubmitting || isAssistantBusy) return;

		isSubmitting = true;
		setAnswer(question.id, answerValue);
		messages = [...messages, { id: nextMessageId(), role: 'user', text: answerValue }];
		await scrollToBottom();

		const nextIndex = currentQuestionIndex + 1;
		const nextQuestion = questions[nextIndex];
		currentQuestionIndex = nextIndex;
		const token = flowVersion;

		if (nextQuestion) {
			await queueAssistantMessage(nextQuestion.question, token);
		} else if (!hasCompleted) {
			hasCompleted = true;
			await queueAssistantMessage('Thanks. Your form is complete.', token, 450);
		}

		currentInput = '';
		isSubmitting = false;
		focusInput();
	}

	async function submitTextAnswer(event) {
		event?.preventDefault();
		const value = currentInput.trim();
		if (!value || isAssistantBusy) return;
		await recordAnswer(value);
	}

	async function submitChoiceAnswer(option) {
		if (isAssistantBusy) return;
		await recordAnswer(option);
	}

	async function restartChat() {
		flowVersion += 1;
		currentQuestionIndex = 0;
		currentInput = '';
		hasCompleted = false;
		isSubmitting = false;
		isAssistantBusy = false;
		showThinking = false;
		messages = [];
		resetAnswers();

		if (questions[0]) {
			await queueAssistantMessage(questions[0].question, flowVersion, 400);
		}
		await focusInput();
	}

	async function focusInput() {
		if (!isTextQuestion || hasCompleted || isAssistantBusy) return;
		await tick();
		inputEl?.focus();
	}

	$effect(() => {
		if (!hasInitialized) {
			hasInitialized = true;
			const startQuestion = questions[currentQuestionIndex];
			if (startQuestion && !hasCompleted) {
				void queueAssistantMessage(startQuestion.question, flowVersion, 400);
			} else if (hasCompleted) {
				messages = [
					...messages,
					{ id: nextMessageId(), role: 'assistant', text: 'Your form is already complete.' }
				];
			}
		}
	});

	$effect(() => {
		if (isTextQuestion && !hasCompleted && !isAssistantBusy) {
			void focusInput();
		}
	});
</script>

<div class="flex flex-1 flex-col gap-4">
	<section class="bg-card flex-1 rounded-2xl border p-4 shadow-sm">
		<div
			bind:this={messagesEl}
			class="no-scrollbar flex h-[60vh] flex-col gap-3 overflow-y-auto pr-1"
		>
			{#each messages as message}
				<div class={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
					<div
						class={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
							message.role === 'assistant'
								? 'bg-muted text-foreground rounded-bl-sm'
								: 'bg-primary text-primary-foreground rounded-br-sm'
						}`}
					>
						{message.text}
					</div>
				</div>
			{/each}

			{#if showThinking}
				<div class="flex justify-start">
					<div
						class="bg-muted text-foreground rounded-bl-sm flex items-center gap-1 rounded-2xl px-4 py-3"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-current opacity-70"></span>
						<span
							class="h-2 w-2 animate-pulse rounded-full bg-current opacity-70"
							style="animation-delay: 120ms"
						></span>
						<span
							class="h-2 w-2 animate-pulse rounded-full bg-current opacity-70"
							style="animation-delay: 240ms"
						></span>
					</div>
				</div>
			{/if}
		</div>
	</section>

	{#if !hasCompleted && currentQuestion && !isAssistantBusy}
		<section class="bg-card rounded-2xl border p-3 shadow-sm">
			{#if currentQuestion.type === 'text'}
				<form class="flex flex-col gap-2 sm:flex-row" onsubmit={submitTextAnswer}>
					<input
						bind:this={inputEl}
						bind:value={currentInput}
						class="border-input bg-background focus-visible:ring-ring h-10 flex-1 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
						placeholder="Type your answer"
						autocomplete="off"
					/>
					<Button type="submit" disabled={!canSubmitText}>Submit</Button>
				</form>
			{:else if currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'select'}
				<div class="flex flex-wrap gap-2">
					{#each currentQuestion.options ?? [] as option}
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onclick={() => submitChoiceAnswer(option)}
						>
							{option}
						</Button>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<div class="flex justify-end">
		<Button type="button" variant="outline" onclick={restartChat}>Restart</Button>
	</div>
</div>
