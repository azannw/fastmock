// Test Configuration
const TEST_SECTIONS = [
    {
        name: "Advanced Mathematics",
        questions: 50,
        timeInMinutes: 50,
        negativeMarking: -1 // -1 for wrong answers
    },
    {
        name: "Basic Mathematics", 
        questions: 20,
        timeInMinutes: 20,
        negativeMarking: -1 // -1 for wrong answers
    },
    {
        name: "IQ & Analytical Skills",
        questions: 20,
        timeInMinutes: 20,
        negativeMarking: -1 // -1 for wrong answers
    },
    {
        name: "English",
        questions: 30,
        timeInMinutes: 30,
        negativeMarking: -0.0825 // -0.0825 for wrong answers
    }
];

// Current question being displayed
let currentQuestion = null;

// Global State
let testState = {
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    sections: [],
    answers: {},
    sectionStartTime: null,
    timer: null,
    warningCount: 0,
    loginId: "",
    isTestLocked: false,
    isTestCompleted: false
};

// Initialize test when page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeTest();
        setupSecurityMonitoring();
        setupCheckboxListener();
        console.log('✅ FAST Mock Test initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing test:', error);
        alert('Error loading test. Please refresh the page.');
    }
});

function setupCheckboxListener() {
    const checkbox = document.getElementById('agreementCheckbox');
    const startBtn = document.getElementById('startTestBtn');
    
    checkbox.addEventListener('change', function() {
        startBtn.disabled = !checkbox.checked;
    });
}

function initializeTest() {
    // Check if QUESTION_BANK is loaded
    if (typeof QUESTION_BANK === 'undefined') {
        console.error('❌ QUESTION_BANK not loaded');
        alert('Question bank not loaded. Please refresh the page.');
        return;
    }
    
    // Randomize section order
    testState.sections = shuffleArray([...TEST_SECTIONS]);
    
    // Initialize answers object
    testState.sections.forEach((section, sectionIndex) => {
        testState.answers[sectionIndex] = {};
        for (let i = 0; i < section.questions; i++) {
            testState.answers[sectionIndex][i] = null;
        }
    });
    
    showScreen('loginScreen');
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function proceedToInstructions() {
    const loginId = document.getElementById('loginId').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!loginId || !password) {
        alert('Please enter both Login ID and Password');
        return;
    }
    
    testState.loginId = loginId;
    
    // Update candidate ID in all relevant places
    const headerCandidateId = document.getElementById('headerCandidateId');
    if (headerCandidateId) headerCandidateId.textContent = loginId;
    
    const candidateId = document.getElementById('candidateId');
    if (candidateId) candidateId.textContent = loginId;
    
    const testCandidateId = document.getElementById('testCandidateId');
    if (testCandidateId) testCandidateId.textContent = loginId;
    
    const candidateName = document.getElementById('candidateName');
    if (candidateName) candidateName.textContent = loginId;
    
    const welcomeCandidateName = document.getElementById('welcomeCandidateName');
    if (welcomeCandidateName) welcomeCandidateName.textContent = loginId;
    
    const testCandidateName = document.getElementById('testCandidateName');
    if (testCandidateName) testCandidateName.textContent = loginId;
    
    showScreen('instructionsScreen');
}

function startTest() {
    const checkbox = document.getElementById('agreementCheckbox');
    if (!checkbox.checked) {
        alert('Please check the agreement checkbox to proceed');
        return;
    }
    
    // Start first section
    startSection(0);
    showScreen('testScreen');
}

function startSection(sectionIndex) {
    testState.currentSectionIndex = sectionIndex;
    testState.currentQuestionIndex = 0;
    testState.sectionStartTime = Date.now();
    
    updateSectionDisplay();
    updateQuestionDisplay();
    startTimer();
}

function updateSectionDisplay() {
    const section = testState.sections[testState.currentSectionIndex];
    document.getElementById('sectionName').textContent = section.name;
    document.getElementById('totalQuestions').textContent = section.questions;
    document.getElementById('modalSectionName').textContent = section.name;
}

function updateQuestionDisplay() {
    const questionNumber = testState.currentQuestionIndex + 1;
    const section = testState.sections[testState.currentSectionIndex];
    const sectionName = section.name;
    
    // Get question from question bank
    const sectionQuestions = QUESTION_BANK[sectionName] || [];
    const questionIndex = testState.currentQuestionIndex;
    
    if (sectionQuestions.length > questionIndex) {
        currentQuestion = sectionQuestions[questionIndex];
    } else {
        // Fallback to a default question if not available
        currentQuestion = {
            q: `Sample question ${questionNumber} for ${sectionName}`,
            o: ["Option A", "Option B", "Option C", "Option D"],
            a: 1 // Correct answer is option B (index 1)
        };
    }
    
    document.getElementById('questionNumber').textContent = questionNumber;
    document.getElementById('questionText').textContent = currentQuestion.q;
    
    // Update options
    const options = document.querySelectorAll('.option-text');
    options[0].textContent = currentQuestion.o[0];
    options[1].textContent = currentQuestion.o[1];
    options[2].textContent = currentQuestion.o[2];
    options[3].textContent = currentQuestion.o[3];
    
    // Hide 5th option if not needed (most questions have 4 options)
    const fifthOption = document.querySelector('input[name="answer"][value="e"]');
    if (fifthOption && fifthOption.parentElement) {
        if (currentQuestion.o.length > 4) {
            fifthOption.parentElement.style.display = 'block';
            options[4].textContent = currentQuestion.o[4];
        } else {
            fifthOption.parentElement.style.display = 'none';
        }
    }
    
    // Load saved answer
    const savedAnswer = testState.answers[testState.currentSectionIndex][testState.currentQuestionIndex];
    const radioButtons = document.querySelectorAll('input[name="answer"]');
    radioButtons.forEach(radio => {
        radio.checked = radio.value === savedAnswer;
    });
    
    // Show/hide last question warning
    const isLastQuestion = testState.currentQuestionIndex === section.questions - 1;
    document.getElementById('lastQuestionWarning').style.display = isLastQuestion ? 'block' : 'none';
    
    // Update navigation buttons
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const section = testState.sections[testState.currentSectionIndex];
    const isFirstQuestion = testState.currentQuestionIndex === 0;
    const isLastQuestion = testState.currentQuestionIndex === section.questions - 1;
    const isLastSection = testState.currentSectionIndex === testState.sections.length - 1;
    
    document.getElementById('backBtn').disabled = isFirstQuestion;
    
    if (isLastQuestion && isLastSection) {
        document.getElementById('nextBtn').textContent = 'Finish Test';
    } else if (isLastQuestion) {
        document.getElementById('nextBtn').textContent = 'Next Section';
    } else {
        document.getElementById('nextBtn').textContent = 'Next';
    }
}

function startTimer() {
    clearInterval(testState.timer);
    
    const section = testState.sections[testState.currentSectionIndex];
    let timeLeft = section.timeInMinutes * 60; // Convert to seconds
    
    testState.timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(testState.timer);
            autoMoveToNextSection();
            return;
        }
        
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function saveCurrentAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (selectedOption) {
        testState.answers[testState.currentSectionIndex][testState.currentQuestionIndex] = selectedOption.value;
    }
}

function previousQuestion() {
    if (testState.currentQuestionIndex > 0) {
        saveCurrentAnswer();
        testState.currentQuestionIndex--;
        updateQuestionDisplay();
    }
}

function nextQuestion() {
    saveCurrentAnswer();
    
    const section = testState.sections[testState.currentSectionIndex];
    const isLastQuestion = testState.currentQuestionIndex === section.questions - 1;
    const isLastSection = testState.currentSectionIndex === testState.sections.length - 1;
    
    if (isLastQuestion && isLastSection) {
        finishTest();
    } else if (isLastQuestion) {
        showSectionChangeModal();
    } else {
        testState.currentQuestionIndex++;
        updateQuestionDisplay();
    }
}

function skipQuestion() {
    // Clear any selected answer for this question
    testState.answers[testState.currentSectionIndex][testState.currentQuestionIndex] = null;
    const radioButtons = document.querySelectorAll('input[name="answer"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Move to next question
    nextQuestion();
}

function resetChoice() {
    testState.answers[testState.currentSectionIndex][testState.currentQuestionIndex] = null;
    const radioButtons = document.querySelectorAll('input[name="answer"]');
    radioButtons.forEach(radio => radio.checked = false);
}

function showSectionChangeModal() {
    showModal('sectionChangeModal');
}

function confirmSectionChange() {
    hideModal('sectionChangeModal');
    clearInterval(testState.timer);
    testState.currentSectionIndex++;
    startSection(testState.currentSectionIndex);
}

function cancelSectionChange() {
    hideModal('sectionChangeModal');
}

function autoMoveToNextSection() {
    if (testState.currentSectionIndex < testState.sections.length - 1) {
        testState.currentSectionIndex++;
        startSection(testState.currentSectionIndex);
    } else {
        finishTest();
    }
}

function showQuestionList() {
    const section = testState.sections[testState.currentSectionIndex];
    const questionGrid = document.getElementById('questionGrid');
    questionGrid.innerHTML = '';
    
    for (let i = 0; i < section.questions; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-number';
        questionDiv.textContent = i + 1;
        questionDiv.onclick = () => goToQuestion(i);
        
        // Add styling based on answer status
        if (testState.answers[testState.currentSectionIndex][i]) {
            questionDiv.classList.add('answered');
        }
        if (i === testState.currentQuestionIndex) {
            questionDiv.classList.add('current');
        }
        
        questionGrid.appendChild(questionDiv);
    }
    
    showModal('questionListModal');
}

function goToQuestion(questionIndex) {
    saveCurrentAnswer();
    testState.currentQuestionIndex = questionIndex;
    updateQuestionDisplay();
    hideModal('questionListModal');
}

function closeQuestionList() {
    hideModal('questionListModal');
}

function finishTest() {
    clearInterval(testState.timer);
    testState.isTestCompleted = true;
    calculateAndShowResults();
}

function calculateAndShowResults() {
    const results = {
        sections: [],
        totalQuestions: 0,
        totalAttempted: 0,
        totalCorrect: 0,
        totalScore: 0
    };
    
    testState.sections.forEach((section, sectionIndex) => {
        let attempted = 0;
        let correct = 0;
        let score = 0;
        
        for (let i = 0; i < section.questions; i++) {
            const answer = testState.answers[sectionIndex][i];
            if (answer !== null) {
                attempted++;
                
                // Get the correct answer for this specific question
                const sectionQuestions = QUESTION_BANK[section.name] || [];
                const questionData = sectionQuestions[i];
                let correctAnswerIndex = 1; // Default fallback
                
                if (questionData) {
                    correctAnswerIndex = questionData.a;
                }
                
                // Convert answer index to letter (0='a', 1='b', 2='c', 3='d', 4='e')
                const correctAnswerLetter = ['a', 'b', 'c', 'd', 'e'][correctAnswerIndex];
                
                if (answer === correctAnswerLetter) {
                    correct++;
                    // Different marks for different sections
                    if (section.name === "English") {
                        score += 0.33; // +0.33 for correct English answer
                    } else {
                        score += 1; // +1 for correct answer in other sections
                    }
                } else if (section.negativeMarking < 0) {
                    score += section.negativeMarking; // Negative marking for wrong answer only if applicable
                }
                // If negativeMarking is 0, no penalty for wrong answers
            }
        }
        
        results.sections.push({
            name: section.name,
            total: section.questions,
            attempted: attempted,
            correct: correct,
            score: score
        });
        
        results.totalQuestions += section.questions;
        results.totalAttempted += attempted;
        results.totalCorrect += correct;
        results.totalScore += score;
    });
    
    displayResults(results);
}

function displayResults(results) {
    const scoreDetails = document.getElementById('scoreDetails');
    scoreDetails.innerHTML = '';
    
    results.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-score';
        sectionDiv.innerHTML = `
            <div>
                <strong>${section.name}</strong><br>
                Questions: ${section.total} | Attempted: ${section.attempted} | Correct: ${section.correct}
            </div>
            <div>
                Score: ${section.score.toFixed(2)}
            </div>
        `;
        scoreDetails.appendChild(sectionDiv);
    });
    
    // Add total score
    const totalDiv = document.createElement('div');
    totalDiv.className = 'section-score';
    totalDiv.innerHTML = `
        <div>
            <strong>Total</strong><br>
            Questions: ${results.totalQuestions} | Attempted: ${results.totalAttempted} | Correct: ${results.totalCorrect}
        </div>
        <div>
            <strong>Total Score: ${results.totalScore.toFixed(2)}</strong>
        </div>
    `;
    scoreDetails.appendChild(totalDiv);
    
    document.getElementById('totalQuestionsCount').textContent = results.totalQuestions;
    showScreen('summaryScreen');
}

function restartTest() {
    // Reset all state
    testState = {
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
        sections: [],
        answers: {},
        sectionStartTime: null,
        timer: null,
        warningCount: 0,
        loginId: "",
        isTestLocked: false,
        isTestCompleted: false
    };
    
    // Clear inputs
    document.getElementById('loginId').value = '';
    document.getElementById('password').value = '';
    document.getElementById('reloginId').value = '';
    document.getElementById('reloginPassword').value = '';
    
    // Update warning counter display
    document.getElementById('warningCount').textContent = '0';
    
    clearInterval(testState.timer);
    initializeTest();
}

// Security Monitoring
function setupSecurityMonitoring() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        if (!testState.isTestCompleted && !testState.isTestLocked) {
            e.preventDefault();
            handleSecurityViolation('Right-click detected');
        }
    });
    
    // Monitor keyboard usage (except during login)
    document.addEventListener('keydown', function(e) {
        // Allow keyboard usage only on login screens and input fields
        const activeScreen = document.querySelector('.screen.active');
        const isLoginScreen = activeScreen && activeScreen.id === 'loginScreen';
        const isReloginModal = document.getElementById('reloginModal').classList.contains('active');
        const isInputFocused = document.activeElement.tagName === 'INPUT';
        
        if (!isLoginScreen && !isReloginModal && !isInputFocused && !testState.isTestCompleted && !testState.isTestLocked) {
            handleSecurityViolation('Keyboard usage detected');
        }
    });
    
    // Monitor window focus/blur
    window.addEventListener('blur', function() {
        if (!testState.isTestCompleted && !testState.isTestLocked) {
            handleSecurityViolation('Window lost focus');
        }
    });
}

function handleSecurityViolation(reason) {
    testState.warningCount++;
    document.getElementById('warningCount').textContent = testState.warningCount;
    
    if (testState.warningCount >= 3) {
        lockTest();
    } else {
        showWarningAndRequireRelogin(reason);
    }
}

function showWarningAndRequireRelogin(reason) {
    // Pause timer
    clearInterval(testState.timer);
    
    // Show warning
    document.getElementById('warningMessage').textContent = 
        'Please do not use right click or keyboard during the test except for logging in. Only left mouse click is allowed.';
    showModal('warningModal');
}

function acknowledgeWarning() {
    hideModal('warningModal');
    showModal('reloginModal');
}

function continueTest() {
    const reloginId = document.getElementById('reloginId').value.trim();
    const reloginPassword = document.getElementById('reloginPassword').value.trim();
    
    if (!reloginId || !reloginPassword) {
        alert('Please enter both Login ID and Password to continue');
        return;
    }
    
    if (reloginId !== testState.loginId) {
        alert('Login ID does not match. Please enter the correct Login ID.');
        return;
    }
    
    // Clear relogin inputs
    document.getElementById('reloginId').value = '';
    document.getElementById('reloginPassword').value = '';
    
    hideModal('reloginModal');
    
    // Resume timer
    startTimer();
}

function lockTest() {
    testState.isTestLocked = true;
    clearInterval(testState.timer);
    showScreen('lockedScreen');
}

// Utility Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Prevent copy-paste and other shortcuts
document.addEventListener('keydown', function(e) {
    // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, F12, etc.
    if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) || 
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        if (!testState.isTestCompleted && !testState.isTestLocked) {
            handleSecurityViolation('Restricted key combination used');
        }
    }
});

// Prevent text selection except in input fields
document.addEventListener('selectstart', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
}); 