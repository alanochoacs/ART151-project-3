// press the screen to take a picture, then an instruction will be given based on the picture
// scan different outside objects and buildings around campus
// disclaimer: there is nothing to scan inside buildings

// image model variables
let classifier;
let video;
let resultsP;
let currentLabel;
let currentConfidence;
let modelURL = 'https://teachablemachine.withgoogle.com/models/LlNbmUHy9/';

// sound model variables
const options = { probabilityThreshold: 0.7 };
let soundLabel;
let soundConfidence;
let soundClassifier;
let currentSoundLabel;

let timer = 600;
let countdown = 0;
let instructionMode = false;
let scanningMode = true;
let scannedLabel;
let scannedConfidence;
let instruction = '';
let rand;
let randomInstruction;
let errorInstruction;
let randInstruction = ['Take your next left.', 'Take your next right.', 'Walk up to a trash/recycle bin.', 'Walk towards the furthest bench in sight.', 'Go in the direction of the largest building.', 'Go in the direction of the tallest building.', 'If there is a tree, turn left.', 'If there is a tree, turn right.', 'Start heading north, but stay in campus bounds.', 'Start heading south, but stay in campus bounds.', 'Start heading east, but stay in campus bounds.', 'Start heading west, but stay in campus bounds.'];
let button;
let buttonLabel = 'Capture';

const confidenceThreshold = 0.90;

let soundEffect;

function preload() {
  soundEffect = loadSound("button_press.mp3");
}

function setup() {
  frameRate(30);
  createCanvas(windowWidth, windowHeight);
  
  // allows for phones to use outer camera
  var constraints = {
    audio: false,
    video: {
      facingMode: {
        exact: "environment"
      }
    }    
    //video: {
      //facingMode: "user"
    //} 
  };
  
  video = createCapture(constraints);
  video.size(width,height);
  classifier = ml5.imageClassifier(modelURL, video, modelReady);
  video.hide();
  
  // using SpeechCommands18w since I could not figure out how to upload my own audio to teachable machine
  // recording with a microphone did not produce good audio and uploading a .zip audio file requires it to be from teachable machine
  soundClassifier = ml5.soundClassifier('SpeechCommands18w', options);
}

function modelReady() {
  console.log("Model Ready");
  classifyVideo();
}

function classifyVideo(){
  classifier.classify(gotResult);
}

function gotResult(err, results){
  if (err) {
    console.error(err);
    return;
  }
  if (results && results.length > 0) {
    const label = results[0].label;
    const confidence = results[0].confidence;

    
    // Check if the confidence exceeds the threshold before acting on the label
    if (confidence >= confidenceThreshold) {
      currentLabel = label;
      currentConfidence = confidence;
    } else {
      // Optionally, handle cases where confidence is below the threshold
      currentLabel = 'Unknown';
      currentConfidence = confidence;
    }
  }
  classifyVideo(); // Continue classifying the next video frame
}

function gotSoundResult(error, results) {
  if (error) {
    console.error(error);
  }
  
  soundLabel = results[0].label;
  soundConfidence = results[0].confidence;
}

function draw() {
  background(0);
  
  button = createButton(buttonLabel);  
  button.position(width/2-50, height-77);
  button.size(100, 50);
  // button.mousePressed(checkForInstruction);
  
  classifier.classify(gotSoundResult);
  
  // common words as modifiers to walking around looking for what to scan
  if (soundLabel == 'go') {
    instruction = 'Start walking faster.';
    countdown = 5;
  } else if (soundLabel == 'left') {
    instruction = 'Now take your nearest right';
    countdown = 5;
  } else if (soundLabel == 'right') {
    instruction = 'Now take your nearest left';
    countdown = 5;
  } else if (soundLabel == 'stop') {
    instruction = 'Stop and stand out of the way for 30 seconds.';
    countdown = 30;
  } else if (countdown <= 0) {
    instruction = ''; // sets string to nothing to remove instruction from screen
  }
  
  // two modes for when taking pictures and when looking at instructions
  if (scanningMode) {
    // displays video
    image(video, 0, 0, width, height);
    buttonLabel = 'Capture';
    
    // displays instructions from audio
    text(instruction, 50, 30, width-100, height-30); 
  }
  if (instructionMode) {
    buttonLabel = 'Next';
    console.log(scannedLabel);
    console.log(scannedConfidence);
    
    // source for years buildings were constructed:
    // https://fimweb.fim.uic.edu/BuildingsData.aspx
    // logic to check for items/places/sounds
    textSize(20);
    if (scannedLabel == 'bench') {
      instruction = 'Sit at the nearest bench for 1 minute and watch the people go by. ';
      if (countdown == -1) countdown = 60;
    } else if (scannedLabel == 'trash_bin' || scannedLabel == 'vacuum, vacuum cleaner') {
      if (rand == 0) {
        instruction = 'Stand next to the nearest trash/recycle bins for 1 minute and ask why they are there. Why are these trash/recycle bins here? Is there a tactical reason for their placement? Now, go LEFT until you hit an obstacle.';
      } else {
        instruction = 'Stand next to the nearest trash/recycle bins for 1 minute and ask why they are there. Surely, we don\'t need this many trash/recycle bins. How often is the trash/recycle take out? Now, go RIGHT until you hit an obstacle.';
      }
      if (countdown == -1) countdown = 60;
    } else if (scannedLabel == 'safety_button') { // the blue pole things that I don't know what they are called
      if (rand == 0) {
        instruction = 'If your ever in danger, press the button on the these blue poles and it connect you will the authorities. Now, go LEFT until you hit an obstacle.';
      } else {
        instruction = 'If your ever in danger, press the button on the these blue poles and it will call for help. Now, go RIGHT until you hit an obstacle.';
      }
    } else if (scannedLabel == 'building_sign') {
      if (rand == 0) {
        instruction = 'Enter the nearest building and get lost for 2.5 minutes, then exit.';
        if (countdown == -1) countdown = 150;
      } else {
        instruction = 'Sit or stand near the building and watch the people entering and exiting the building for 1 minute.';
      }
      if (countdown == -1) countdown = 60;
    } else if (scannedLabel == 'you_are_here_sign') {
      instruction = 'Close your eyes and randomly point to a location on the map, then start heading in that direction.';
    } else if (scannedLabel == 'arc') { // Academic and Residential Complex
      instruction = 'Did you know that the Academic and Residential Complex (ARC) opened in July 2019? The ARC holds 550 beds, 3 lecture halls, 4 classrooms, many study rooms and collaboration spaces, a tutoring center, and much more. How about exploring it for 2.5 minutes then exit and then go LEFT.';
      if (countdown == -1) countdown = 150;
    } else if (scannedLabel == 'eib') { // Engineering Innovation Building
      instruction = 'Did you know that the Engineering Innovation Building opened in July 2019? It is the first new building on east campus since 1991. How about exploring it for 2.5 minutes then exit and then go RIGHT.';
      if (countdown == -1) countdown = 150;
    } else if (scannedLabel == 'quad') { // Quad
      instruction = 'Sit down somewhere near the Quad, then take 2 minutes to read some histroy of the Quad or chat with some peers. Formally the Circle Forum, the Quad used to have central bleachers that students could sit on and hang out. It also had elevated walkways connecting the second floors of buildings around the Quad. The old Quad, the Corcle Forum, was demolished in a 6 year period from 1993 to 1999. Now head in the direction of one of the FOUR CORNERS of the Quad, OF YOUR CHOOSING.';
      if (countdown == -1) countdown = 120;
    } else if (scannedLabel == 'university_hall') { // University Hall
      instruction = 'This is University Hall, where the adminstration of UIC is located. Univeristy Hall, built in 1965, is 338 feet tall making it the tallest building on east campus. Enter and explore, then after 2.5 minutes leave and go in a DIRECTION OF YOUR CHOICE. Can you get to the top floor? Try if you dare.';
      if (countdown == -1) countdown = 150;
    } else if (scannedLabel == 'sce') { // UIC Student Center East Entrance
      instruction = 'This is the Student Center East built in 1965, the year that east campus was originally built. The building has many useful services for students like: the University Bookstore, meeting and work areas, lots of food options, and more. Enter and explore, then after 2.5 minutes leave and go in a DIRECTION OF YOUR CHOICE.'
      if (countdown == -1) countdown = 150;
    } else if (scannedLabel == 'library') { // UIC Richard J. Daley Library
      instruction = 'This is the main library of the UIC east campus built in 1965. It is named after Richard J. Daley who was the mayor of Chicago from 1955 to 1976. Enter and explore, then after 2.5 minutes leave and go STRAIGHT FORWARD.';
      if (countdown == -1) countdown = 150;
    } else {
      instruction = 'Unknown object, please scan something else or get closer to the object and try again. Try scanning common object outside or notable buildings. When you find one, follow the instructions and/or read a fact about campus. After, you will be given a direction to go in to scan more objects. Remember to stay in east campus.';
      
      // if something that is scanned is not an object display a random mini instruction
      if (errorInstruction == 'placeholder') {
        randomInstruction = round(random(0, randInstruction.length-1));
      }
      errorInstruction = randInstruction[randomInstruction];
      textSize(15);
      text(errorInstruction, 50, width/2, width-100, height-30);
      
      if (countdown == -1) countdown = 3;
    }
    
    // an optional timer is displayed for convenience in keeping track of time
    fill(255);
    textSize(15);
    textWrap(WORD);
    text(countdown + ' Seconds Remaining', 50, 400);
    text(instruction, 50, 30, width-100, height-30);
  }
  
  // for countdown timer
  if (frameCount % 30 == 0 && countdown > 0) {
    countdown--;
  }
  
  // if 10 minutes pass, next instruction will be the final instruction
  if (frameCount % 30 == 0 && timer > 0) {
    timer--;
  }
  
  if (timer == 0) {
    scanningMode = false;
    instructionMode = false;
    
    fill(255);
    textSize(30);
    textWrap(WORD);
    text('Your final instruction is...', 50, 30, width-50, height-30);
    
    buttonLabel = 'to have a nice day.';
  }
}

// function that sets up and switches modes
function checkForInstruction() {
  if (scanningMode == true) {
    instruction = '';
    scanningMode = false;
    instructionMode = true;
    errorInstruction = 'placeholder';
    countdown = -1;
    scannedLabel = currentLabel;
    scannedConfidence = currentConfidence;
  } else if (instructionMode == true) {
    instruction = '';
    rand = round(random(0, 1));
    scanningMode = true;
    instructionMode = false;
  }
}

// if screen is pressed, the mode is switched
function touchStarted() {
  soundEffect.setVolume(0.3);
  soundEffect.play();
  
  checkForInstruction();
}