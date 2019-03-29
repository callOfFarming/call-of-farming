var bigCommands = {
    "blindfold on": () => {
      toggleBlindMode(true);
    },
    "blindfold off": () => {
      toggleBlindMode(false);
    },
    help: () => {
      explainHelp();
    },
    what: () => {
      explainHelp();
    },
    huh: () => {
      explainHelp();
    },
    "thank you": () => {
      speak(`you're welcome`);
    },
    stop: () => {
      interruptSpeaking();
    },
    sorry: () => {
      speak("No problem");
    },
    "what can i plant": ()=> {
        commands.list.fn("seed");
    },
    "what am i doing": () => {
      bigCommands["current task"]();
    },
    "current task": () => {
      if(game.currentTask){
        const task = tasks[game.currentTask.id];
        if(task){
          ai.speak(`You are currently ${task.name}. You will be done ${moment(game.currentTask.finish).fromNow()}`)
        } else {
          ai.speak(`I am not sure what you are doing really`);
        }
      } else {
        ai.speak(`You are not currently doing anything, say "list tasks" to get a list of tasks you can currently do`);
      }
    },
    "current date": ()=> {
      const elapsed = Date.now() - game.timeStarted;
      // 1 minute = 1 day
      const days = Math.ceil(elapsed/1000/60);
      ai.speak(`This is day ${days} since you arrived.`);
    },
    "go exploring": ()=> {
      bigCommands["go explore"]();
    },
    "go explore": ()=> {
      taskUtil.startTask("explore");
    }
  };