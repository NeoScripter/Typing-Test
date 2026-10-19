let bestScore = 10;
let difficulty = sessionStorage.getItem('difficulty') ?? 'medium';
let speedWpm = 40;
let accuracy = 100;
let timeLeftSeconds = 56;
let totalDurationSeconds = Number(
    sessionStorage.getItem('totalDuration') ?? 60
);

const bestScoreElement = document.querySelector('[cmp-best-score]');
const speedWpmElement = document.querySelector('[cmp-current-speed]');
const accuracyElement = document.querySelector('[cmp-current-accuracy]');
const timeLeftElement = document.querySelector('[cmp-time-left]');
const startTestBtn = document.querySelector('[cmp-start-test-btn]');
const typingArea = document.querySelector('[cmp-typing-area]');

const durationButtons = document.querySelectorAll('[data-duration]');
const difficultyButtons = document.querySelectorAll('[data-difficulty]');
const toastElement = document.querySelector('[cmp-toast]');

function updateStats() {
    bestScoreElement.textContent = bestScore;
    speedWpmElement.textContent = speedWpm;
    accuracyElement.textContent = `${accuracy}%`;

    const minutesLeft = Math.floor(timeLeftSeconds / 60).toString();
    const secondsLeft = (timeLeftSeconds % 60).toString();
    timeLeftElement.textContent = `${minutesLeft.padStart(2, '0')}:${secondsLeft.padStart(2, '0')}`;
}

function resetTest() {
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

function getFirstBlackChar() {
    const char = typingArea.querySelector('span.blank');

    return char;
}

typingArea.addEventListener('keyup', (e) => {
    const char = e.key;
    const regex = /^[a-zA-Z0-9\]\[\'\"\.\/\;\:\,\(\)\!\=\ ]$/;
    const isValid =
        char === 'Backspace' || char === 'Enter' || regex.test(char);

    if (e.key === 'CapsLock') {
        if (e.getModifierState('CapsLock')) {
            toastElement.classList.add('shown');
        } else {
            toastElement.classList.remove('shown');
        }
    }

    if (!isValid) return;

    e.preventDefault();
    e.stopPropagation();

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

// function handleTestEnd () {
//
// }

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
