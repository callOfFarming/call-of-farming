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
    }
  };