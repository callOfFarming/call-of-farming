
var ai = {
    currentPrompt: null,
    promptReminder: null,
    numReminders: 0,
    speechQueue: [],
    interruptSpeaking: () => {
        if (synth.speaking) {
            synth.cancel();
            synth.speechQueue = [];
            setTimeout(() => {
                ai.speak(`Okie dokie, I'll be quiet now`);
            }, 500);
        } else {
            ai.speak(`But I wasn't saying anything!`);
        }
    },
    speak: (text) => {
        const parts = text.split('@');
        let override = false;
        if (parts.length === 3) {
            // there is override
            override = true;
            bubble.textContent = parts[1];
            text = parts[3]
        }

        if (synth.speaking) {
            ai.speechQueue.push(text);
        } else {
            if (text !== "") {
                var utterThis = new SpeechSynthesisUtterance(text);
                if (ai.preferredVoice) {
                    utterThis.voice = ai.preferredVoice;
                }
                utterThis.onend = function (event) {
                    console.log("finished speaking sentence");
                };
                utterThis.onerror = function (event) {
                    console.error("speech synth error", event);
                };

                synth.speak(utterThis);
                if (!override) {
                    bubble.textContent = text;
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
    answerPrompt: text => { },
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

var preferredVoices = [
    'microsoft zira',
    'google uk english female'
]