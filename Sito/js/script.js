function _debug_printQuestions(data) {
    data.categories.sort((a, b) => a.priority - b.priority);

    for (const category of data.categories) {
        console.log(`Categoria: ${category.name}`);
        for (const question of category.questions) {
            console.log(`  Domanda: ${question.question}`);
            console.log(`  Risposta: ${question.answer.expression}`);
        }
    }
}


const finalAnswers = {
	right: [
		"Evviva! Ho indovinato il personaggio che stavi pensando.",
		"Yay! Ho indovinato il personaggio!"
	],
	wrong: [
		"Mi dispiace, sembra che ci sia stato un errore nell'indovinare il personaggio.",
		"Ops! Non ho indovinato il personaggio, riprova!",
		"Peccato! Ho sbagliato, riprova!"
	]
}

var questionText = null;
var genieImage = null;
var yesButton = null;
var noButton = null;
var resetButton = null;

var remainingCharacters = null;
var categoryIndex = 0;
var remainingQuestions = null;
var selectedQuestion = null;

var handleYesAnswer = function() {};
var handleNoAnswer = function() {};
var handleResetAnswer = function() {};





function nextQuestion() {
	// Verifica se non ci sono più personaggi, secondo i filtri
	if (remainingCharacters.length === 0) {
		resultOfTheGuess(false);
		return;
	}

	// Verifica se il personaggio "potrebbe" essere stato indovinato
	if ( remainingCharacters.length === 1) {
		askConfirmation(remainingCharacters[0]);
		return;
	}

	// Scegli una domanda a caso dalla lista delle domande
	const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
	selectedQuestion = remainingQuestions[randomIndex];

	// Visualizza la domanda nell'interfaccia utente
	questionText.innerHTML = selectedQuestion.question;

	// Rimuovi la domanda utilizzata dalla lista delle domande
	//remainingQuestions = remainingQuestions.filter(item => item !== selectedQuestion);

	// Passa alla categoria successiva di domande
	remainingQuestions = questions.categories[++categoryIndex].questions;	
}

function processAnswer(expression, answer) {
	// Filtra i personaggi, in base alla risposta
	remainingCharacters = filterCharacters(expression, answer);

	// Rimuovi le domande superflue
	remainingQuestions = filterQuestions(remainingQuestions, remainingCharacters);

	console.log('CHARACTERS: ', remainingCharacters);
	console.log('QUESTIONS: ', remainingQuestions);
	nextQuestion();
}

function filterCharacters(expression, answerValue) {
	return remainingCharacters.filter(character => {
		return evaluateExpression(expression, character, answerValue);
	});
}

function filterQuestions(quest, characters) {
	const filteredQuestions = quest.filter(question => {
	  // Valuta l'espressione con ogni personaggio
	  let isApplicable = characters.some(character => {
		let answerValue = true;
		return evaluateExpression(question.answer.expression, character, answerValue);
	  });
  
	  return isApplicable;
	});
  
	// Se tutte le domande sono state rimosse, passa alla categoria successiva
	if (filteredQuestions.length === 0) {
	  categoryIndex++;

	  // Se non ci sono più categorie, restituisci un array vuoto
	  if (quest == null) {
		return [];
	  }
	  if (categoryIndex >= questions.categories.length) {
		return [];
	  }
  
	  // Recupera le domande della nuova categoria
	  return filterQuestions(questions.categories[categoryIndex].questions, characters);
	}
  
	return filteredQuestions;
} 

function evaluateExpression(expression, character, answerValue) {
	let [feature, operator, val] = expression.split(' ');
	const featureValue = character.features[feature];
	var resultValue = undefined;

	if (featureValue === undefined) {
		console.log('SKIPPED QUESTIONS');
		return true;
	}

	// Gestisci il parse dei null
	val = val == "null" ? null : val;

	// Funzione per verificare se un valore è presente in un array
	const arrayContainsValue = (arr, value) => Array.isArray(arr) && arr.includes(value);

	switch (operator) {
		case '<':
			resultValue = parseFloat(featureValue) < parseFloat(val);
			break;
		case '>':
			resultValue = parseFloat(featureValue) > parseFloat(val);
			break;
		case '<=':
			resultValue = parseFloat(featureValue) <= parseFloat(val);
			break;
		case '>=':
			resultValue = parseFloat(featureValue) >= parseFloat(val);
			break;
		case '!=':
			resultValue = featureValue != val && !arrayContainsValue(featureValue, val);
			break;
		case '==':
			if (Array.isArray(featureValue)) {
				resultValue = arrayContainsValue(featureValue, val);
			} else {
				resultValue = featureValue == val;
			}
			break;
		default:
			resultValue = false;
	}

	return resultValue == answerValue;
}

function askConfirmation(character) {
	questionText.textContent = 'La persona a cui stai pensando è: ' + character.name + '?';
	genieImage.src = "img/confused-genie.png"

	// Assegna event listener ad ogni pulsante
	setButtonListeners(function() { resultOfTheGuess(true) }, function() { resultOfTheGuess(false) }, null);
}

function resultOfTheGuess(guessed) {
	var answers = null;

	if (guessed) {
		answers = finalAnswers.right;
		genieImage.src = "img/happy-genie.png"
	}
	else {
		answers = finalAnswers.wrong;
		genieImage.src = "img/sad-genie.png"
	}

	// Scegli una risposta a caso dalla lista delle risposta
	const randomIndex = Math.floor(Math.random() * answers.length);
	questionText.textContent = answers[randomIndex];

	setButtonsForNextGame();
}

// Funzione per impostare la visibilità dei pulsanti
function setButtonVisibility(yesVisible, noVisible, resetVisible) {
	yesButton.style.display = yesVisible ? 'block' : 'none';
	noButton.style.display = noVisible ? 'block' : 'none';
	resetButton.style.display = resetVisible ? 'block' : 'none';
}

// Funzione per impostare le callback (listener) dei pulsanti
function setButtonListeners(yesBtnListener, noBtnListener, resetBtnListener) {
	handleYesAnswer = updateListenerSafe(yesButton, 'click', handleYesAnswer, yesBtnListener);
	handleNoAnswer = updateListenerSafe(noButton, 'click', handleNoAnswer, noBtnListener);
	handleResetAnswer = updateListenerSafe(resetButton, 'click', handleResetAnswer, resetBtnListener)
}

function setButtonsForNextGame() {
	// Modifica la visibilità dei pulsanti
	setButtonVisibility(false, false, true);

	// Assegna event listener ad ogni pulsante
	setButtonListeners(null, null, akinator);
}


function updateListenerSafe(element, event, oldCallback, newCallback) {
	if (element && oldCallback && typeof oldCallback === 'function') {
		element.removeEventListener(event, oldCallback);
	}
	
	if (element && newCallback && typeof newCallback === 'function') {
		element.addEventListener(event, newCallback);
	}

	return newCallback;
}

function akinator() {
	categoryIndex = 0;
	remainingCharacters = characters;
	remainingQuestions = questions.categories[categoryIndex].questions;
	genieImage.src = "img/idle-genie.png"

	// Modifica la visibilità dei pulsanti
	setButtonVisibility(true, true, false);

	// Assegna event listener ad ogni pulsante
	setButtonListeners(function() { processAnswer(selectedQuestion.answer.expression, true); }, function() { processAnswer(selectedQuestion.answer.expression, false); }, null);

	// Inizia le domande
	nextQuestion();
}

// Avvio del gioco
window.onload = function() {
	questionText = document.getElementById('question-text');
	genieImage = document.getElementById('genie-image');
	yesButton = document.getElementById('yes-button');
	noButton = document.getElementById('no-button');
	resetButton = document.getElementById('reset-button');

	// Aggiungi event listener ad ogni pulsante
	setButtonListeners(handleYesAnswer, handleNoAnswer, handleResetAnswer);

	akinator();


	//window.open('docs/Personaggi.pdf', '_blank');
}