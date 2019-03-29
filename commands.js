var commands = {
  plant: {
    parameters: ["plant"],
    fn: p => {
      taskUtil.cancel();
      const planted = plotUtil.plant(p);
      if (planted) {
        if (!game.flags.firstPlant) {
          game.flags.firstPlant = true;
          ai.speak('Well done, stuff takes time to grow, and when they are ready, you can harvest them.');
          ai.speak('Some plants need to be replanted, and some will keep producing crops as long as the season does not change.');
          ai.speak('For the time being, you can do something else like clear land to make room for another plot, or try your luck exploring.');
          ai.speak('To clear land, say "clear land", to go exploring, say "go exploring".');
          ai.speak('Please note that while you are away on a task like clearing land or exploring, you cannot harvest. If you harvest or plant stuff, you cancel the current task and lose all progress. Enjoy!');
        }
      }
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

      const seed = plant.id + '_seed';
      const seedPrice = plantUtil.getSeedPrice(plant.id); // packet of seeds is 5x price of the plant, because we expect 10 plants per harvest

      if (amt === 'all' || amt.includes('max')) {
        amt = game.money / seedPrice
      }

      if (amt * seedPrice <= game.money) {
        game.money -= seedPrice * amt;
        invUtil.give(seed, amt);
        ai.speak(`You paid ${amt * seedPrice} bucks for ${amt} ${plant.name} seed${amt > 1 ? 's' : ''}`);
      } else {
        ai.speak(`I'm afraid you cannot afford to buy ${amt} ${plant.name} seed${amt > 1 ? 's' : ''}`);
      }
    }
  },
  status: {
    parameters: [],
    fn: () => {

      ai.speak(`You have ${game.money} buck${game.money > 1 ? 's' : 'aroo'}, ${game.plots.length} plot${game.plots.length > 1 ? 's' : ''}, 
      and ${game.land} unit${game.land > 1 ? 's' : ''} of undeveloped land.`);
      ai.speak(`You have explored ${game.explored} units of distance so far.`);

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
      } else if (e.includes("task")) {
        ai.speak(`Here are some tasks you can do: `);
        Object.keys(tasks).forEach((t) => {
          const task = tasks[t];
          ai.speak(`${task.id} - ${task.describe}`);
        });
      }
    }
  },
  clear: {
    parameters: ["entity"],
    fn: (entity) => {
      if (entity.includes("land")) {
        // clear land
        taskUtil.startTask("clear land");
      }
    }
  },
  look: {
    parameters: ["action", "entity", "property"],
    fn: (action, entity, property) => {
      if (action.includes('up') && property.includes('price')) {
        const pricelist = [];
        if (entity.includes('seed')) {
          // look up seed prices

          Object.keys(game.unlocked).forEach((k) => {
            if (k.includes('_seed')) {
              const plant = plantUtil.getPlant(k.split('_seed')[0]);
              pricelist.push({
                item: `${plant.name} seeds`,
                price: plantUtil.getSeedPrice(plant.id)
              });
            }
          })
        } else if (entity.includes('produce') || entity.includes('product')) {
          // look up produce prices

        }
        if (pricelist.length > 0) {
          pricelist.forEach((p) => {
            ai.speak(`${p.item}: ${p.price} bucks each.`)
          });
        }
      }
    }
  },
  cancel: {
    parameters: ["entity"],
    fn: (entity) => {
      if (entity.includes('task')) {
        const task = tasks[game.currentTask.id];
        if (task) {
          ai.speak(`Midway through ${task.name}, you decided to give up and return to base.`);
        }
        taskUtil.cancel();
      }
    }
  },
  describe: {
    parameters: ["plant"],
    fn: p => {
      const plant = plantUtil.getPlant(p);
      if (plant) {
        const amt = game.inventory[plant.id] || 0;
        const seeds = game.inventory[`${plant.id}_seed`] || 0;
        ai.speak(`${plant.name}: Grows in ${plant.season}. Takes ${plant.time} days to mature. Currently sells for ${plant.price} bucks each. 
        You currently have ${amt} ${amt > 1 ? plant.pl : plant.name}, and ${seeds} ${plant.name} seed${seeds > 1 ? 's' : ''}`);
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
  },
  "explore": {
    id: "explore",
    name: "exploring the area",
    describe: `takes 5 minutes, each time you explore a little further than before, and there is the chance of finding something new, or getting knocked out, so be careful...`,
    time: 5,
    complete: () => {
      const lootTable = [
        {
          minDist: 0,
          maxDist: 1000,
          size: 50,
          fn: () => {
            game.explored += 5;
            ai.speak('You came back empty handed. Oh well.');
          }
        },
        {
          minDist: 0,
          maxDist: 30,
          size: 5,
          fn: () => {
            game.explored += 5;
            game.money += 20;
            ai.speak('You found 20 bucks exploring! Go you!')
          }
        },
        {
          minDist: 30,
          maxDist: 1000,
          size: 1,
          fn: () => {
            game.explored += 5;
            invUtil.give('potato_seed', 1);
            ai.speak('You found a packet of potato seeds while exploring!');
          }
        },
        {
          minDist: 40,
          maxDist: 1000,
          size: 1,
          fn: () => {
            game.explored += 5;
            invUtil.give('garlic_seed', 1);
            ai.speak('You found a packet of garlic seeds while exploring!');
          }
        }
      ];

      const avail = lootTable.filter((l) => {
        if (l.minDist && game.explored < l.minDist) {
          return false;
        }
        if (l.maxDist && game.explored > l.maxDist) {
          return false;
        }

        return true;
      });

      const tot = avail.reduce((tot, l) => {
        return tot + l.size;
      }, 0);

      const rand = Math.random() * tot;

      let ind = 0;
      let over = false;
      let agg = 0;
      while (ind <= avail.length && !over) {
        agg += avail[ind].size;
        if (agg > rand) {
          over = true;
        } else {
          ind++;
        }
      }

      avail[ind].fn();

    }
  }
}

const taskUtil = {
  process: () => {
    if (game.currentTask) {
      // is the current task done?
      if (game.currentTask.finish <= Date.now()) {
        tasks[game.currentTask.id].complete();
        delete game.currentTask;
      }
    }

    setTimeout(() => {
      taskUtil.process();
    }, 100);
  },
  startTask: (id) => {
    taskUtil.cancel();
    game.currentTask = {
      id: id,
      started: Date.now(),
      finish: tasks[id].time * 1000 * 60 + Date.now()
    };

    ai.speak(`Work work work. You are now ${tasks[id].name}, you will be done ${moment(game.currentTask.finish).fromNow()}. You may cancel this task by saying "cancel task" or issue a new task.`);

  },
  cancel: () => {
    delete game.currentTask;
  }
}
