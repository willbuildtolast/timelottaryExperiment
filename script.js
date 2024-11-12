// Arrays of possible delays (in weeks), probabilities (in percentages), and values (in dollars)
const delays = [1,2,3,4,5,6,7,8,9,10];
const probabilities = [5,15,25,35,45,55,65,75,85,95];
const values = [100,200,300,400,500,600,700,800,900,1000];

// Number of practice trials and main experiment trials
const practiceTrials = 5;
const totalTrials = 30;
let currentTrial = 0;
let responses = [];
let trialStartTime = 0; // Variable to store the start time of each trial
let inPractice = true; // Flag to indicate if we're in practice trials
let abnormalSelections = 0; // Counter for abnormal selections during practice

// Function to generate a practice trial with obvious comparisons
function generatePracticeTrial(trialNumber) {
    let normalOption = {
        text: `Option {optionLabel}:<br>$500, 50% chance in 5 week(s)`,
        delay: 5,
        probability: 50,
        value: 500,
        isAbnormal: false
    };

    let abnormalOption;
    switch(trialNumber) {
        case 1:
            // Option with 0% probability
            abnormalOption = {
                text: `Option {optionLabel}:<br>$500, 0% chance in 5 week(s)`,
                delay: 5,
                probability: 0,
                value: 500,
                isAbnormal: true
            };
            break;
        case 2:
            // Option with $0 value
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0, 50% chance in 5 week(s)`,
                delay: 5,
                probability: 50,
                value: 0,
                isAbnormal: true
            };
            break;
        case 3:
            // Option with extremely long delay
            abnormalOption = {
                text: `Option {optionLabel}:<br>$500, 50% chance in 52000 week(s)`,
                delay: 52000, // Approximately 1000 years
                probability: 50,
                value: 500,
                isAbnormal: true
            };
            break;
        case 4:
            // Option with 0% probability and $0 value
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0, 0% chance in 5 week(s)`,
                delay: 5,
                probability: 0,
                value: 0,
                isAbnormal: true
            };
            break;
        case 5:
            // Option with 0% probability, $0 value, and extremely long delay
            abnormalOption = {
                text: `Option {optionLabel}:<br>$0, 0% chance in 52000 week(s)`,
                delay: 52000,
                probability: 0,
                value: 0,
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

    // Create option texts
    let optionAText = `Option A:<br>$${valueA}, ${probA}% chance in ${delayA} week(s)`;
    let optionBText = `Option B:<br>$${valueB}, ${probB}% chance in ${delayB} week(s)`;

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
    let trialData;

    if (inPractice && currentTrial < practiceTrials) {
        // Generate practice trial
        trialData = generatePracticeTrial(currentTrial + 1);
        document.getElementById('trial-number').innerHTML = `Practice Trial ${currentTrial + 1} of ${practiceTrials}`;
    } else if (inPractice && currentTrial >= practiceTrials) {
        // Check if participant passed the practice trials
        inPractice = false;
        currentTrial = 0;
        alert('Practice trials completed. The main experiment will now begin.');
        displayTrial();
        return;
    } else if (currentTrial < totalTrials) {
        // Generate main trial
        trialData = generateTrial();
        document.getElementById('trial-number').innerHTML = `Trial ${currentTrial + 1} of ${totalTrials}`;
    } else {
        endExperiment();
        return;
    }

    let optionAButton = document.getElementById('optionA');
    let optionBButton = document.getElementById('optionB');

    optionAButton.innerHTML = trialData.optionA.text;
    optionBButton.innerHTML = trialData.optionB.text;

    // Remove previous event listeners
    optionAButton.onclick = null;
    optionBButton.onclick = null;

    // Record the start time of the trial
    trialStartTime = new Date().getTime();

    // Add event listeners for choices
    optionAButton.onclick = () => recordResponse(0, trialData);
    optionBButton.onclick = () => recordResponse(1, trialData);
}

// Function to record the user's response
function recordResponse(choice, trialData) {
    // Calculate response time
    let responseTime = new Date().getTime() - trialStartTime; // in milliseconds

    if (inPractice) {
        // Check if the selected option is abnormal
        let selectedOption = choice === 0 ? trialData.optionA : trialData.optionB;
        if (selectedOption.isAbnormal) {
            abnormalSelections++;
        }
        // Check if abnormalSelections > 3
        if (abnormalSelections > 3) {
            alert('You have selected the less optimal option more than three times during the practice trials. Please pay attention to the choices. The practice trials will restart.');
            // Restart practice trials
            currentTrial = 0;
            abnormalSelections = 0;
            displayTrial();
            return;
        }
    } else {
        // Only record responses during the main experiment
        responses.push({
            trial: currentTrial + 1,
            choice: choice, // 0 for Option A, 1 for Option B
            responseTime: responseTime,
            optionA: trialData.optionA,
            optionB: trialData.optionB
        });
    }

    currentTrial++;
    displayTrial();
}

// Function to end the experiment and display the results
function endExperiment() {
    document.querySelector('.container').innerHTML = '<h2>Thank you for participating!</h2>';

    // Prepare data for CSV export
    prepareCSVDownload();

    // Optionally, display the results on the page
    let resultsDiv = document.createElement('div');
    resultsDiv.innerHTML = '<h3>Your Choices:</h3>';
    responses.forEach(response => {
        let resText = `Trial ${response.trial}: Chose Option ${response.choice === 0 ? 'A' : 'B'}<br>`;
        resText += `Option A - $${response.optionA.value}, ${response.optionA.probability}% chance in ${response.optionA.delay} week(s)<br>`;
        resText += `Option B - $${response.optionB.value}, ${response.optionB.probability}% chance in ${response.optionB.delay} week(s)<br>`;
        resText += `Response Time: ${response.responseTime} ms<br><br>`;
        resultsDiv.innerHTML += resText;
    });
    document.body.appendChild(resultsDiv);
}

// Function to prepare CSV data and create a download link
function prepareCSVDownload() {
    if (responses.length === 0) {
        return; // No data to export
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "OptionA_Delay,OptionA_Probability,OptionA_Value,OptionB_Delay,OptionB_Probability,OptionB_Value,Choice,ResponseTime(ms)\n";

    responses.forEach(response => {
        let row = [
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

    // Create a link to download the CSV file
    let encodedUri = encodeURI(csvContent);
    let downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", "experiment_data.csv");
    downloadLink.innerHTML = "Download Data as CSV";
    document.body.appendChild(downloadLink);
}

// Start the experiment
displayTrial();
