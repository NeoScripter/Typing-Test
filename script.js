let bestScore = Number(localStorage.getItem('bestScore') ?? '0');
let difficulty = sessionStorage.getItem('difficulty') ?? 'medium';
let speedWpm = 40;
let accuracy = 100;
let totalDurationSeconds = Number(
    sessionStorage.getItem('totalDuration') ?? 60
);
let timeLeftSeconds = totalDurationSeconds;

const bestScoreElement = document.querySelector('[cmp-best-score]');
const speedWpmElement = document.querySelector('[cmp-current-speed]');
const accuracyElement = document.querySelector('[cmp-current-accuracy]');
const timeLeftElement = document.querySelector('[cmp-time-left]');
const startTestBtn = document.querySelector('[cmp-start-test-btn]');
const typingArea = document.querySelector('[cmp-typing-area]');

const durationButtons = document.querySelectorAll('[data-duration]');
const difficultyButtons = document.querySelectorAll('[data-difficulty]');
const toastElement = document.querySelector('[cmp-toast]');

const finalCharsElement = document.querySelector('[cmp-final-chars]');
const finalAccuracyElement = document.querySelector('[cmp-final-accuracy]');
const finalWpmElement = document.querySelector('[cmp-final-wpm]');
const endTestElement = document.querySelector('[cmp-end-test]');

let interval = null;

function handleTestEnd() {
    clearInterval(interval);
    interval = null;
    endTestElement.classList.remove('hidden');
    finalWpmElement.textContent = speedWpm;
    finalAccuracyElement.textContent = `${accuracy}%`;

    if (bestScore < speedWpm) {
        bestScore = speedWpm;
        localStorage.setItem('bestScore', speedWpm.toString());
    }

    const allNonBlank = typingArea.querySelectorAll('span:not(.blank)');
    finalCharsElement.textContent = allNonBlank.length;
}

startTestBtn.addEventListener('click', resetTest);

function tick() {
    if (timeLeftSeconds === 0) {
        handleTestEnd();
        return;
    }
    timeLeftSeconds--;
    refreshState();
    updateStats();
}

function startTimer() {
    return setInterval(tick, 1000);
}

typingArea.addEventListener('focusout', () => {
    clearInterval(interval);
    interval = null;
});

function updateStats() {
    bestScoreElement.textContent = bestScore;
    speedWpmElement.textContent = speedWpm;
    accuracyElement.textContent = `${accuracy}%`;

    const minutesLeft = Math.floor(timeLeftSeconds / 60).toString();
    const secondsLeft = (timeLeftSeconds % 60).toString();
    timeLeftElement.textContent = `${minutesLeft.padStart(2, '0')}:${secondsLeft.padStart(2, '0')}`;
}

function resetTest() {
    clearInterval(interval);
    interval = null;
    [...durationButtons, ...difficultyButtons].forEach((btn) =>
        btn.classList.remove('active')
    );

    document
        .querySelector(`[data-difficulty="${difficulty}"]`)
        .classList.add('active');
    document
        .querySelector(`[data-duration="${totalDurationSeconds}"]`)
        .classList.add('active');

    speedWpm = 0;
    accuracy = 100;
    timeLeftSeconds = totalDurationSeconds;
    sessionStorage.setItem('difficulty', difficulty);
    sessionStorage.setItem('totalDuration', totalDurationSeconds);

    updateStats();
    typingArea.innerHTML = '';
    typingArea.style.setProperty('--offset', '0');
    appendTextToTypingArea();
    endTestElement.classList.add('hidden');
}

async function appendTextToTypingArea() {
    const data = await fetch('/data/data.json');
    const json = await data.json();
    const items = json[difficulty];

    const frag = document.createDocumentFragment();

    for (const item of items) {
        const passage = item.text;
        const parts = passage
            .split('')
            .map((char) => `<span class='blank'>${char}</span>`)
            .join('');
        const paragraph = document.createElement('p');
        paragraph.innerHTML = parts;
        frag.appendChild(paragraph);
    }

    typingArea.appendChild(frag);
}
appendTextToTypingArea();

typingArea.addEventListener('keyup', (e) => {
    if (e.key === 'CapsLock') {
        if (e.getModifierState('CapsLock')) {
            toastElement.classList.add('shown');
        } else {
            toastElement.classList.remove('shown');
        }
    }
});

typingArea.addEventListener('keydown', (e) => {
    const char = e.key;
    const regex = /^[a-zA-Z0-9\]\[\'\"\.\/\;\:\,\(\)\!\=\ ]$/;
    const isValid =
        char === 'Backspace' || char === 'Enter' || regex.test(char);

    if (!isValid) return;

    e.preventDefault();
    e.stopPropagation();

    if (interval === null) {
        interval = startTimer();
    }
    let nextCharElement;

    if (char === 'Enter') {
        nextCharElement = typingArea.querySelector('span.blank');
        const nextFirstBlankCharInTheParagraph = typingArea.querySelector(
            'span.blank:first-child'
        );

        const newClass =
            nextCharElement === nextFirstBlankCharInTheParagraph
                ? 'success'
                : 'danger';
        nextCharElement.classList.remove('blank');
        nextCharElement.classList.add(newClass);
    } else if (char !== 'Backspace') {
        nextCharElement = typingArea.querySelector('span.blank');

        if (!nextCharElement) return;

        const nextChar = nextCharElement.textContent;

        const newClass = nextChar === char ? 'success' : 'danger';
        nextCharElement.classList.remove('blank');
        nextCharElement.classList.add(newClass);
    } else {
        let prevSubling =
            typingArea.querySelector('span.blank')?.previousElementSibling;

        if (prevSubling == null) {
            const allNonBlank = typingArea.querySelectorAll('span:not(.blank)');
            prevSubling = allNonBlank[allNonBlank.length - 1];
        }
        nextCharElement = prevSubling;

        if (!nextCharElement) return;

        nextCharElement.classList.remove('success', 'danger');
        nextCharElement.classList.add('blank');
    }

    const height = parseInt(
        window.getComputedStyle(nextCharElement).lineHeight
    );
    const offsetTop = nextCharElement.offsetTop;
    const offset = Math.floor(offsetTop / height);
    typingArea.style.setProperty('--offset', offset);

    const typingAreaHeight = parseInt(
        window.getComputedStyle(typingArea).height
    );

    const linesLeftUntilTheBottom = Math.floor(
        (typingAreaHeight - offsetTop) / height
    );

    if (linesLeftUntilTheBottom <= 8) {
        appendTextToTypingArea();
    }

    refreshState();
    updateStats();
});

function refreshState() {
    const allNonBlank = typingArea.querySelectorAll('span:not(.blank)');
    const words = [...allNonBlank].filter((char) => char.textContent === ' ');
    const correct = [...allNonBlank].filter((char) =>
        char.classList.contains('success')
    );

    const timePassed = totalDurationSeconds - timeLeftSeconds;
    const wordsPerMinute =
        timePassed === 0
            ? words.length
            : Math.round((words.length / timePassed) * 60);
    speedWpm = wordsPerMinute;
    const newAccuracy = Math.round((100 / allNonBlank.length) * correct.length);

    if (newAccuracy > accuracy) {
        accuracyElement.classList.remove('danger');
        accuracyElement.classList.add('success');
    } else if (newAccuracy < accuracy) {
        accuracyElement.classList.add('danger');
        accuracyElement.classList.remove('success');
    } else {
        accuracyElement.classList.remove('success', 'danger');
    }

    accuracy = newAccuracy;
}

difficultyButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
        const newDifficulty = btn.getAttribute('data-difficulty');
        difficulty = newDifficulty;

        resetTest();
    })
);

durationButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
        const newDuration = btn.getAttribute('data-duration');
        totalDurationSeconds = Number(newDuration);

        resetTest();
    })
);

updateStats();
resetTest();
