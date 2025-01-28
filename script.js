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
const delays = [1, 2, 3, 4, 5]; // months
const probabilities = [0.05, 0.275, 0.5, 0.725, 0.95]; // decimal probabilities
const values = [100, 300, 500, 700, 900]; // dollars

// Number of practice trials and main experiment trials
const practiceTrials = 5;
const totalTrials = 100;
let currentTrial = 0;
let responses = [];
let trialStartTime = 0; // Variable to store the start time of each trial
let inPractice = true; // Flag to indicate if we're in practice trials
let abnormalSelections = 0; // Counter for abnormal selections during practice
let isPaused = false;

// Function to generate a practice trial with obvious comparisons
function generatePracticeTrial(trialNumber) {
    let normalOption = {
        text: `Option {optionLabel}:<br>$500, 50% chance in 3 month(s)`,
        delay: 3,
        probability: 0.5,
        value: 500,
        isAbnormal: false
    };

    let abnormalOption;
    switch(trialNumber) {
        case 1:
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0, 20% chance in 500 month(s)`,
                delay: 500,
                probability: 0.2,
                value: 0,
                isAbnormal: true
            };
            break;
        case 2:
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0, 50% chance in 3 month(s)`,
                delay: 3,
                probability: 0.5,
                value: 0,
                isAbnormal: true
            };
            break;
        case 3:
            abnormalOption = {
                text: `Option {optionLabel}:<br>$500, 50% chance in 600 month(s)`,
                delay: 600,
                probability: 0.5,
                value: 500,
                isAbnormal: true
            };
            break;
        case 4:
            abnormalOption = {
                text: `Option {optionLabel}:<br>$500, 1% chance in 3 month(s)`,
                delay: 3,
                probability: 0.01,
                value: 500,
                isAbnormal: true
            };
            break;
        case 5:
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0.1, 10% chance in 3 month(s)`,
                delay: 3,
                probability: 0.1,
                value: 0.1,
                isAbnormal: true
            };
            break;
        default:
            // Fallback to a normal trial generation (should not reach here)
            return generateTrial();
    }

    // Randomly assign the normal and abnormal options to Option A or B
    let options = [normalOption, abnormalOption];
    // Randomly shuffle the options array
    if (Math.random() < 0.5) {
        // Swap options
        [options[0], options[1]] = [options[1], options[0]];
    }
    // Update option labels in the text
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
    let optionAText = `Option A:<br>$${valueA}, ${(probA * 100).toFixed(1)}% chance in ${delayA} month(s)`;
    let optionBText = `Option B:<br>$${valueB}, ${(probB * 100).toFixed(1)}% chance in ${delayB} month(s)`;

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
        alert('Practice trials completed. The main experiment will now begin.');
        displayTrial();
        return;
    } else if (currentTrial < totalTrials) {
        trialData = generateTrial();
        document.getElementById('trial-number').innerHTML = `Trial ${currentTrial + 1} of ${totalTrials}`;
        progressPercentage = (currentTrial / totalTrials) * 100;
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

// Function to record the user's response
function recordResponse(choice, trialData) {
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
        responses.push({
            trial: currentTrial + 1,
            choice: choice,
            responseTime: responseTime,
            optionA: trialData.optionA,
            optionB: trialData.optionB
        });
    }

    currentTrial++;
    showBlankPage();
    setTimeout(displayTrial, 500);
}

// Function to end the experiment and display the results
function endExperiment() {
    document.querySelector('.container').innerHTML = `
        <div class="ending-screen">
            <h2>You have finished the experiment.</h2>
            <p>Thank you for participating in this experiment.</p>
            <p class="final-instruction">Please do not click on anything on the page and inform the experimenter that you have finished.</p>
            <div class="download-section">
                <button id="downloadBtn" class="download-button">
                    <span class="download-icon">⬇</span>
                    Download CSV Data
                </button>
            </div>
        </div>
    `;

    // Add click event listener to the download button
    document.getElementById('downloadBtn').addEventListener('click', prepareCSVDownload);
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
