export const answersStore = $state({ data: {} });

export function setAnswer(id, value) {
	answersStore.data[id] = value;
}

export function resetAnswers() {
	answersStore.data = {};
}
