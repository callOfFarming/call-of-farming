const quantities = {
  1: {
    name: "1",
    pl: "1",
    similar: ["one", "won", "un"]
  },
  2: {
    name: "2",
    pl: "2",
    similar: ["to", "two", "too"]
  },
  3: {
    name: "3",
    pl: "3",
    similar: ["three", "sree", "sri", "free"]
  },
  4: {
    name: "4",
    pl: "4",
    similar: ["fore", "for", "four"]
  },
  5: {
    name: "5",
    pl: "5",
    similar: ["five", "fave", "fry", "fries"]
  },
  6: {
    name: "6",
    pl: "6",
    similar: ["six", "sex", "sick", "sicks", "sic", "sics"]
  },
  7: {
    name: "7",
    pl: "7",
    similar: ["seven", "sven", "s"]
  },
  8: {
    name: "8",
    pl: "8",
    similar: ["ate", "eat", "hate", "late", "eight"]
  },
  9: {
    name: "9",
    pl: "9",
    similar: ["nine", "mine", "nein", "dine"]
  },
  10: {
    name: "10",
    pl: "10",
    similar: ["then", "en", "den", "ben"]
  },
  11: {
    name: "11",
    pl: "11",
    similar: ["eleven", "leven", "living"]
  },
  12: {
    name: "12",
    pl: "12",
    similar: ["twelve", "12th"]
  },
  13: {
    name: "13",
    pl: "13",
    similar: ["thirteen", "thirteenth", "13th"]
  },
  14: {
    name: "14",
    pl: "14",
    similar: ["fourteen", "fourteenth", "14th"]
  }
};

const characters = {
  morgan: {
    name: "morgan",
    similar: ["borgen", "morgen", "organ", "oregon"]
  }
};

const greetings = {
  hello: {
    name: "hello",
    similar: ["cello", "halo"]
  },
  hi: {
    name: "hi",
    similar: ["hi"]
  }
};

const tools = {
  plot: {
    name: "plot",
    similar: ["spot", "pot", "lot", "pots", "spots", "lots", "plots"]
  },
  seed: {
    name: "seed",
    similar: ["seeds", "sea", "seas", "seats", "seat"]
  },
  price: {
    name: "price",
    similar: ["prices", "pies", "plies", "pry", "pries"]
  }
};

const misc = {};
["go", "explore", "exploring", "what", "can", "task", "date", "stop", "produce"].forEach(
  w => {
    misc[w] = {
      name: w,
      similar: []
    };
  }
);
