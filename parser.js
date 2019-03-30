const parser = {
  plant: token => {
    const plant = plantUtil.getPlant(token);
    return plant;
  },
  number: token => {
    let parsed = Number.parseInt(token, 10);
    if (isNaN(parsed)) {
      // check numbers to see if it matches any of the alternates
      const num = parser.checkAlts(quantities, token);
      if (num) {
        return Number.parseInt(num, 10);
      } else {
        return null;
      }
    } else {
      return parsed;
    }
  },
  action: token => {
    if (commands[token]) {
      return token;
    } else {
      const act = parser.checkAlts(commands, token);
      if (act) {
        return act;
      } else {
        return null;
      }
    }
  },
  greeting: token => {
    if (greetings[token]) {
      return token;
    } else {
      const greet = parser.checkAlts(greetings, token);
      return greet || null;
    }
  },
  character: token => {
    if (characters[token]) {
      return token;
    } else {
      const x = parser.checkAlts(characters, token);
      return x || null;
    }
  },
  tool: token => {
    if (tools[token]) {
      return token;
    } else {
      const x = parser.checkAlts(tools, token);
      return x || null;
    }
  },
  misc: token => {
    if (misc[token]) {
        return token;
      } else {
        const x = parser.checkAlts(misc, token);
        return x || null;
      }
  },
  checkAlts: (dict, token) => {
    return Object.keys(dict).find(k => {
      const v = dict[k];
      return v.similar.includes(token);
    });
  },
  interpret: (transcript, confidence) => {
    let count = 0;
    let arr = [];
    let t = transcript.trim().toLowerCase();
    t = t.replace(/\'/g, "");
    const parts = t.split(" ");
    parts.forEach(p => {
      if (parser.plant(p)) {
        arr.push(parser.plant(p).name);
        count++;
      } else if (parser.number(p) !== null) {
        arr.push(parser.number(p));
        count++;
      } else if (parser.action(p) !== null) {
        arr.push(parser.action(p));
        count++;
      } else if (parser.tool(p) !== null) {
        arr.push(parser.tool(p));
        count++;
      } else if (parser.greeting(p) !== null) {
        arr.push(parser.greeting(p));
        count += 0.6;
      } else if (parser.character(p) !== null) {
        arr.push(parser.character(p));
        count += 0.8;
      } else if(parser.misc(p) !== null){
          arr.push(parser.misc(p));
          count += 0.2;
      } else {
        arr.push(p);
        count -= 0.2;
      }
    });

    return {
      original: t,
      transcript: arr.join(" "),
      matched: count + confidence
    };
  }
};
