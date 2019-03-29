var SpeechRecognition = SpeechRecognition || window["webkitSpeechRecognition"];
var SpeechGrammarList = SpeechGrammarList || window["webkitSpeechGrammarList"];
var SpeechRecognitionEvent =
  SpeechRecognitionEvent || window["webkitSpeechRecognitionEvent"];

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

var plantUtil = {
  getPlant: p => {
    let plant = plants[p];
    // try plural
    if (!plant) {
      const _p = Object.keys(plants).find(k => {
        const _plant = plants[k];
        if (_plant.pl.toLowerCase() === p) {
          return true;
        }
      });
      if (_p) {
        plant = plants[_p];
      }
    }

    return plant;
  },
  getSeedPrice: p => {
    let plant = plantUtil.getPlant(p);
    if (!plant) {
      return 0;
    } else {
      return plant.price * 5;
    }
  }
};

var invUtil = {
  give: (thing, amt) => {
    if (!game.inventory[thing]) {
      game.inventory[thing] = 0;
    }

    game.inventory[thing] += amt;
  },
  pay: (thing, amt) => {
    if (!game.inventory[thing] || game.inventory[thing] < amt) {
      return false;
    } else {
      game.inventory[thing] -= amt;
      return true;
    }
  },
  listSeeds: () => {
    const ret = {};
    Object.keys(game.inventory).forEach(k => {
      if (game.inventory[k] > 0 && k.includes("_seed")) {
        ret[k] = game.inventory[k];
      }
    });
    return ret;
  },
  listPlants: () => {
    const ret = {};
    Object.keys(game.inventory).forEach(k => {
      if (game.inventory[k] > 0 && plants[k]) {
        ret[k] = game.inventory[k];
      }
    });
    return ret;
  },
  sell: (p, amt) => {
    const plant = plantUtil.getPlant(p);
    if (!plant) {
      return false;
    }

    if (invUtil.pay(plant.id, amt)) {
      const money = plant.price * amt;
      game.money += money;
      return money;
    } else {
      return false;
    }
  }
};

var plotUtil = {
  buyPlot: () => {
    const land = 20;
    const cost = Math.round(200 * Math.pow(1.2, game.plots.length - 1));

    if (game.money >= cost && game.land >= land) {
      game.money -= cost;
      game.land -= land;
      plotUtil.addPlot();
    }
  },
  addPlot: () => {
    game.plots.push({
      planted: null,
      timePlanted: null,
      ready: false,
      sprinkler: 0,
      fertilizer: 0
    });
  },
  available: () => {
    return game.plots.filter(p => {
      return p.planted === null;
    });
  },
  currentlyPlanted: () => {
    const plants = {};
    game.plots.forEach(p => {
      if (p.planted && !plants[p.planted]) {
        plants[p.planted] = 1;
      }
    });
    return Object.keys(plants);
  },
  plant: p => {
    const plant = plantUtil.getPlant(p);
    const available = plotUtil.available();
    if (!plant) {
      ai.speak(
        `Sorry, I'm not sure what ${p} is, please plant something *real*`
      );
      return;
    }
    if (available.length > 0) {
      const plot = available[0];
      if (invUtil.pay(`${plant.id}_seed`, 1)) {
        plot.planted = plant.id;
        plot.timePlanted = Date.now();
        plot.finish = Date.now() + Math.round(plant.time * 1000 * 60 * (Math.pow(0.95, plot.sprinkler)))
        ai.speak(
          `${plant.pl} planted, they will be ready in ${plant.time} minutes`
        );
        return true;
      } else {
        ai.speak(`Sorry, you don't have any ${plant.name} seeds`);
      }
    } else {
      ai.speak(`Sorry, you don't have any free plots`);
    }
  },
  timeLeft: plot => {
    if (plot.timePlanted && plot.planted) {
      const matureTime = plotUtil.timeToMature(plot);
      const delta = matureTime - Date.now();
      return delta;
    }
  },
  timeToMature: plot => {
    if (plot.timePlanted && plot.planted) {
      const plant = plantUtil.getPlant(plot.planted);
      const matureTime = plot.timePlanted + plant.time * 1000 * 60;
      return matureTime;
    }
    return 0;
  },
  harvest: plot => {
    if (!plot) {
      // harvest anything available
      game.plots.forEach(p => {
        if (p.timePlanted && p.planted) {
          plotUtil.harvest(p);
        }
      });
    } else {
      if (plotUtil.finish <= Date.now()) {
        let amt = 10 + plotUtil.fertilizer; // base

        invUtil.give(plot.planted, amt);

        const hvt = {};
        hvt[plot.planted] = amt;
        plot.ready = false;
        plot.planted = null;
        plot.timePlanted = null;
        plot.finish = null;
        return hvt;
      }
      return null;
    }
  },
  reportSeeds: () => {
    const seeds = Object.keys(game.inventory)
      .filter(s => {
        return s.includes("_seed") && game.inventory[s] > 0;
      })
      .map(s => {
        return {
          plant: s.split("_seed")[0],
          amt: game.inventory[s]
        };
      });
    return seeds;
  },
  process: () => {
    const matured = {};
    game.plots.forEach(p => {
      if (p.planted && p.timePlanted && !p.ready) {
        if (plotUtil.timeLeft(p) <= 0) {
          p.ready = true;
          matured[p.planted] = true;
        }
      }
    });

    if (Object.keys(matured).length > 0) {
      const arr = Object.keys(matured).map(p => {
        return plantUtil.getPlant(p).pl;
      });

      ai.speak(`The ` + toList(arr) + ` are ready for harvesting!`);
    }

    setTimeout(() => {
      plotUtil.process();
    }, 100);
  }
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

var needUpdate = {
  bg: true,
  inkLevels: true
};

var entities = ['seed', 'produce', 'plant', 'plot', 'sprinkler', 'fertilizer', 'morgan', 'sell', 'buy', 'multiple'];


var grammar =
  "#JSGF V1.0; grammar codewords; public <codewords> = " +
  [
    ...Object.keys(colors),
    ...Object.keys(commands),
    ...Object.keys(bigCommands),
    ...entities,
    ...entities.map(e => `${e}s`)
  ].join(" | ") +
  " ;";

var diagnostic = document.querySelector(".output");
var bg = document.querySelector("html");
var hints = document.querySelector(".hints");
var bubble = document.getElementById("speech-bubble");

var ink = {
  red: 0,
  green: 0,
  blue: 0
};
var opacity = 1;
var canPrestige = false;
var maxInk = 2550;

/*******Speech Recognition*********/
if (SpeechRecognition) {
  var recognition = new SpeechRecognition();
  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = event => {
    var last = event.results.length - 1;
    var text = event.results[last][0].transcript;

    diagnostic.textContent = "Command: " + text;
    console.log("Confidence: " + event.results[0][0].confidence);
    process(text);
  };

  recognition.onspeechend = function () {
    setTimeout(() => {
      listen();
    }, 1000);
    diagnostic.textContent = "...";
  };

  recognition.onnomatch = function (event) {
    diagnostic.textContent = "Unrecognized text";
    setTimeout(() => {
      listen();
    }, 1000);
  };

  recognition.onerror = function (event) {
    if (event.error !== "not-allowed") {
      setTimeout(() => {
        listen();
      }, 1000);
    } else {
      diagnostic.textContent = "Error occurred in recognition: " + event.error;
    }
  };
} else {
  diagnostic.textContent =
    "Speech Recognition not detected. You will have to use Google Chrome on Desktop or Android, and you will have to allow the page to use your microphone.";

  document.getElementById("testing").style.display = "block";
}

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
if (localStorage.getItem("save")) {
  startButton.textContent = "Continue";
}

startButton.addEventListener("click", () => {
  start();
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
  speak("Cheat enabled");
  document.getElementById("testing").style.display = "block";
}

function toggleBlindMode(on) {
  if (on) {
    speak("blind mode is now on");
    document.getElementById("inkWell").style.display = "none";
  } else {
    speak("blind mode is off");
    document.getElementById("inkWell").style.display = "none";
  }
}

function explainHelp() {
  const text = document.getElementById("commands").textContent;
  console.log(text);
  speak(text);
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

    if (command && parameters.length === command.parameters.length) {
      command.fn.apply(this, parameters);
      command = null;
      parameters = [];
    }

    i++;
  }
}

function setupSynth() {

  const vlist = synth.getVoices();
  let preferred;
  preferredVoices.forEach((pref) => {
    if (!preferred) {
      const v = vlist.find(p => p.name.toLowerCase().includes(pref));
      if (v) {
        preferred = v;
      }
    }
  });

  if (preferred) {
    ai.preferredVoice = preferred;
    console.log('Using preferred voice:', ai.preferredVoice);
  }
}

function start() {

  setupSynth();
  titleScreen.style.display = "none";
  // check localstorage
  if (localStorage.getItem("save")) {
    game = JSON.parse(localStorage.getItem("save"));
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
    game.unlocked["potato"] = true;
    game.unlocked["potato_seed"] = true;
    plotUtil.addPlot();
  }

  ai.process();
  plotUtil.process();
  taskUtil.process();
}

function save() {
  localStorage.setItem("save", JSON.stringify(game));
}
listen();
update();
