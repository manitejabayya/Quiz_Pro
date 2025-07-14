// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const screens = {
    start: document.getElementById('startScreen'),
    quiz: document.getElementById('quizScreen'),
    results: document.getElementById('resultsScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
    profile: document.getElementById('profileScreen'),
    daily: document.getElementById('dailyQuizScreen')
};
const playerNameInput = document.getElementById('playerName');
const categorySelect = document.getElementById('categorySelect');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');
const currentQuestion = document.getElementById('currentQuestion');
const totalQuestions = document.getElementById('totalQuestions');
const timerElement = document.getElementById('timer');
const currentScore = document.getElementById('currentScore');
const progressBar = document.getElementById('progressBar');
const finalScore = document.getElementById('finalScore');
const starRating = document.getElementById('starRating');
const accuracy = document.getElementById('accuracy');
const totalTime = document.getElementById('totalTime');
const xpEarned = document.getElementById('xpEarned');
const achievements = document.getElementById('achievements');
const leaderboardList = document.getElementById('leaderboardList');
const profileName = document.getElementById('profileName');
const profileLevel = document.getElementById('profileLevel');
const totalQuizzes = document.getElementById('totalQuizzes');
const totalAccuracy = document.getElementById('totalAccuracy');
const bestStreak = document.getElementById('bestStreak');
const favoriteCategory = document.getElementById('favoriteCategory');
const playerLevel = document.getElementById('playerLevel');
const playerXP = document.getElementById('playerXP');
const playerStreak = document.getElementById('playerStreak');
const dailyStreak = document.getElementById('dailyStreak');
const pauseBtn = document.getElementById('pauseBtn');
const celebration = document.getElementById('celebration');

// Game State
let gameState = {
    playerName: '',
    category: 'general',
    difficulty: 'easy',
    mode: 'classic',
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    timer: 30,
    timerInterval: null,
    totalTime: 0,
    selectedOption: null,
    answered: false,
    paused: false,
    playerData: {
        level: 1,
        xp: 0,
        streak: 0,
        dailyStreak: 0,
        lastPlayed: null,
        totalQuizzes: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        achievements: [],
        gameScores: []
    }
};

// Initialize the app
function init() {
    loadPlayerData();
    setupEventListeners();
    updatePlayerStats();
    showScreen('start');
}

// Set up event listeners
function setupEventListeners() {

    themeToggle.addEventListener('click', toggleTheme);
    // Add these back-to-menu button listeners
    document.querySelectorAll('.btn-back-to-menu').forEach(button => {
        button.addEventListener('click', showStartScreen);
    });
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.difficulty = button.dataset.difficulty;
        });
    });
    
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.mode = button.dataset.mode;
        });
    });
    
    categorySelect.addEventListener('change', (e) => {
        gameState.category = e.target.value;
    });
}
function showStartScreen() {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show start screen
    screens.start.classList.add('active');
    
    // Reset any quiz state if needed
    clearInterval(gameState.timerInterval);
    gameState.paused = false;
}

// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    savePlayerData();
}

// Show specific screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

// Start quiz function
function startQuiz() {
    gameState.playerName = playerNameInput.value.trim();
    
    if (!gameState.playerName) {
        showNotification('Please enter your name to start!', 'error');
        return;
    }
    
    fetchQuestions();
}

// Fetch questions from OpenTDB API
function fetchQuestions() {
    const categoryMap = {
        'general': 9,
        'science': 17,
        'sports': 21,
        'technology': 18,
        'entertainment': 11,
        'history': 23
    };
    
    const categoryId = categoryMap[gameState.category] || 9;
    const difficulty = gameState.difficulty;
    const amount = gameState.mode === 'blitz' ? 10 : gameState.mode === 'survival' ? 20 : 15;
    
    showNotification('Loading questions...', 'info');
    
    fetch(`https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple&encode=url3986`)
        .then(res => res.json())
        .then(data => {
            if (data.response_code === 0) {
                gameState.questions = data.results.map(q => {
                    const allOptions = [...q.incorrect_answers];
                    const correctIndex = Math.floor(Math.random() * 4);
                    allOptions.splice(correctIndex, 0, q.correct_answer);
                    
                    return {
                        question: decodeURIComponent(q.question),
                        options: allOptions.map(opt => decodeURIComponent(opt)),
                        correct: correctIndex,
                        explanation: `Correct answer: ${decodeURIComponent(q.correct_answer)}`
                    };
                });
                
                gameState.currentQuestionIndex = 0;
                gameState.score = 0;
                gameState.correctAnswers = 0;
                gameState.totalTime = 0;
                gameState.selectedOption = null;
                gameState.answered = false;
                
                showScreen('quiz');
                totalQuestions.textContent = gameState.questions.length;
                currentScore.textContent = gameState.score;
                loadQuestion();
            } else {
                throw new Error('Failed to load questions');
            }
        })
        .catch(err => {
            showNotification('Failed to load questions. Please try again.', 'error');
            console.error(err);
        });
}

// Load current question
function loadQuestion() {
    const question = gameState.questions[gameState.currentQuestionIndex];
    currentQuestion.textContent = gameState.currentQuestionIndex + 1;
    questionText.textContent = question.question;
    
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `
            <input type="radio" name="answer" value="${index}" id="option${index}">
            <label for="option${index}">${option}</label>
        `;
        optionDiv.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Set timer based on difficulty
    gameState.timer = gameState.difficulty === 'easy' ? 30 : gameState.difficulty === 'medium' ? 20 : 15;
    timerElement.textContent = gameState.timer;
    startTimer();
    
    nextBtn.style.display = 'none';
    gameState.selectedOption = null;
    gameState.answered = false;
}

// Select answer
function selectAnswer(index) {
    if (gameState.answered || gameState.paused) return;
    
    gameState.selectedOption = index;
    const radioButton = document.getElementById(`option${index}`);
    radioButton.checked = true;
    
    clearInterval(gameState.timerInterval);
    gameState.answered = true;
    
    showAnswers();
    nextBtn.style.display = 'inline-block';
}

// Show correct/incorrect answers
function showAnswers() {
    const question = gameState.questions[gameState.currentQuestionIndex];
    const options = document.querySelectorAll('.option');
    
    options.forEach((option, index) => {
        if (index === question.correct) {
            option.classList.add('correct');
        } else if (index === gameState.selectedOption && gameState.selectedOption !== question.correct) {
            option.classList.add('incorrect');
        }
        option.style.pointerEvents = 'none';
    });
    
    if (gameState.selectedOption === question.correct) {
        gameState.score++;
        gameState.correctAnswers++;
        currentScore.textContent = gameState.score;
    }
}

// Start timer
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer--;
        timerElement.textContent = gameState.timer;
        gameState.totalTime++;
        
        if (gameState.timer <= 0) {
            clearInterval(gameState.timerInterval);
            if (!gameState.answered) {
                gameState.selectedOption = -1;
                gameState.answered = true;
                showAnswers();
                nextBtn.style.display = 'inline-block';
            }
        }
    }, 1000);
}

// Pause quiz
function pauseQuiz() {
    if (gameState.paused) {
        resumeQuiz();
        return;
    }
    
    gameState.paused = true;
    clearInterval(gameState.timerInterval);
    pauseBtn.textContent = 'Resume';
    
    document.getElementById('pauseModal').style.display = 'block';
}

// Resume quiz
function resumeQuiz() {
    gameState.paused = false;
    pauseBtn.textContent = 'Pause';
    startTimer();
    document.getElementById('pauseModal').style.display = 'none';
}

// Next question
function nextQuestion() {
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameState.questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Show results
function showResults() {
    clearInterval(gameState.timerInterval);
    showScreen('results');
    
    // Update player data
    updatePlayerStatsAfterQuiz();
    
    // Set final score
    finalScore.textContent = `${gameState.score}/${gameState.questions.length}`;
    
    // Calculate accuracy
    const acc = Math.round((gameState.correctAnswers / gameState.questions.length) * 100);
    accuracy.textContent = `${acc}%`;
    
    // Format time
    const minutes = Math.floor(gameState.totalTime / 60);
    const seconds = gameState.totalTime % 60;
    totalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate XP
    const xp = calculateXP();
    xpEarned.textContent = xp;
    
    // Set star rating
    setStarRating(acc);
    
    // Show achievements
    showAchievements();
    
    // Celebration animation
    celebrate();
}

// Calculate XP based on performance
function calculateXP() {
    const baseXP = 50;
    const accuracyBonus = Math.round((gameState.correctAnswers / gameState.questions.length) * 100);
    const timeBonus = Math.max(0, 50 - Math.floor(gameState.totalTime / 5));
    const difficultyMultiplier = gameState.difficulty === 'easy' ? 1 : gameState.difficulty === 'medium' ? 1.5 : 2;
    const modeMultiplier = gameState.mode === 'classic' ? 1 : gameState.mode === 'blitz' ? 1.2 : 1.5;
    
    const totalXP = Math.round((baseXP + accuracyBonus + timeBonus) * difficultyMultiplier * modeMultiplier);
    
    // Update player XP
    gameState.playerData.xp += totalXP;
    checkLevelUp();
    
    return totalXP;
}

// Check if player leveled up
function checkLevelUp() {
    const xpNeeded = gameState.playerData.level * 100;
    if (gameState.playerData.xp >= xpNeeded) {
        gameState.playerData.level++;
        gameState.playerData.xp -= xpNeeded;
        showNotification(`Level Up! You're now level ${gameState.playerData.level}`, 'success');
    }
}

// Set star rating based on accuracy
function setStarRating(accuracy) {
    starRating.innerHTML = '';
    const stars = Math.min(5, Math.floor(accuracy / 20));
    
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i < stars ? 'active' : ''}`;
        star.textContent = '⭐';
        starRating.appendChild(star);
    }
}

// Show achievements
function showAchievements() {
    achievements.innerHTML = '';
    
    // Check for new achievements
    checkNewAchievements();
    
    // Display unlocked achievements
    gameState.playerData.achievements.forEach(ach => {
        const achievement = document.createElement('span');
        achievement.className = 'achievement';
        achievement.textContent = ach;
        achievements.appendChild(achievement);
    });
}

// Check for new achievements
function checkNewAchievements() {
    const newAchievements = [];
    
    // Perfect score achievement
    if (gameState.score === gameState.questions.length && !gameState.playerData.achievements.includes('Perfect Score')) {
        newAchievements.push('Perfect Score');
    }
    
    // Speed run achievement
    if (gameState.totalTime < gameState.questions.length * 10 && !gameState.playerData.achievements.includes('Speed Runner')) {
        newAchievements.push('Speed Runner');
    }
    
    // Add new achievements
    newAchievements.forEach(ach => {
        gameState.playerData.achievements.push(ach);
        showAchievementUnlocked(ach);
    });
}

// Show achievement unlocked modal
function showAchievementUnlocked(achievement) {
    document.getElementById('achievementText').textContent = `You unlocked the "${achievement}" achievement!`;
    document.getElementById('achievementModal').style.display = 'block';
}

// Close achievement modal
function closeAchievementModal() {
    document.getElementById('achievementModal').style.display = 'none';
}

// Celebration animation
function celebrate() {
    const emojis = ['🎉', '🎊', '🏆', '⭐', '✨'];
    celebration.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const emoji = document.createElement('span');
            emoji.className = 'floating';
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = `${Math.random() * 100}%`;
            emoji.style.animationDuration = `${Math.random() * 2 + 2}s`;
            celebration.appendChild(emoji);
            
            // Remove emoji after animation
            setTimeout(() => {
                emoji.remove();
            }, 2000);
        }, i * 200);
    }
}

// Show leaderboard
function showLeaderboard() {
    showScreen('leaderboard');
    updateLeaderboard();
}

// Update leaderboard
function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    
    if (gameState.playerData.gameScores.length === 0) {
        leaderboardList.innerHTML = '<p>No scores yet. Be the first to play!</p>';
        return;
    }
    
    // Sort scores
    const sortedScores = [...gameState.playerData.gameScores].sort((a, b) => b.score - a.score);
    
    sortedScores.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-entry';
        if (entry.name === gameState.playerName) {
            item.classList.add('current-player');
        }
        
        item.innerHTML = `
            <div class="rank">${index + 1}</div>
            <div class="player-info">
                <div class="player-name">${entry.name}</div>
                <div class="player-stats">${entry.category} • ${entry.difficulty}</div>
            </div>
            <div class="score">${entry.score}/${entry.total}</div>
        `;
        leaderboardList.appendChild(item);
    });
}

// Show profile
function showProfile() {
    showScreen('profile');
    updateProfile();
}

// Update profile
function updateProfile() {
    profileName.textContent = gameState.playerName;
    profileLevel.textContent = gameState.playerData.level;
    totalQuizzes.textContent = gameState.playerData.totalQuizzes;
    
    const overallAccuracy = gameState.playerData.totalQuestions > 0 
        ? Math.round((gameState.playerData.totalCorrect / gameState.playerData.totalQuestions) * 100)
        : 0;
    totalAccuracy.textContent = `${overallAccuracy}%`;
    
    bestStreak.textContent = gameState.playerData.streak;
    dailyStreak.textContent = gameState.playerData.dailyStreak;
    
    // Update badges
    updateBadges();
}

// Update badges
function updateBadges() {
    const badgesGrid = document.querySelector('.badges-grid');
    if (!badgesGrid) return;
    
    badgesGrid.innerHTML = '';
    
    const allBadges = [
        { name: 'First Quiz', icon: '1️⃣', unlocked: gameState.playerData.totalQuizzes > 0 },
        { name: 'Level 5', icon: '🏅', unlocked: gameState.playerData.level >= 5 },
        { name: 'Perfect Score', icon: '💯', unlocked: gameState.playerData.achievements.includes('Perfect Score') },
        { name: 'Speed Runner', icon: '⚡', unlocked: gameState.playerData.achievements.includes('Speed Runner') },
        { name: 'Daily Player', icon: '📅', unlocked: gameState.playerData.dailyStreak >= 7 },
        { name: 'Master', icon: '👑', unlocked: gameState.playerData.level >= 10 }
    ];
    
    allBadges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge ${badge.unlocked ? 'unlocked' : 'locked'}`;
        badgeElement.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-tooltip">${badge.name}</div>
        `;
        badgesGrid.appendChild(badgeElement);
    });
}

// Show daily quiz
function showDailyQuiz() {
    showScreen('daily');
    // Check if daily quiz is available
    checkDailyQuizAvailability();
}

// Check daily quiz availability
function checkDailyQuizAvailability() {
    const today = new Date().toDateString();
    const lastPlayed = gameState.playerData.lastPlayed;
    
    if (lastPlayed === today) {
        document.getElementById('dailyQuizBtn').disabled = true;
        document.getElementById('dailyQuizBtn').textContent = 'Already Played Today';
    } else {
        document.getElementById('dailyQuizBtn').disabled = false;
        document.getElementById('dailyQuizBtn').textContent = 'Start Daily Quiz';
    }
}

// Start daily quiz
function startDailyQuiz() {
    gameState.category = 'general';
    gameState.difficulty = 'medium';
    gameState.mode = 'classic';
    
    // Update daily streak
    const today = new Date().toDateString();
    const lastPlayed = gameState.playerData.lastPlayed;
    
    if (lastPlayed && new Date(today).getDate() === new Date(lastPlayed).getDate() + 1) {
        gameState.playerData.dailyStreak++;
    } else if (!lastPlayed || new Date(today).getDate() !== new Date(lastPlayed).getDate()) {
        gameState.playerData.dailyStreak = 1;
    }
    
    gameState.playerData.lastPlayed = today;
    
    fetchQuestions();
}

// Quit quiz
function quitQuiz() {
    if (confirm('Are you sure you want to quit the quiz?')) {
        showScreen('start');
        clearInterval(gameState.timerInterval);
    }
}

// Restart quiz
function restartQuiz() {
    showScreen('start');
    playerNameInput.value = gameState.playerName;
}

// Update player stats after quiz
function updatePlayerStatsAfterQuiz() {
    gameState.playerData.totalQuizzes++;
    gameState.playerData.totalCorrect += gameState.correctAnswers;
    gameState.playerData.totalQuestions += gameState.questions.length;
    
    // Add to game scores
    gameState.playerData.gameScores.push({
        name: gameState.playerName,
        score: gameState.score,
        total: gameState.questions.length,
        category: gameState.category,
        difficulty: gameState.difficulty,
        date: new Date().toLocaleDateString()
    });
    
    // Keep only top 10 scores
    if (gameState.playerData.gameScores.length > 10) {
        gameState.playerData.gameScores.sort((a, b) => b.score - a.score);
        gameState.playerData.gameScores = gameState.playerData.gameScores.slice(0, 10);
    }
    
    savePlayerData();
    updatePlayerStats();
}

// Update player stats display
function updatePlayerStats() {
    playerLevel.textContent = gameState.playerData.level;
    playerXP.textContent = gameState.playerData.xp;
    playerStreak.textContent = gameState.playerData.streak;
    dailyStreak.textContent = gameState.playerData.dailyStreak;
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Save player data to localStorage
function savePlayerData() {
    localStorage.setItem('quizMasterProData', JSON.stringify(gameState.playerData));
}

// Load player data from localStorage
function loadPlayerData() {
    const savedData = localStorage.getItem('quizMasterProData');
    if (savedData) {
        gameState.playerData = JSON.parse(savedData);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (screens.quiz.classList.contains('active') && nextBtn.style.display !== 'none') {
            nextQuestion();
        }
    }
    
    if (e.key === 'Escape' && screens.quiz.classList.contains('active')) {
        pauseQuiz();
    }
});