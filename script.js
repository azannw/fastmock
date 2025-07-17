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
    violationCount: 0,
    maxViolations: 2, // User gets 2 chances, locked on 3rd violation
    loginId: "",

    isTestLocked: false,
    isTestCompleted: false,
    isLaptop: false,
    testStarted: false,
    lastUserActivity: Date.now(), // Track user activity to prevent false blur triggers
    userActivityEvents: ['click', 'touchstart', 'keydown', 'mousemove'] // Events that indicate user activity
};

// Initialize test when page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        detectDevice();
        initializeTest();
        setupSecurityMonitoring();
        setupUserActivityTracking();
        setupCheckboxListener();
        console.log('✅ FAST Mock Test initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing test:', error);
        alert('Error loading test. Please refresh the page.');
    }
});

function setupUserActivityTracking() {
    // Track user activity to help determine if blur events are legitimate
    testState.userActivityEvents.forEach(eventType => {
        document.addEventListener(eventType, function() {
            testState.lastUserActivity = Date.now();
        }, { passive: true });
    });
}

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

function detectDevice() {
    // More robust mobile device detection
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for specific mobile indicators
    const mobileIndicators = [
        /android/i,
        /webos/i,
        /iphone/i,
        /ipad/i,
        /ipod/i,
        /blackberry/i,
        /iemobile/i,
        /opera mini/i,
        /mobile/i,
        /tablet/i
    ];
    
    const isMobileUA = mobileIndicators.some(regex => regex.test(userAgent));
    
    // Check screen dimensions (mobile devices typically have narrower screens)
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const isSmallScreen = screenWidth < 768 || screenHeight < 600;
    
    // Check for touch capability (most mobile devices are touch-primary)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check for orientation API (mobile devices support this)
    const hasOrientationAPI = 'orientation' in window;
    
    // Check if device has a physical keyboard (indicates laptop/desktop)
    const hasPhysicalKeyboard = !isTouchDevice || (screenWidth >= 1024 && screenHeight >= 768);
    
    // More sophisticated laptop/desktop detection with better logic
    // A device is considered laptop/desktop if:
    // 1. Not detected as mobile by user agent AND
    // 2. Has reasonable screen size (width >= 1024 OR height >= 768) AND
    // 3. Either not touch-primary OR has large screen despite touch (hybrid devices)
    const isLikelyLaptop = !isMobileUA && 
                          (screenWidth >= 1024 || screenHeight >= 768) && 
                          !hasOrientationAPI && // Mobile devices usually have orientation API
                          !/android|ios|mobile|tablet/i.test(userAgent);
    
    // Additional check: if it's a hybrid device (touch + large screen), treat as laptop
    const isHybridDevice = isTouchDevice && screenWidth >= 1024 && screenHeight >= 768 && !isMobileUA;
    
    // Final determination - be conservative to avoid false positives
    testState.isLaptop = isLikelyLaptop || isHybridDevice;
    
    // Override for known problematic cases
    if (/ipad|tablet/i.test(userAgent) && screenWidth < 1366) {
        testState.isLaptop = false; // Force tablets to be treated as mobile
    }
    
    console.log('Enhanced Device Detection:', {
        isLaptop: testState.isLaptop,
        isMobileUA: isMobileUA,
        isSmallScreen: isSmallScreen,
        isTouchDevice: isTouchDevice,
        hasOrientationAPI: hasOrientationAPI,
        hasPhysicalKeyboard: hasPhysicalKeyboard,
        isLikelyLaptop: isLikelyLaptop,
        isHybridDevice: isHybridDevice,
        screenWidth: screenWidth,
        screenHeight: screenHeight,
        userAgent: userAgent.substring(0, 50) + '...'
    });
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
    
    // Mark test as started to enable cheat detection
    testState.testStarted = true;
    
    // Violation tracking will be silent - no UI updates needed
    
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
        violationCount: 0,
        maxViolations: 2,
        loginId: "",
        isTestLocked: false,
        isTestCompleted: false,
        isLaptop: false,
        testStarted: false,
        lastUserActivity: Date.now(), // Track user activity to prevent false blur triggers
        userActivityEvents: ['click', 'touchstart', 'keydown', 'mousemove'] // Events that indicate user activity
    };
    
    // Clear inputs
    document.getElementById('loginId').value = '';
    document.getElementById('password').value = '';
    document.getElementById('reloginId').value = '';
    document.getElementById('reloginPassword').value = '';
    
    clearInterval(testState.timer);
    
    // Re-detect device and reinitialize
    detectDevice();
    initializeTest();
}

// Security Monitoring
function setupSecurityMonitoring() {
    // Enhanced right-click detection for laptops during test
    document.addEventListener('contextmenu', function(e) {
        if (shouldTriggerCheatDetection()) {
            e.preventDefault();
            handleCheatViolation('Right-click detected during test');
        }
    });
    
    // Enhanced keyboard monitoring for laptops during test
    document.addEventListener('keydown', function(e) {
        // Allow keyboard usage only on login screens and input fields
        const activeScreen = document.querySelector('.screen.active');
        const isLoginScreen = activeScreen && activeScreen.id === 'loginScreen';
        const isInstructionsScreen = activeScreen && activeScreen.id === 'instructionsScreen';
        const isReloginModal = document.getElementById('reloginModal') && 
                             document.getElementById('reloginModal').classList.contains('active');
        const isWarningModal = document.getElementById('warningModal') && 
                             document.getElementById('warningModal').classList.contains('active');
        const isQuestionListModal = document.getElementById('questionListModal') && 
                                  document.getElementById('questionListModal').classList.contains('active');
        const isSectionChangeModal = document.getElementById('sectionChangeModal') && 
                                   document.getElementById('sectionChangeModal').classList.contains('active');
        const isInputFocused = document.activeElement && 
                             (document.activeElement.tagName === 'INPUT' || 
                              document.activeElement.tagName === 'TEXTAREA' ||
                              document.activeElement.type === 'checkbox' ||
                              document.activeElement.type === 'radio');
        const isAnyModalOpen = isReloginModal || isWarningModal || isQuestionListModal || isSectionChangeModal;
        
        // Allow keyboard on login, instructions, and when any modal is open or input is focused
        const shouldAllowKeyboard = isLoginScreen || isInstructionsScreen || isAnyModalOpen || isInputFocused;
        
        // Enhanced cheat detection for laptops during test ONLY
        if (shouldTriggerCheatDetection() && !shouldAllowKeyboard) {
            // Allow certain navigation keys during test for accessibility
            const allowedKeys = ['Tab', 'Shift', 'Alt', 'Control', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'];
            if (!allowedKeys.includes(e.key)) {
                handleCheatViolation('Keyboard usage detected during test');
                return;
            }
        }
        
        // Legacy security for non-laptop devices - be more lenient
        if (!testState.isLaptop && !shouldAllowKeyboard && !testState.isTestCompleted && !testState.isTestLocked) {
            // Only trigger for obvious cheating attempts on mobile devices
            const suspiciousKeys = ['F12', 'F5']; // Only block obviously suspicious keys on mobile
            if (suspiciousKeys.includes(e.key) || 
                (e.ctrlKey && ['c', 'v', 'x', 'a', 'u'].includes(e.key.toLowerCase()))) {
                handleSecurityViolation('Restricted key combination used');
            }
        }
    });
    
    // Monitor window focus/blur - but be more intelligent about it
    window.addEventListener('blur', function() {
        // Only trigger if we're actually in a test (not on login or instructions)
        const activeScreen = document.querySelector('.screen.active');
        const isActuallyInTest = activeScreen && activeScreen.id === 'testScreen';
        
        // Don't trigger on mobile devices at all - too many false positives
        if (!testState.isLaptop) {
            return;
        }
        
        // Only trigger for laptops when actually in test and not completed/locked
        if (isActuallyInTest && !testState.isTestCompleted && !testState.isTestLocked && testState.testStarted) {
            // Check if user was recently active (within last 5 seconds) - if so, likely legitimate
            const timeSinceActivity = Date.now() - testState.lastUserActivity;
            const wasRecentlyActive = timeSinceActivity < 5000; // 5 seconds
            
            // If user was recently active, they might be legitimately interacting with browser
            if (wasRecentlyActive) {
                console.log('Window blur ignored - user was recently active (', timeSinceActivity, 'ms ago)');
                return;
            }
            
            // Add a small delay to avoid false triggers from quick focus changes
            setTimeout(() => {
                // Double-check that we're still blurred and in test
                const stillBlurred = !document.hasFocus();
                const stillInTest = document.querySelector('.screen.active')?.id === 'testScreen';
                const timeSinceBlur = Date.now() - testState.lastUserActivity;
                
                // Only trigger if window is still blurred, still in test, and user hasn't been active
                if (stillBlurred && stillInTest && !testState.isTestCompleted && !testState.isTestLocked && timeSinceBlur > 3000) {
                    handleSecurityViolation('Window lost focus during test');
                } else {
                    console.log('Window blur violation cancelled - conditions changed');
                }
            }, 2000); // 2 second delay to avoid false positives
        }
    });
}

// Check if cheat detection should be triggered (laptop + test started + actually in test screen)
function shouldTriggerCheatDetection() {
    const activeScreen = document.querySelector('.screen.active');
    const isInTestScreen = activeScreen && activeScreen.id === 'testScreen';
    
    return testState.isLaptop && 
           testState.testStarted && 
           isInTestScreen &&
           !testState.isTestCompleted && 
           !testState.isTestLocked;
}

// Enhanced cheat detection handler for laptops during test
function handleCheatViolation(reason) {
    // Don't trigger if user is actively interacting with the test legitimately
    const isClickingOption = document.activeElement && 
                            (document.activeElement.type === 'radio' || 
                             document.activeElement.classList.contains('option') ||
                             document.activeElement.closest('.option'));
    
    const isClickingButton = document.activeElement && 
                            (document.activeElement.tagName === 'BUTTON' ||
                             document.activeElement.classList.contains('btn-primary') ||
                             document.activeElement.classList.contains('btn-secondary'));
    
    // Don't trigger violations during legitimate interactions
    if (isClickingOption || isClickingButton) {
        console.log('Violation suppressed - user is interacting with test interface');
        return;
    }
    
    testState.violationCount++;
    console.log(`Cheat violation detected: ${reason}. Count: ${testState.violationCount}/${testState.maxViolations + 1}`);
    
    // Violation recorded silently - no UI update needed
    
    if (testState.violationCount > testState.maxViolations) {
        // Permanent lock on 3rd violation
        lockTestPermanently(reason);
    } else {
        // Show warning and require re-login for 1st and 2nd violations
        showCheatWarningAndRequireRelogin(reason);
    }
}

// Legacy security violation handler for other cases
function handleSecurityViolation(reason) {
    // Similar safeguards for legacy handler
    const isClickingOption = document.activeElement && 
                            (document.activeElement.type === 'radio' || 
                             document.activeElement.classList.contains('option') ||
                             document.activeElement.closest('.option'));
    
    const isClickingButton = document.activeElement && 
                            (document.activeElement.tagName === 'BUTTON' ||
                             document.activeElement.classList.contains('btn-primary') ||
                             document.activeElement.classList.contains('btn-secondary'));
    
    // Don't trigger violations during legitimate interactions
    if (isClickingOption || isClickingButton) {
        console.log('Legacy violation suppressed - user is interacting with test interface');
        return;
    }
    
    testState.violationCount++;
    
    if (testState.violationCount >= 3) {
        lockTest();
    } else {
        showWarningAndRequireRelogin(reason);
    }
}

// Enhanced warning for cheat detection on laptops
function showCheatWarningAndRequireRelogin(reason) {
    // Pause timer
    clearInterval(testState.timer);
    
    const remainingChances = testState.maxViolations - testState.violationCount + 1;
    const warningMessage = `VIOLATION DETECTED: ${reason}\n\nYou have ${remainingChances} chance(s) remaining. If you violate the test rules again, your test will be PERMANENTLY LOCKED.\n\nPlease use only left mouse clicks during the test. No keyboard or right-click usage is allowed.`;
    
    // Show warning
    document.getElementById('warningMessage').textContent = warningMessage;
    showModal('warningModal');
}

// Legacy warning function
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
    
    // Clear relogin inputs
    document.getElementById('reloginId').value = '';
    document.getElementById('reloginPassword').value = '';
    
    hideModal('reloginModal');
    
    // Resume timer
    startTimer();
}

// Permanent lock for cheat violations
function lockTestPermanently(reason) {
    testState.isTestLocked = true;
    clearInterval(testState.timer);
    
    // Update the locked screen message for permanent violations
    const lockedContainer = document.querySelector('#lockedScreen .locked-container');
    if (lockedContainer) {
        const titleElement = lockedContainer.querySelector('h2');
        const messageElements = lockedContainer.querySelectorAll('p');
        
        if (titleElement) titleElement.textContent = 'Test Permanently Locked';
        if (messageElements.length >= 2) {
            messageElements[0].textContent = `Final violation detected: ${reason}`;
            messageElements[1].textContent = 'You have exceeded the maximum number of violations (3) allowed during the test. Your test session has been permanently locked.';
            
            // Add Roman Urdu message
            const romanUrduMessage = document.createElement('p');
            romanUrduMessage.style.fontStyle = 'italic';
            romanUrduMessage.style.marginTop = '20px';
            romanUrduMessage.style.color = '#dc3545';
            romanUrduMessage.style.fontWeight = 'bold';
            romanUrduMessage.textContent = 'mana b kia tha k ye harkat ni krni, ab test wale din aisi harkat na krna wrna fast ka dream chapak hojyega';
            
            // Insert after the second message
            if (messageElements[1].nextSibling) {
                lockedContainer.insertBefore(romanUrduMessage, messageElements[1].nextSibling);
            } else {
                messageElements[1].parentNode.insertBefore(romanUrduMessage, messageElements[1].nextSibling);
            }
        }
    }
    
    showScreen('lockedScreen');
}

// Legacy lock function
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

// Prevent copy-paste and other shortcuts - make this smarter
document.addEventListener('keydown', function(e) {
    // Get current screen and state
    const activeScreen = document.querySelector('.screen.active');
    const isInTestScreen = activeScreen && activeScreen.id === 'testScreen';
    const isInputFocused = document.activeElement && 
                         (document.activeElement.tagName === 'INPUT' || 
                          document.activeElement.tagName === 'TEXTAREA');
    
    // Don't block shortcuts if user is in input fields
    if (isInputFocused) {
        return;
    }
    
    // Disable dangerous shortcuts only when in test and when it makes sense
    const isDangerousShortcut = (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) || 
                               e.key === 'F12' || 
                               (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                               (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                               (e.ctrlKey && e.key === 'u');
    
    if (isDangerousShortcut) {
        e.preventDefault();
        
        // Only trigger security violation if we're actually in test and on appropriate device
        if (isInTestScreen && !testState.isTestCompleted && !testState.isTestLocked) {
            // For laptops, use enhanced cheat detection
            if (testState.isLaptop && testState.testStarted) {
                handleCheatViolation('Restricted key combination used');
            } 
            // For other devices, use legacy but be more lenient
            else if (!testState.isLaptop) {
                // Only trigger on obviously suspicious shortcuts
                if (e.key === 'F12' || (e.ctrlKey && e.key === 'u')) {
                    handleSecurityViolation('Restricted key combination used');
                }
            }
        }
    }
});

// Prevent text selection except in input fields - be more permissive on mobile
document.addEventListener('selectstart', function(e) {
    // Allow text selection on mobile devices for better UX
    if (!testState.isLaptop) {
        return;
    }
    
    // On laptops, still prevent selection except in input fields and during login
    const activeScreen = document.querySelector('.screen.active');
    const isLoginOrInstructions = activeScreen && 
                                (activeScreen.id === 'loginScreen' || 
                                 activeScreen.id === 'instructionsScreen' ||
                                 activeScreen.id === 'summaryScreen');
    
    if (e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'TEXTAREA' && 
        !isLoginOrInstructions &&
        testState.testStarted) {
        e.preventDefault();
    }
}); 