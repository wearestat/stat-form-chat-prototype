<script>
 import { tick } from "svelte";
 import { Button } from "$lib/components/ui/button/index.js";
 import questions from "$lib/questions.json";

 const questionList = questions;
 const firstQuestion = questionList[0];
 let currentQuestionIndex = $state(0);
 let currentInput = $state("");
 let inputEl = $state();
 let hasCompleted = $state(false);
 let isSubmitting = $state(false);

 let answers = $state({});
 let messages = $state(firstQuestion ? [{ role: "assistant", text: firstQuestion.question }] : []);

 const currentQuestion = $derived(questionList[currentQuestionIndex]);
 const isTextQuestion = $derived(currentQuestion?.type === "text");
 const canSubmitText = $derived(!isSubmitting && currentInput.trim().length > 0);

 function recordAnswer(answerValue) {
    const question = currentQuestion;
    if (!question || isSubmitting) {
     return;
    }

    isSubmitting = true;
    answers = { ...answers, [question.id]: answerValue };
    messages = [...messages, { role: "user", text: answerValue }];

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = questionList[nextIndex];
    currentQuestionIndex = nextIndex;

    if (nextQuestion) {
     messages = [...messages, { role: "assistant", text: nextQuestion.question }];
    } else if (!hasCompleted) {
     hasCompleted = true;
     messages = [...messages, { role: "assistant", text: "Thanks. Your form is complete." }];
     console.log("Form answers:", answers);
    }

    currentInput = "";
    isSubmitting = false;
    focusInput();
 }

 function submitTextAnswer(event) {
  event?.preventDefault();
    const value = currentInput.trim();
    if (!value) {
     return;
    }

    recordAnswer(value);
 }

 function submitChoiceAnswer(option) {
    recordAnswer(option);
 }

 function restartChat() {
    currentQuestionIndex = 0;
    currentInput = "";
    hasCompleted = false;
    isSubmitting = false;
    answers = {};
    messages = firstQuestion ? [{ role: "assistant", text: firstQuestion.question }] : [];
    focusInput();
 }

 async function focusInput() {
    if (!isTextQuestion || hasCompleted) {
     return;
    }

    await tick();
    inputEl?.focus();
 }

 $effect(() => {
  if (isTextQuestion && !hasCompleted) {
   focusInput();
  }
 });
</script>

<main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
 <section class="mb-4 flex items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Form Chat</h1>
    <p class="text-muted-foreground text-sm">Answer the prompts one by one.</p>
  </div>
  <Button type="button" variant="outline" onclick={restartChat}>Restart</Button>
 </section>

 <section class="bg-card flex-1 rounded-2xl border p-4 shadow-sm">
    <div class="no-scrollbar flex h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
     {#each messages as message}
        <div class={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
         <div
            class={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
             message.role === "assistant"
                ? "bg-muted text-foreground rounded-bl-sm"
                : "bg-primary text-primary-foreground rounded-br-sm"
            }`}
         >
            {message.text}
         </div>
        </div>
     {/each}
    </div>
 </section>

 {#if !hasCompleted && currentQuestion}
    <section class="bg-card mt-4 rounded-2xl border p-3 shadow-sm">
     {#if currentQuestion.type === "text"}
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
     {:else if currentQuestion.type === "multiple_choice"}
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
</main>