function parseToken(token, type) {
  if (type === "plant") {
    const p = Object.keys(plants).find(_p => {
      _p.pl.toLowerCase().includes(token);
    });
    if (p) {
      return plantUtil.getPlant(p);
    }
    return null;
  } else if (type === "entity") {
  }
}
var commands = {
  plant: {
    parameters: ["plant"],
    similar: ["plan", "plane"],
    fn: p => {
      taskUtil.cancel();
      const planted = plotUtil.plant(p);
      if (planted) {
        if (!game.flags.firstPlant) {
          game.flags.firstPlant = true;
          ai.speak(
            "Well done, stuff takes time to grow, and when they are ready, you can harvest them."
          );
          ai.speak(
            "Some plants need to be replanted, and some will keep producing crops as long as the season does not change."
          );
          ai.speak(
            "For the time being, you can do something else like clear land to make room for another plot, or try your luck exploring."
          );
          ai.speak(
            'To clear land, say "clear land", to go exploring, say "go exploring".'
          );
          ai.speak(
            "Please note that while you are away on a task like clearing land or exploring, you cannot harvest. If you harvest or plant stuff, you cancel the current task and lose all progress. Enjoy!"
          );
        }
      }
    }
  },
  harvest: {
    parameters: [],
    similar: ["harvest", "arvest"],
    fn: () => {
      let count = 0;
      game.plots.forEach((plot, index) => {
        if (plot.ready) {
          const plant = plantUtil.getPlant(plot.planted);
          const h = plotUtil.harvest(plot);
          if (h) {
            ai.speak(`Harvested ${toList(itemize(h))} from Plot ${index + 1}.`);
            if (plant.maxHarvest > 1) {
              if(plot.harvests > 0){
                ai.speak(
                  `${plant.pl} will be ready for another harvesting in ${
                    plant.time
                  } minutes`
                );
              } else {
                ai.speak(`${plant.pl} will have to be replanted now since it has reached the end of its growth cycle`);
              }
              
            }
            count++;
          }
        }
      });

      if (count === 0) {
        ai.speak(`None of the plots were ready for harvesting`);
      }
    }
  },
  sell: {
    parameters: ["amt", "entity"],
    similar: ["cel", "sel", "sal", "cell", "spell", "spelt"],
    fn: (amt, entity) => {
      if (amt === "everything" || entity === "everything") {
        // sell everything
        let sold = false;
        Object.keys(game.inventory)
          .filter(p => {
            return plantUtil.getPlant(p);
          })
          .forEach(p => {
            const amt = game.inventory[p];
            const money = invUtil.sell(p, amt);
            if (money > 0) {
              const plant = plantUtil.getPlant(p);
              sold = true;
              ai.speak(
                `Sold ${amt} ${amt > 1 ? plant.pl : plant} for ${money}`
              );
            }
          });

        if (!sold) {
          ai.speak(`You didn't have any produce to sell`);
        } else {
          ai.speak(`You now have ${game.money} bucks`);
        }
        return;
      }
      const plant = plantUtil.getPlant(entity);
      if (plant) {
        if (amt === "all" || amt.includes("max")) {
          amt = game.inventory[plant.id] || 0;
        } else if (amt === "an" || amt === "a") {
          amt = 1;
        } else {
          amt = Number.parseInt(amt, 10);
        }
        if (amt > 0) {
          const sold = invUtil.sell(entity, amt);
          if (sold) {
            ai.speak(
              `Sold ${amt} ${
                amt === 1 ? plant.name : plant.pl
              } for ${sold} buck${sold === 1 ? "aroo" : "s"}`
            );
          } else {
            ai.speak(`Sorry, you do not have ${amt} ${plant.pl} to sell`);
          }
        } else {
          if(!game.inventory[plant.id]){
            ai.speak(`Sorry, you do not have any ${plant.pl} to sell`);
          }
        }
      }
    }
  },
  buy: {
    parameters: ["amt", "plant"],
    similar: ["buy", "bye", "by"],
    fn: (amt, p, entity) => {
      commands.purchase.fn(amt, p, entity);
    }
  },
  purchase: {
    parameters: ["amt|'plot'", "plant"],
    similar: ["purchase"],
    fn: (amt, p) => {
      if (amt.includes("plot") || p.includes("plot")) {
        // buying a plot
        const bought = plotUtil.buyPlot();
        if (bought) {
          ai.speak(
            `Bought a plot for ${bought.cost} bucks and ${bought.land} land.`
          );
        } else {
          const cost = plotUtil.cost();
          const canAfford = game.money >= cost;
          const haveLand = game.land >= 20;
          let text = `You couldn't afford to buy a plot.`;
          if (!canAfford) {
            text += ` You have ${game.money} buck${
              game.money > 1 ? "s" : "aroo"
            }, but needed ${cost} bucks.`;
          }
          if (!haveLand) {
            text += ` You have ${
              game.land
            } land, but need 20 units of undeveloped land.`;
          }
          ai.speak(text);
        }
        return;
      }

      // check if amt was ignored
      let plant = plantUtil.getPlant(amt);
      if (plant) {
        amt = "1";
      } else {
        plant = plantUtil.getPlant(p);
      }

      if (!plant) {
        return;
      }

      const seed = plant.id + "_seed";
      const seedPrice = plantUtil.getSeedPrice(plant.id); // packet of seeds is 5x price of the plant, because we expect 10 plants per harvest

      if (amt === "all" || amt.includes("max")) {
        amt = game.money / seedPrice;
      } else if (amt === "an" || amt === "a") {
        amt = 1;
      } else {
        amt = parser.number(amt);
        if (amt === null) {
          return;
        }
      }

      if (amt * seedPrice <= game.money) {
        game.money -= seedPrice * amt;
        invUtil.give(seed, amt);
        ai.speak(
          `You paid ${amt * seedPrice} bucks for ${amt} ${plant.name} seed${
            amt > 1 ? "s" : ""
          }`
        );
      } else {
        ai.speak(
          `I'm afraid you cannot afford to buy ${amt} ${plant.name} seed${
            amt > 1 ? "s" : ""
          }`
        );
      }
    }
  },
  status: {
    parameters: [],
    similar: ["state", "states"],
    fn: () => {
      ai.speak(`You have ${game.money} buck${game.money > 1 ? "s" : "aroo"}, ${
        game.plots.length
      } plot${game.plots.length > 1 ? "s" : ""}, 
      and ${game.land} unit${game.land > 1 ? "s" : ""} of undeveloped land.`);
      ai.speak(`You have explored ${game.explored} units of distance so far.`);
      if (game.currentTask) {
        ai.speak(
          `You are currently ${
            tasks[game.currentTask.id]
          }, next check-in is ${moment(game.currentTask.finish).fromNow()}`
        );
      }
    }
  },
  list: {
    parameters: ["entity"],
    similar: ["lis", "less", "liz"],
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
        if (numUsed > 0) {
          text += ` ${numUsed} ${numUsed === 1 ? "is" : "are"} in use.`;

          ai.speak(text);
          if (numUsed <= 5) {
            commands.list.fn("plants");
          } else {
            ai.speak(
              `If you would like a full list of currently growing plants, please say "list plants"`
            );
          }
        } else {
          ai.speak(text);
        }
      } else if (e.includes("plant")) {
        const numUsed = game.plots.filter(p => p.planted).length;
        if (numUsed === 0) {
          ai.speak(`You do not have anything growing at the moment.`);
        } else {
          let countReady = 0;
          game.plots.forEach((p, index) => {
            if (p.ready) {
              const plant = plantUtil.getPlant(p.planted);
              ai.speak(
                `${plant.pl} are ready for harvesting at Plot ${index + 1}. `
              );
              countReady++;
            }
          });

          if (countReady.length === 0) {
            ai.speak(`Nothing can be harvested at the moment.`);
          }

          game.plots.forEach((plot, index) => {
            if (!plot.ready && plot.planted && plot.timePlanted) {
              const plant = plantUtil.getPlant(plot.planted);
              const mature = plot.finish;
              if (mature > Date.now()) {
                ai.speak(
                  `Plot ${index + 1} is growing ${
                    plant.pl
                  }, they will be ready ${moment(mature).fromNow()}.`
                );
              }
            }
          });
        }
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
        Object.keys(tasks).forEach(t => {
          const task = tasks[t];
          ai.speak(`${task.id} - ${task.describe}`);
        });
      }
    }
  },
  clear: {
    parameters: ["entity"],
    similar: ["claire", "cleer", "clearing", "care", "clears"],
    fn: entity => {
      if (entity.includes("land")) {
        // clear land
        taskUtil.startTask("clear land");
      }
    }
  },
  look: {
    parameters: ["action", "entity", "property"],
    similar: ["luck", "looks", "lucks"],
    fn: (action, entity, property) => {
      if (action.includes("up") && property && property.includes("price")) {
        const pricelist = [];
        if (entity.includes("seed")) {
          // look up seed prices

          Object.keys(game.unlocked).forEach(k => {
            if (k.includes("_seed")) {
              const plant = plantUtil.getPlant(k.split("_seed")[0]);
              pricelist.push({
                item: `${plant.name} seeds`,
                price: plantUtil.getSeedPrice(plant.id)
              });
            }
          });
        } else if (entity.includes("produce") || entity.includes("product")) {
          // look up produce prices
          Object.keys(game.unlocked).forEach(p => {
            const plant = plantUtil.getPlant(p);
            if (plant) {
              ai.speak(
                `${plant.pl} are currently selling for ${plant.price} each.`
              );
            }
          });
        }
        if (pricelist.length > 0) {
          pricelist.forEach(p => {
            ai.speak(`${p.item}: ${p.price} bucks each.`);
          });
        }
      }
    }
  },
  cancel: {
    parameters: ["entity"],
    similar: ["cancer", "cansel", "hansel"],
    fn: entity => {
      if (entity.includes("task")) {
        const task = tasks[game.currentTask.id];
        if (task) {
          ai.speak(
            `Midway through ${
              task.name
            }, you decided to give up and return to base.`
          );
        }
        taskUtil.cancel();
      }
    }
  },
  describe: {
    parameters: ["plant"],
    similar: ["describe"],
    fn: p => {
      const plant = plantUtil.getPlant(p);
      if (plant) {
        const amt = game.inventory[plant.id] || 0;
        const seeds = game.inventory[`${plant.id}_seed`] || 0;
        ai.speak(
          `${plant.name}: Grows in ${plant.season}. Takes ${
            plant.time
          } days to mature.`
        );
        if (plant.maxHarvest > 1) {
          ai.speak(`${plant.pl} can be harvested ${plant.maxHarvest} times before needing replanting`);
        }

        ai.speak(`${plant.name} currently sells for ${plant.price} bucks each. 
        You currently have ${amt} ${
          amt > 1 ? plant.pl : plant.name
        }, and ${seeds} ${plant.name} seed${seeds > 1 ? "s" : ""}`);
      }
    }
  },
  upgrade: {
    parameters: ["plot", "id"],
    similar: [],
    fn: (plot, id, upgrade) => {
      if (plot.includes("plot")) {
        // plot upgrade
        const ind = Number.parseInt(id, 10);
        if (isNaN(ind)) {
          return; // bad.
        }

        if (ind < 0 || ind >= game.plots.length) {
          return; // bad.
        }

        const plot = game.plots[ind];
        plotUtil.upgrade(plot);
      }
    }
  }
};

var tasks = {
  "clear land": {
    id: "clear land",
    name: "clearing land",
    describe: `only takes a few minutes, but will clear up some land so you can construct additional plots`,
    time: 3,
    complete: () => {
      const land = Math.round(Math.random() * 5 + 3);
      game.land += land;
      ai.speak(
        `You cleared ${land} units of land, you now have ${
          game.land
        } units of land.`
      );
    }
  },
  explore: {
    id: "explore",
    name: "exploring the area",
    describe: `takes 5 minutes, each time you explore a little further than before, and there is the chance of finding something new, or getting knocked out, so be careful...`,
    time: 5,
    complete: silent => {
      const lootTable = [
        {
          minDist: 0,
          maxDist: 10000,
          size: 20,
          fn: () => {
            game.explored += 5;
            if (!silent) {
              ai.speak("You came back empty handed. Oh well.");
            }
            return {
              explored: 5
            };
          }
        },
        {
          minDist: 0,
          maxDist: 100,
          size: 5,
          fn: () => {
            game.explored += 5;
            game.money += 20;
            if (!silent) {
              ai.speak("You found 20 bucks exploring! Go you!");
            }

            return {
              explored: 5,
              money: 20
            };
          }
        },
        {
          minDist: 0,
          maxDist: 50,
          size: 30,
          fn: () => {
            game.explored += 5;
            invUtil.give("potato", 5);
            if (!silent) {
              ai.speak(`You found 5 potatoes while exploring.`);
            }
            return {
              explored: 5,
              potato: 5
            };
          }
        },
        {
          minDist: 30,
          maxDist: 1000,
          size: 1,
          fn: () => {
            game.explored += 5;
            invUtil.give("potato_seed", 1);
            ai.speak("You found a packet of potato seeds while exploring!");
          }
        },
        {
          minDist: 40,
          maxDist: 1000,
          size: 1,
          fn: () => {
            game.explored += 5;
            invUtil.give("garlic_seed", 1);
            ai.speak("You found a packet of garlic seeds while exploring!");
          }
        },
        {
          minDist: 100,
          maxDist: 250,
          size: 30,
          fn: () => {
            game.explored += 5;
            invUtil.give("radish", 5);
            if (!silent) {
              ai.speak(`You found 5 potatoes while exploring.`);
            }
            return {
              explored: 5,
              potato: 5
            };
          }
        },
      ];

      const avail = lootTable.filter(l => {
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
};

const taskUtil = {
  process: () => {
    if (game.currentTask) {
      // is the current task done?
      if (game.currentTask.finish <= Date.now()) {
        // check how many times it could have been done
        const task = tasks[game.currentTask];
        const times = Math.floor(
          (Date.now() - game.currentTask.started) / (task.time * 1000)
        );
        if (times > 1) {
          tasks[game.currentTask.id].complete(true);
        } else {
          tasks[game.currentTask.id].complete();
        }

        taskUtil.startTask(game.currentTask.id, true);
      }
    }

    setTimeout(() => {
      taskUtil.process();
    }, 100);
  },
  startTask: (id, silent) => {
    taskUtil.cancel();
    game.currentTask = {
      id: id,
      started: Date.now(),
      finish: tasks[id].time * 1000 * 60 + Date.now()
    };

    if (!silent) {
      ai.speak(
        `Work work work. You are now ${tasks[id].name}, you will return every ${
          tasks[id].time
        } minutes. You may cancel this task by saying "cancel task" or issue a new task.`
      );
    }
  },
  cancel: () => {
    delete game.currentTask;
  }
};
