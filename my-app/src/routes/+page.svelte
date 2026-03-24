<script>
	import ChatRenderer from '$lib/components/chat/ChatRenderer.svelte';
	import FormRenderer from '$lib/components/form/FormRenderer.svelte';
	import questions from '$lib/questions.json';

	let mode = $state('chat');

	function handleFormSubmit(answers) {
		console.log('Form submitted:', answers);
	}
</script>

<main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
	<header class="mb-6 flex items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Form Chat</h1>
			<p class="text-muted-foreground text-sm">Complete the form via chat or standard view.</p>
		</div>
		<div class="bg-muted flex rounded-lg p-1">
			<button
				type="button"
				class={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
					mode === 'chat'
						? 'bg-background text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'
				}`}
				onclick={() => (mode = 'chat')}
			>
				Chat
			</button>
			<button
				type="button"
				class={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
					mode === 'form'
						? 'bg-background text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'
				}`}
				onclick={() => (mode = 'form')}
			>
				Form
			</button>
		</div>
	</header>

	<!-- Both components stay mounted to preserve state across mode switches -->
	<div class:hidden={mode !== 'chat'} class="flex flex-1 flex-col">
		<ChatRenderer {questions} />
	</div>
	<div class:hidden={mode !== 'form'}>
		<FormRenderer {questions} onsubmit={handleFormSubmit} />
	</div>
</main>