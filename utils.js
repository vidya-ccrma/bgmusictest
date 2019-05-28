var aud = new Audio('sounds/classical1.mp3');
var trials = JSON.parse(myTrials);
var trial = trials[4].trial;
var music = trials[4].music;
var maxSections = 4;
var resultsLog = {};

var sections = new Array();
/* Each section has a list of items and a music (or no music)
Each item contains an image, list of options and the correct option */
loadSection(0,welcome);
loadSection(5,thankyou);

function setup() {
  for (i= 0; i < maxSections; i++) {
    loadSection(i+1, window[trial[i]])
  }
}

function openFullscreen() {
  var elem = document.getElementById("fulltext");
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

// Exit fullscreen - Doesn't work!
function exitFullScreen(){
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
}

function logResults(key, value) {
  if (resultsLog[key] === undefined) {
    resultsLog[key] = [value];
  } else {
    var valList = resultsLog[key];
    valList.push(value);
    resultsLog[key] = valList;
  }

  //console.log(key);
  //console.log(value);
}

var currSectionIdx = 0;
var currentSection = {};
var maxSlides = 0;
var randomized = [1,2,3,4];
shuffleArray(randomized);
logResults("SectionOrder", randomized);
setCurrentSection();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadSection(i, sectionName) {
  var mydata = JSON.parse(sectionName);
  sections[i] = {};
  sections[i].items = mydata[0].items;
  sections[i].music = music[i-1];
  logResults("sections", sections[i]);
}

function setCurrentSection() {
  var sectionIdx;
  if (currSectionIdx != 0 && currSectionIdx != 5) {
    sectionIdx = randomized[currSectionIdx-1];
  } else {
    sectionIdx = currSectionIdx;
  }

  currentSection = sections[sectionIdx];
  maxSlides = currentSection.items.length;
  slideIndex = 1;
  var section = {};
  section.currSectionIdx = currSectionIdx;
  section.trial = trial[sectionIdx-1];
  section.currentSection = currentSection;
  logResults("section", section);
}

var timer;
var timeTaken = 0;
function myCounter() {
  timeTaken++;
}


function sendToServer(data) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://web.stanford.edu/~rvidya/cgi-bin/test.py', true);
  xhr.onload = function () {
      // do something to response
      console.log(this.responseText);
      alert("Data sent successfully");
  };
  xhr.onerror = function () {
    console.log("** An error occurred during data transfer");
  };
  console.log(data);
  xhr.send(data);
}

function start(n) {
  if (n == 1) {
    currSectionIdx = 0;
    setCurrentSection();
    showSection(currentSection);
    openFullscreen();
  } else { // End the test.
    aud.pause();
    var groupId = document.getElementById("group");
    groupId.style.display = "none";
    exitFullScreen();
    currSectionIdx = 0;
    setCurrentSection();
    showSection(currentSection);
    resultsLog['filename'] = Date.now().toString();
    var results = JSON.stringify(resultsLog);
    sendToServer(results);
  }
  toggle("play");
  toggle("pause")
  toggle("controls")
}
  
function toggle(id) {
  //alert(id);

  var playBtn = document.getElementById(id);
  //alert(playBtn.style.display);
  if (playBtn.style.display == "block"){
      playBtn.style.display = "none";
  } else {
    playBtn.style.display = "block";
  }
}

function addAnswer(n, opt) {
  clearInterval(timer);
  var correct = currentSection.items[slideIndex-1].correct;
  var options = currentSection.items[slideIndex-1].options;
  if (correct == "group") {
    //alert("You are in group " + (opt+1));
    var groupId = document.getElementById("group");
    groupId.innerHTML = "Group " + (opt + 1);
    groupId.style.display = "block"
    trial = trials[opt].trial;
    music = trials[opt].music;
    setup();
  }

  // TODO(vidya): Accumulate answers and save to localStorage.
  result = {};
  result.question = slideIndex;
  result.options = options;
  result.expected = correct;
  result.answer = opt;
  result.correct = (correct == opt);
  result.timeTaken = timeTaken/100.0;
  timeTaken = 0;
  logResults("result", result);
  slideIndex += n;
  if (slideIndex > maxSlides) {
      currSectionIdx++;
      setCurrentSection();
      showSection(currentSection);
  } else {
    showSection(currentSection);
  }

}


function addControls(options) {
  var buttonHTML = '<button class="w3-button w3-black"';
  var innerHTML = '';
  var controlsDiv = document.getElementById('controls');
  for (i = 0; i < options.length; i++) {
    innerHTML += buttonHTML + 'onclick="addAnswer(1,' + i + ')">' + options[i] + '</button>';
  }
  controlsDiv.innerHTML = innerHTML;
}

function showSection(section) {
  var x = document.getElementById("myslide");

  var filename = section.items[slideIndex-1]['image'];
  //alert(filename);
  x.src =filename; 
  addControls(section.items[slideIndex-1]['options']);

  if (slideIndex == 1) { 
    // Beginning of section. start music if any.
    if (currentSection.music !== '' && currentSection.music !== undefined) {
      aud.src = currentSection.music;
      aud.play();
    } else {
      aud.pause();
    }
  }
  if (slideIndex == maxSlides) {
    // end of section stop audio
    aud.pause();
  }
  timeTaken = 0;
  timer = setInterval(myCounter, 10);
}
