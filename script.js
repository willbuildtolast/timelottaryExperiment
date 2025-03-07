// Check if user came from consent page
/*
if (!document.referrer.includes('index.html')) {
    window.location.href = 'index.html';
}
*/

// Add this at the beginning of script.js, after the consent check
let currentInstructionStep = 1;
const totalSteps = 4;

// Arrays of possible delays (in weeks), probabilities (in percentages), and values (in dollars)
const delays = [2, 4, 6, 8, 10]; // months
const probabilities = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
const values = [100, 300, 500, 700, 900]; // dollars

// Number of practice trials and main experiment trials
const practiceTrials = 5;
const totalTrials = 400;
let currentTrial = 0;
let responses = [];
let trialStartTime = 0; // Variable to store the start time of each trial
let inPractice = true; // Flag to indicate if we're in practice trials
let abnormalSelections = 0; // Counter for abnormal selections during practice
let isPaused = false;

// Add new constants and variables
const basePayment = 15;
const realLotteryTrials = new Set();
let totalBonus = 0;

// Global variable to store real lottery outcomes
let realLotteryOutcomes = new Map();

// Function to generate a practice trial with obvious comparisons
function generatePracticeTrial(trialNumber) {
    let normalOption = {
        text: `Option {optionLabel}:<br>
               <div class="lottery-details">
                   <div class="reward-amount">$500</div>
                   <div class="probability">50% chance</div>
                   <div class="delay-time">in 4 months</div>
               </div>`,
        delay: 4,
        probability: 0.5,
        value: 500,
        isAbnormal: false
    };

    let abnormalOption;
    switch(trialNumber) {
        case 1:
            abnormalOption = {
                text: `Option {optionLabel}:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$0</div>
                           <div class="probability">5% chance</div>
                           <div class="delay-time">in 10 months</div>
                       </div>`,
                delay: 10,
                probability: 0.05,
                value: 0,
                isAbnormal: true
            };
            break;
        case 2:
            abnormalOption = {
                text: `Option {optionLabel}:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$0</div>
                           <div class="probability">50% chance</div>
                           <div class="delay-time">in 4 months</div>
                       </div>`,
                delay: 4,
                probability: 0.5,
                value: 0,
                isAbnormal: true
            };
            break;
        case 3:
            abnormalOption = {
                text: `Option {optionLabel}:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$1</div>
                           <div class="probability">1% chance</div>
                           <div class="delay-time">in 20 months</div>
                       </div>`,
                delay: 20,
                probability: 0.01,
                value: 1,
                isAbnormal: true
            };
            break;
        case 4:
            abnormalOption = {
                text: `Option {optionLabel}:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$5</div>
                           <div class="probability">5% chance</div>
                           <div class="delay-time">in 4 months</div>
                       </div>`,
                delay: 4,
                probability: 0.05,
                value: 5,
                isAbnormal: true
            };
            break;
        case 5:
            abnormalOption = {
                text: `Option {optionLabel}:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$1</div>
                           <div class="probability">15% chance</div>
                           <div class="delay-time">in 4 months</div>
                       </div>`,
                delay: 4,
                probability: 0.15,
                value: 1,
                isAbnormal: true
            };
            break;
        default:
            return generateTrial();
    }

    let options = [normalOption, abnormalOption];
    if (Math.random() < 0.5) {
        [options[0], options[1]] = [options[1], options[0]];
    }
    options[0].text = options[0].text.replace('{optionLabel}', 'A');
    options[1].text = options[1].text.replace('{optionLabel}', 'B');

    return {
        optionA: options[0],
        optionB: options[1]
    };
}

// Function to generate a trial with randomized options avoiding same delay, probability, or value
function generateTrial() {
    // Randomly select delay, probability, and value for Option A
    let delayA = delays[Math.floor(Math.random() * delays.length)];
    let probA = probabilities[Math.floor(Math.random() * probabilities.length)];
    let valueA = values[Math.floor(Math.random() * values.length)];

    // Exclude delayA from delays array for Option B
    let delaysForB = delays.filter(delay => delay !== delayA);
    let delayB = delaysForB[Math.floor(Math.random() * delaysForB.length)];

    // Exclude probA from probabilities array for Option B
    let probsForB = probabilities.filter(prob => prob !== probA);
    let probB = probsForB[Math.floor(Math.random() * probsForB.length)];

    // Exclude valueA from values array for Option B
    let valuesForB = values.filter(value => value !== valueA);
    let valueB = valuesForB[Math.floor(Math.random() * valuesForB.length)];

    // Format probability as percentage for display
    let optionAText = `Option A:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$${valueA}</div>
                           <div class="probability">${(probA * 100).toFixed(1)}% chance</div>
                           <div class="delay-time">in ${delayA} month(s)</div>
                       </div>`;
    let optionBText = `Option B:<br>
                       <div class="lottery-details">
                           <div class="reward-amount">$${valueB}</div>
                           <div class="probability">${(probB * 100).toFixed(1)}% chance</div>
                           <div class="delay-time">in ${delayB} month(s)</div>
                       </div>`;

    return {
        optionA: {
            text: optionAText,
            delay: delayA,
            probability: probA,
            value: valueA
        },
        optionB: {
            text: optionBText,
            delay: delayB,
            probability: probB,
            value: valueB
        }
    };
}

// Function to display the current trial
function displayTrial() {
    if (isPaused) return;

    let trialData;
    let progressPercentage;

    if (inPractice && currentTrial < practiceTrials) {
        trialData = generatePracticeTrial(currentTrial + 1);
        document.getElementById('trial-number').innerHTML = `Practice Trial ${currentTrial + 1} of ${practiceTrials}`;
        progressPercentage = (currentTrial / practiceTrials) * 100;
    } else if (inPractice && currentTrial >= practiceTrials) {
        inPractice = false;
        currentTrial = 0;
        alert('Practice trials completed. The main experiment will now begin. You will complete 400 trials.');
        displayTrial();
        return;
    } else if (currentTrial < totalTrials) {
        trialData = generateTrial();
        document.getElementById('trial-number').innerHTML = `Trial ${currentTrial + 1} of ${totalTrials}`;
        progressPercentage = (currentTrial / totalTrials) * 100;
        
        // Add a reminder every 100 trials
        if (currentTrial > 0 && currentTrial % 100 === 0) {
            alert(`You have completed ${currentTrial} trials. Take a short break if needed.`);
        }
    } else {
        endExperiment();
        return;
    }

    // Update progress bar
    document.getElementById('progress-indicator').style.width = `${progressPercentage}%`;

    let optionAButton = document.getElementById('optionA');
    let optionBButton = document.getElementById('optionB');

    optionAButton.innerHTML = trialData.optionA.text;
    optionBButton.innerHTML = trialData.optionB.text;

    optionAButton.onclick = null;
    optionBButton.onclick = null;

    trialStartTime = new Date().getTime();

    optionAButton.onclick = () => recordResponse(0, trialData);
    optionBButton.onclick = () => recordResponse(1, trialData);
}

// Function to select random real lottery trials
function selectRealLotteryTrials() {
    while (realLotteryTrials.size < 3) {
        // Select trials between 50 and 350 to avoid clustering at start/end
        const trial = Math.floor(Math.random() * 300) + 50;
        realLotteryTrials.add(trial);
    }
}

// Function to execute real lottery
async function executeRealLottery(choice, trialData) {
    const selectedOption = choice === 0 ? trialData.optionA : trialData.optionB;
    
    // Determine outcome if not already stored
    if (!realLotteryOutcomes.has(currentTrial)) {
        const randomNum = Math.random();
        const won = randomNum <= selectedOption.probability;
        const bonus = won ? selectedOption.value * 0.01 : 0;
        
        realLotteryOutcomes.set(currentTrial, {
            won: won,
            bonus: bonus,
            delay: selectedOption.delay
        });
    }
    
    const outcome = realLotteryOutcomes.get(currentTrial);

    const modal = document.createElement('div');
    modal.className = 'lottery-modal';
    
    modal.innerHTML = `
        <div class="lottery-modal-content">
            <h3>Real Lottery Trial</h3>
            
            <div class="lottery-options">
                <div class="lottery-option ${choice === 0 ? 'selected' : ''}">
                    <h4>Option A</h4>
                    <p>$${trialData.optionA.value}</p>
                    <p>${(trialData.optionA.probability * 100).toFixed(0)}% chance</p>
                    <p>${trialData.optionA.delay} months delay</p>
                </div>
                <div class="lottery-option ${choice === 1 ? 'selected' : ''}">
                    <h4>Option B</h4>
                    <p>$${trialData.optionB.value}</p>
                    <p>${(trialData.optionB.probability * 100).toFixed(0)}% chance</p>
                    <p>${trialData.optionB.delay} months delay</p>
                </div>
            </div>

            <div class="lottery-animation">
                <div class="spinner"></div>
                <p>Executing lottery...</p>
            </div>

            <div class="lottery-result" style="display: none;">
                <h4>${outcome.won ? 'Congratulations!' : 'Not This Time'}</h4>
                ${outcome.won ? `
                    <div class="win-details">
                        <p>You won this lottery!</p>
                        <div class="bonus-calculation">
                            <p>Winning amount: $${selectedOption.value}</p>
                            <p>Bonus (1%): $${outcome.bonus.toFixed(2)}</p>
                            <p>Payment due: In ${outcome.delay} months</p>
                        </div>
                    </div>
                ` : `
                    <p>You did not win this lottery.</p>
                `}
            </div>

            <button class="modal-close-btn" style="display: none;">Continue</button>
        </div>
    `;

    document.body.appendChild(modal);

    return new Promise(resolve => {
        setTimeout(() => {
            modal.querySelector('.lottery-animation').style.display = 'none';
            modal.querySelector('.lottery-result').style.display = 'block';
            modal.querySelector('.modal-close-btn').style.display = 'block';
        }, 2000);

        modal.querySelector('.modal-close-btn').onclick = () => {
            document.body.removeChild(modal);
            resolve();
        };
    });
}

// Modify recordResponse function to use stored outcomes
async function recordResponse(choice, trialData) {
    let responseTime = new Date().getTime() - trialStartTime;

    if (inPractice) {
        let selectedOption = choice === 0 ? trialData.optionA : trialData.optionB;
        if (selectedOption.isAbnormal) {
            abnormalSelections++;
        }
        if (abnormalSelections > 3) {
            alert('You have missed the dominant option more than three times during the practice trials. Please pay attention to the choices. The practice trials will restart.');
            currentTrial = 0;
            abnormalSelections = 0;
            displayTrial();
            return;
        }
    } else {
        const selectedOption = choice === 0 ? trialData.optionA : trialData.optionB;
        let outcome = null;
        
        if (realLotteryTrials.has(currentTrial)) {
            await executeRealLottery(choice, trialData);
            const lotteryOutcome = realLotteryOutcomes.get(currentTrial);
            
            outcome = lotteryOutcome.won ? 
                `Won $${lotteryOutcome.bonus.toFixed(2)} bonus, paid in ${lotteryOutcome.delay} months` : 
                'Did not win';
        }

        responses.push({
            trial: currentTrial + 1,
            choice: choice,
            responseTime: responseTime,
            optionA: trialData.optionA,
            optionB: trialData.optionB,
            isRealLottery: realLotteryTrials.has(currentTrial),
            outcome: outcome
        });
    }

    currentTrial++;
    showBlankPage();
    setTimeout(displayTrial, 500);
}

// Modify endExperiment function to use stored outcomes
function endExperiment() {
    // Recalculate total bonus to ensure accuracy
    totalBonus = Array.from(realLotteryOutcomes.values())
        .reduce((sum, outcome) => sum + outcome.bonus, 0);
    
    // Filter real lottery trials from responses
    const realLotteryResults = responses.filter(response => response.isRealLottery);
    
    document.querySelector('.container').innerHTML = `
        <div class="ending-screen">
            <div class="warning-section">
                <div class="warning-message">
                    <span class="warning-icon">⚠</span>
                    <h4>Important: Do NOT close this page!</h4>
                    <p>Your responses and bonus calculations are being recorded. 
                    If you close this page now, all data may be lost, and we may not be able to compensate you properly.</p>
                    <p>Please notify the researcher that you have finished. They will confirm your data has been saved 
                    and process your payment.</p>
                </div>
            </div>

            <h2>Experiment Complete!</h2>
            
            <div class="real-lottery-summary">
                <h3>Real Lottery Results</h3>
                <div class="summary-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Trial</th>
                                <th>Option A</th>
                                <th>Option B</th>
                                <th>Your Choice</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${realLotteryResults.map(trial => `
                                <tr>
                                    <td>Trial ${trial.trial}</td>
                                    <td class="${trial.choice === 0 ? 'selected-option' : ''}">
                                        $${trial.optionA.value}, ${(trial.optionA.probability * 100).toFixed(0)}%<br>
                                        ${trial.optionA.delay} months
                                    </td>
                                    <td class="${trial.choice === 1 ? 'selected-option' : ''}">
                                        $${trial.optionB.value}, ${(trial.optionB.probability * 100).toFixed(0)}%<br>
                                        ${trial.optionB.delay} months
                                    </td>
                                    <td>Option ${trial.choice === 0 ? 'A' : 'B'}</td>
                                    <td>${trial.outcome}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="compensation-details">
                <h3>Final Compensation</h3>
                <div class="payment-breakdown">
                    <p>Base Payment: <span class="amount">$${basePayment.toFixed(2)}</span></p>
                    <p>Total Bonus Earned: <span class="amount">$${totalBonus.toFixed(2)}</span></p>
                    <p class="total-payment">
                        Total Earnings: $${(basePayment + totalBonus).toFixed(2)}
                    </p>
                </div>
            </div>

            <div class="download-section">
                <button id="downloadBtn" class="download-button">
                    <span class="download-icon">⬇</span>
                    Download CSV Data
                </button>
            </div>
        </div>
    `;

    document.getElementById('downloadBtn').addEventListener('click', prepareCSVDownload);
}

// Helper function to generate bonus payment schedule
function generateBonusSchedule(realLotteryResults) {
    const schedule = {};
    
    realLotteryResults.forEach(trial => {
        const selectedOption = trial.choice === 0 ? trial.optionA : trial.optionB;
        const delay = selectedOption.delay;
        if (trial.bonus > 0) {
            schedule[delay] = (schedule[delay] || 0) + trial.bonus;
        }
    });

    if (Object.keys(schedule).length === 0) {
        return '<p>No bonus payments earned</p>';
    }

    return Object.entries(schedule)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([delay, amount]) => `
            <p>${delay === '0' ? 
                `$${amount.toFixed(2)} will be paid immediately` : 
                `$${amount.toFixed(2)} will be paid in ${delay} months`
            }</p>
        `).join('');
}

// Handle notify researcher button click
function handleNotifyResearcher() {
    const notifyBtn = document.getElementById('notifyBtn');
    notifyBtn.disabled = true;
    notifyBtn.innerHTML = `
        <span class="notify-icon">✓</span>
        Researcher Notified
    `;
    notifyBtn.classList.add('notified');
}

// Update the CSV preparation function
function prepareCSVDownload() {
    if (responses.length === 0) {
        return; // No data to export
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Update header to include Trial_Number
    csvContent += "Trial_Number,OptionA_Delay,OptionA_Probability,OptionA_Value,OptionB_Delay,OptionB_Probability,OptionB_Value,Choice,ResponseTime(ms)\n";

    responses.forEach((response, index) => {
        let row = [
            index + 1, // Add trial number starting from 1
            response.optionA.delay,
            response.optionA.probability,
            response.optionA.value,
            response.optionB.delay,
            response.optionB.probability,
            response.optionB.value,
            response.choice,
            response.responseTime
        ].join(",");
        csvContent += row + "\n";
    });

    // Create and trigger download
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experiment_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add control button functionality
document.addEventListener('DOMContentLoaded', function() {
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exitBtn = document.getElementById('exitBtn');
    const optionsDiv = document.getElementById('options');

    pauseBtn.addEventListener('click', () => {
        handlePause();
    });

    resumeBtn.addEventListener('click', () => {
        handleResume();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to restart the experiment? All progress will be lost.')) {
            currentTrial = 0;
            responses = [];
            inPractice = true;
            abnormalSelections = 0;
            isPaused = false;
            optionsDiv.style.display = 'flex';
            resumeBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            displayTrial();
        }
    });

    exitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit the experiment? All progress will be lost.')) {
            window.location.href = 'exit.html';
        }
    });

    handleInstructions();
    selectRealLotteryTrials();
});

// Function to handle instruction navigation
function handleInstructions() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepIndicator = document.getElementById('current-step');
    const checkbox = document.getElementById('understand-checkbox');

    function updateButtons() {
        prevBtn.disabled = currentInstructionStep === 1;
        nextBtn.disabled = currentInstructionStep === totalSteps && !checkbox.checked;
        
        if (currentInstructionStep === totalSteps) {
            nextBtn.textContent = 'Start Experiment';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    function showStep(step) {
        // Hide all steps
        for (let i = 1; i <= totalSteps; i++) {
            document.getElementById(`step${i}`).style.display = 'none';
        }
        // Show current step
        document.getElementById(`step${step}`).style.display = 'block';
        stepIndicator.textContent = step;
        updateButtons();
    }

    prevBtn.addEventListener('click', () => {
        if (currentInstructionStep > 1) {
            currentInstructionStep--;
            showStep(currentInstructionStep);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentInstructionStep < totalSteps) {
            currentInstructionStep++;
            showStep(currentInstructionStep);
        } else if (checkbox.checked) {
            // Start the experiment
            document.getElementById('instructions-container').style.display = 'none';
            document.getElementById('experiment-container').style.display = 'block';
            displayTrial();
        }
    });

    checkbox.addEventListener('change', updateButtons);

    // Initialize first step
    showStep(1);

    // Update Step 2 in handleInstructions to include real lottery explanation
    const step2Content = document.getElementById('step2');
    step2Content.innerHTML = `
        <h3>Understanding Lottery Options & Real Rewards</h3>
        <div class="instruction-section">
            <h4>Basic Lottery Structure</h4>
            <ul>
                <li><strong>Rewards:</strong> The amount you can win ($100 to $900)</li>
                <li><strong>Probabilities:</strong> Your chance of winning (5% to 95%)</li>
                <li><strong>Time delays:</strong> When you receive the reward (2 to 10 months)</li>
            </ul>
        </div>
        
        <div class="instruction-section">
            <h4>Real Money Opportunities</h4>
            <p>There are some random trials in this experiment that will be real lotteries with actual monetary rewards:</p>
            <ul>
                <li>You won't know which trials are real in advance</li>
                <li>If you win a real lottery, you'll receive 1% of the chosen amount as bonus</li>
                <li>Bonuses are paid according to the delay period of your chosen lottery</li>
            </ul>
        </div>
        
        <div class="instruction-section">
            <h4>Example</h4>
            <p>If you choose a lottery offering "$500 with 50% chance after 4 months" and win:</p>
            <ul>
                <li>Bonus amount: $5.00 (1% of $500)</li>
                <li>Payment timing: 4 months after the experiment</li>
            </ul>
        </div>
    `;
}

// Add blank page transition function
function showBlankPage() {
    const optionsDiv = document.getElementById('options');
    optionsDiv.style.opacity = '0';
    
    setTimeout(() => {
        optionsDiv.style.opacity = '1';
    }, 500); // 0.5 second blank page
}

// Update pause functionality
function handlePause() {
    const optionsDiv = document.getElementById('options');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');

    isPaused = true;
    optionsDiv.style.display = 'none';
    document.querySelector('.paused-message')?.remove();
    
    const pausedMessage = document.createElement('div');
    pausedMessage.className = 'paused-message';
    pausedMessage.textContent = 'PAUSED';
    document.querySelector('.container').insertBefore(pausedMessage, optionsDiv);
    
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-block';
}

function handleResume() {
    const optionsDiv = document.getElementById('options');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');

    isPaused = false;
    optionsDiv.style.display = 'flex';
    document.querySelector('.paused-message')?.remove();
    
    resumeBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    displayTrial();
}

// Start the experiment
displayTrial();
