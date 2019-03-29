
const ai = {
    currentPrompt: null,
    promptReminder: null,
    numReminders: 0,
    speechQueue: [],
    interruptSpeaking: () => {
      if (synth.speaking) {
        synth.cancel();
        setTimeout(() => {
          speak(`Okie dokie, I'll be quiet now`);
        }, 100);
      } else {
        speak(`But I wasn't saying anything!`);
      }
    },
    speak: text => {
      if (synth.speaking) {
        ai.speechQueue.push(text);
      } else {
        if (text !== "") {
          var utterThis = new SpeechSynthesisUtterance(text);
  
          utterThis.onend = function(event) {
            console.log("SpeechSynthesisUtterance.onend");
          };
          utterThis.onerror = function(event) {
            console.error("SpeechSynthesisUtterance.onerror");
          };
  
          synth.speak(utterThis);
          bubble.textContent = text;
        } else {
          if (onFinish) {
            onFinish();
          }
        }
      }
    },
    prompt: text => {
      ai.currentPrompt = text;
      if (synth.speaking) {
        synth.cancel();
        setTimeout(() => {
          ai.prompt(text);
        }, 100);
      } else {
        ai.speak(text);
        ai.promptReminder =
          Date.now() + Math.round(10 * 1000 * Math.pow(1.25, ai.numReminders));
      }
    },
    answerPrompt: text => {},
    remindPrompt: () => {
      if (ai.currentPrompt) {
        ai.speak(
          `I haven't heard your answer in a while so let me ask again. ${
            ai.currentPrompt
          }`
        );
      }
    },
    process: () => {
      if (!synth.speaking) {
        if (ai.currentPrompt && ai.promptReminder < Date.now()) {
          ai.remindPrompt();
        } else {
          if (ai.speechQueue.length > 0) {
            const text = ai.speechQueue.shift();
            ai.speak(text);
          }
        }
      }
      setTimeout(() => {
        ai.process();
      }, 100);
    }
  };