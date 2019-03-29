var commands = {
  plant: {
    parameters: ["plant"],
    fn: p => {
      plotUtil.plant(p);
    }
  },
  harvest: {
    parameters: ["entity", "index"],
    fn: (entity, index) => {
      const hvt = {};
      const ind = Number.parseInt(index, 10);
      if (ind >= 0) {
        if (game.plots.length < ind) {
          // plot does not exist
          return;
        } else {
          const plot = game.plots[ind - 1];
          if (!plot.ready) {
            ai.speak(`Plot ${ind} is not ready for harvesting yet.`)
          }
        }
      }
      game.plots
        .filter(p => p.ready)
        .forEach(p => {
          const h = plotUtil.harvest(p);
          if (h) {
            Object.keys(h).forEach(k => {
              if (!hvt[k]) {
                hvt[k] = 0;
              }
              hvt[k] += h[k];
            });
          }
        });
      const plants = Object.keys(hvt);
      if (plants.length === 0) {
        ai.speak(
          "Nothing was harvested because none of the plots were ready for harvesting"
        );
      } else {
        const list = toList(
          plants.map(p => {
            const plant = plantUtil.getPlant(p);
            const amt = hvt[p];
            if (amt > 1) {
              return `${amt} ${plant.pl}`;
            } else {
              return `${amt} ${plant.name}`;
            }
          })
        );
        ai.speak(`Harvested ${list}`);
      }
    }
  },
  sell: {
    parameters: ["amt", "entity"],
    fn: (amt, entity) => {
      const plant = plantUtil.getPlant(entity);
      if (plant) {
        if (amt === 'all' || amt.includes("max")) {
          amt = game.inventory[plant.id] || 0;
        } else {
          amt = Number.parseInt(amt, 10);
        }
        if (amt > 0) {
          const sold = invUtil.sell(entity, amt);
          if (sold) {
            ai.speak(`Sold ${amt} ${amt === 1 ? plant.name : plant.pl} for ${sold} buck${sold === 1 ? 'aroo' : 's'}`)
          } else {
            ai.speak(`Sorry you do not have ${amt} ${plant.pl} to sell`);
          }
        }
      }
    }
  },
  buy: {
    parameters: ["amt", "plant", "entity"],
    fn: (amt, p, entity) => {
      const plant = plantUtil.getPlant(p);
      if (!plant) {
        return;
      }

      const seed = p.id + '_seed';
      const seedPrice = plant.price * 5; // packet of seeds is 5x price of the plant, because we expect 10 plants per harvest

      if (amt === 'all' || amt.includes('max')) {
        amt = game.money / plant.price
      }
    }
  },
  status: {
    parameters: [],
    fn: () => {
      let text = `You currently have ${ink.red} red, ${ink.green} green, ${
        ink.blue
        } blue. You are adding ${colors.red} drops of red, ${
        colors.green
        } drops of green, and ${colors.blue} drops of blue each time you add. `;

      const upgradable = Object.keys(ink).filter(k => {
        return ink[k] >= cost(k);
      });

      if (upgradable.length > 0) {
        text += `You can upgrade ${upgradable.join(", ")}. `;
      }

      if (canPrestige) {
        text += `You may prestige now if you want. Prestige will cost ${maxInk} of each color.`;
      } else {
        text += `You will be able to prestige once you have at least ${maxInk} of each color.`;
      }

      speak(text);
    }
  },
  list: {
    parameters: ["entity"],
    fn: e => {
      if (!e) {
        return;
      }
      if (e.includes("plot")) {
        const numPlots = game.plots.length;
        const numEmpty = game.plots.filter(p => !p.planted).length;
        const numUsed = game.plots.filter(p => p.planted).length;

        let text = `You have ${numPlots} plot${numPlots === 1 ? "" : "s"}.`;
        if (numEmpty > 0) {
          text += ` ${numEmpty} ${numEmpty === 1 ? "is" : "are"} unused.`;
        }
        if (numUsed.length > 0) {
          text += ` ${numUsed} ${numUsed === 1 ? "is" : "are"} in use.`;
          if (numUsed <= 5) {
            commands.list.fn("plants");
          } else {
            text += `If you would like a full list of currently growing plants, please say "list plants"`;
          }
        }
        ai.speak(text);
      } else if (e.includes("plant")) {
        let text = "";
        const numUsed = game.plots.filter(p => p.planted).length;
        if (numUsed === 0) {
          text += `You do not have anything growing at the moment`;
        } else {
          const ready = game.plots.filter(p => p.ready);
          if (ready.length > 0) {
            text += `You have ${ready.length} plot${
              ready.length === 1 ? "" : "s"
              } ready for harvesting.`;
          }

          game.plots.forEach((plot, index) => {
            if (!plot.ready && plot.planted && plot.timePlanted) {
              const plant = plantUtil.getPlant(plot.planted);
              const mature = plotUtil.timeToMature(plot);
              if (mature > Date.now()) {
                text += `plot ${index + 1} is growing ${
                  plant.pl
                  }, they will be ready ${moment(mature).fromNow()}`;
              }
            }
          });
        }

        ai.speak(text);
      } else if (e.includes("seed")) {
        // go through inventory, find seeds
        const seeds = itemize(invUtil.listSeeds());
        const list = toList(seeds);
        if (!list) {
          ai.speak("You have no seeds");
        } else {
          ai.speak(`You have ${list}`);
        }
      } else if (e.includes("produce")) {
        // go through inventory, find produce
        const produce = itemize(invUtil.listPlants());

        const list = toList(produce);
        if (list) {
          ai.speak(`You have ${list}`);
        } else {
          ai.speak("You have no produce");
        }
      } else if(e.includes("task")){
        ai.speak(`Here are some tasks you can do: `);
        Object.keys(tasks).forEach((t)=> {
          ai.speak(``)
        })
      }
    }
  },
  clear: {
    parameters: ["entity"],
    fn: (entity) => {
      if (entity.includes("land")) {
        // clear land
        startTask("clear land");
      }
    }
  }
};

var tasks = {
  "clear land": {
    id: "clear land",
    name: "clearing land",
    describe: `only takes 2 minutes, but will clear up some land so you can construct additional plots`,
    time: 2,
    complete: () => {
      game.land += 5;
      ai.speak(`You cleared 5 units of land, you now have ${game.land} units of land.`);
    }
  }
}

const taskUtil = {
  process: () => {
    if (game.currentTask) {
      // is the current task done?
      if (game.currentTask.finish <= Date.now()) {
        tasks[game.currentTask.id].complete();
        delete game.currentTask.id;
      }
    }

    setTimeout(() => {
      taskUtil.process();
    }, 100);
  },
  startTask: (id) => {
    if (game.currentTask) {
      delete game.currentTask; // clear it
    }

    game.currentTask = {
      id: id,
      started: Date.now(),
      finish: tasks[id].time * 1000 * 60 + Date.now()
    };

  }
}
