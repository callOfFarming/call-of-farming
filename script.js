
var colors = {
  red: 1,
  green: 1,
  blue: 1
};

var game = {
  timeStarted: null,
  plots: [],
  money: 0,
  inventory: {},
  currentTask: null,
  land: 0,
  explored: 0,
  unlocked: {},
  flags: {}
};


var cheatcode = "up up down down left right left right b a".split(" ");
var cheatstate = 0;
var keycodes = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  b: 66,
  a: 65
};
function cost(color) {
  var amt = Math.round(5 * Math.pow(1.12, colors[color]));

  return amt;
}

var diagnostic = document.querySelector(".output");
var bg = document.querySelector("html");
var hints = document.querySelector(".hints");
var bubble = document.getElementById("speech-bubble");
var localeSelector = document.getElementById("locale");

localeSelector.addEventListener("change", () => {
  if (recognition) {
    recognition.lang = localeSelector.value;
    console.log('Set locale to', localeSelector.value);
  }
});

/*******Speech Synthesis***********/

var synth = window.speechSynthesis;

document.addEventListener("keydown", event => {
  console.log(event.keyCode);
  const expectedCode = keycodes[cheatcode[cheatstate]];
  if (expectedCode && event.keyCode && expectedCode === event.keyCode) {
    cheatstate++;
    if (cheatstate === cheatcode.length) {
      enableCheat();
    }
  } else {
    cheatstate = 0;
  }
});

/****Init/Config************/

// title screen
var titleScreen = document.getElementById("title-screen");
var startButton = document.getElementById("start");
var continueButton = document.getElementById("continue");
if (localStorage.getItem("save")) {
  continueButton.style.display = "block";
}

startButton.addEventListener("click", () => {
  start();
});
continueButton.addEventListener("click", () => {
  start(true);
});


/****State checking*********/

function canAffordPrestige() {
  return (
    opacity <= 10 &&
    Object.keys(ink).every(c => {
      return ink[c] >= 2550;
    })
  );
}

/****Helpful utils */

function toList(arr) {
  if (arr.length === 0) {
    return "";
  } else if (arr.length === 1) {
    return arr[0];
  } else {
    const last = arr.pop();
    return arr.join(", ") + " and " + last;
  }
}

function itemize(things) {
  return Object.keys(things).map(k => {
    if (k.includes("_seed")) {
      // it's a seed
      const p = k.split("_seed")[0];
      return `${things[k]} ${p} seed${things[k] === 1 ? "" : "s"}`;
    } else if (plants[k]) {
      return `${things[k]} ${things[k] === 1 ? plants[k].name : plants[k].pl}`;
    }
  });
}

/****Rendering**********/

function update() {
  setTimeout(update, 0.5);
}

function listen() {
  if (recognition) {
    recognition.start();
    diagnostic.textContent = "listening";
  }
}

function enableCheat() {
  ai.speak("Well done you figured out the contra code.");
}

function explainHelp() {
  ai.speak(`Ok newbie.`);
  const text = document.getElementById("commands").textContent;
  console.log(text);
  ai.speak(`@Look below@${text}`);
  ai.speak(`Any other dumb questions?`);
}

function checkBigCommands(text) {
  // cheatcode
  if (text === cheatcode.join(" ")) {
    enableCheat();
    return true;
  } else if (bigCommands[text]) {
    bigCommands[text]();
    return true;
  }

  return false;
}

function process(text) {
  text = text.toLowerCase();
  text = text.trim();
  console.log("Processing text: ", text);
  if (checkBigCommands(text)) {
    return;
  }

  const parts = text.split(" ");
  let i = 0;
  let command;
  let parameters = [];
  while (i <= parts.length) {
    const cur = parts[i];

    if (!command && commands[cur]) {
      command = commands[cur];
    } else {
      if (command) {
        // must be a parameter
        parameters.push(cur);
      } else {
        // not a command, there is no command recognized, must be rubbish
      }
    }

    i++;
  }

  if (command) {
    let i = 0;
    let j = 0;
    const params = [];
    // while (i <= parameters.length && j < command.parameters.length) {
    //   const expected = command.parameters[j];
    //   const token = parameters[i];
    //   const parsed = parseToken(token, expected);

    //   if (parsed) {
    //     params.push(parsed);
    //     j++;
    //   }
    //   i++;
    // }
    // if (command.parameters.length === params.length) {
    //   command.fn.apply(this, parameters);
    // }

    command.fn.apply(this, parameters);
    command = null;
    parameters = [];
  }
}

function setupSynth() {
  const vlist = synth.getVoices();
  let preferred;
  preferredVoices.forEach(pref => {
    if (!preferred) {
      const v = vlist.find(p => p.name.toLowerCase().includes(pref));
      if (v) {
        preferred = v;
      }
    }
  });

  if (preferred) {
    ai.preferredVoice = preferred;
    console.log("Using preferred voice:", ai.preferredVoice);
  }
}

function start(load) {
  setupSynth();
  titleScreen.style.display = "none";
  // check localstorage
  if (load && localStorage.getItem("save")) {
    game = JSON.parse(localStorage.getItem("save"));

    game.plots.forEach((p, i)=> {
      p.index = i+1;
    });

  } else {
    ai.speak("Howdy! Welcome to Call of Farming!");
    ai.speak(
      "You are stranded in a weird magical land with a dilapidated house and an indestructible friendly android named Morgan. I am Morgan."
    );
    ai.speak(
      `To help you along, I have given you a pack of potato seeds and a single plot of land. To plant the seeds, say "plant potatoes"`
    );
    game.timeStarted = Date.now();
    invUtil.give("potato_seed", 1);

    plotUtil.addPlot();
  }

  listen();
  ai.process();
  plotUtil.process();
  taskUtil.process();
}

function save() {
  localStorage.setItem("save", JSON.stringify(game));
}
update();
