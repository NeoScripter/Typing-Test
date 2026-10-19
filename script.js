let bestScore = 10;
let difficulty = 'medium';
let speedWpm = 40;
let accuracy = 90;
let timeLeftSeconds = 56;
let totalDurationSeconds = 60;

const bestScoreElement = document.querySelector('[cmp-best-score]');
const speedWpmElement = document.querySelector('[cmp-current-speed]');
const accuracyElement = document.querySelector('[cmp-current-accuracy]');
const timeLeftElement = document.querySelector('[cmp-time-left]');

const durationButtons = document.querySelectorAll('[data-duration]');
const difficultyButtons = document.querySelectorAll('[data-difficulty]');

function updateStats() {
    bestScoreElement.textContent = bestScore;
    speedWpmElement.textContent = speedWpm;
    accuracyElement.textContent = `${accuracy}%`;

    const minutesLeft = Math.floor(timeLeftSeconds / 60);
    const secondsLeft = timeLeftSeconds % 60;
    timeLeftElement.textContent = `${minutesLeft}:${secondsLeft}`;
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

console.log('hello world');
