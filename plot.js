var plotUtil = {
  cost: () => {
    const cost = Math.round(200 * Math.pow(1.5, game.plots.length - 1));
    return cost;
  },
  buyPlot: () => {
    const cost = plotUtil.cost();
    const land = 20;
    if (game.money >= cost && game.land >= land) {
      game.money -= cost;
      game.land -= land;
      plotUtil.addPlot();

      return {
        land: land,
        cost: cost
      };
    }

    return null;
  },
  addPlot: () => {
    game.plots.push({
      index: game.plots.length,
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
        plot.finish = plotUtil.calcFinishTime(plant, plot);
        if (plant.maxHarvest > 1) {
          plot.harvest = plant.maxHarvest;
        }

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
  calcFinishTime: (plant, plot) => {
    return (
      Date.now() +
      Math.round(plant.time * 1000 * 60 * Math.pow(0.95, plot.sprinkler))
    );
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
      if (plot.finish <= Date.now()) {
        const plant = plantUtil.getPlant(plot.planted);
        let amt = 10 + (plotUtil.fertilizer || 0); // base

        invUtil.give(plot.planted, amt);

        const hvt = {};
        hvt[plot.planted] = amt;
        plot.ready = false;
        if (!plant.maxHarvest || plant.maxHarvest === 1) {
          plot.timePlanted = null;
          plot.finish = null;
          plot.planted = null;
        } else {
          plot.harvest--;
          if (plot.harvest > 0) {
            plot.finish = plotUtil.calcFinishTime(plant, plot);
          } else {
            plot.timePlanted = null;
            plot.finish = null;
            plot.planted = null;
          }
        }
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
        if (p.finish <= Date.now()) {
          p.ready = true;
          matured[p.planted] = true;
        }
      }
    });

    if (Object.keys(matured).length > 0) {
      const arr = Object.keys(matured).map(p => {
        return plantUtil.getPlant(p).pl;
      });

      let text = `The ` + toList(arr) + ` are ready for harvesting!`;
      if (game.currentTask && game.currentTask.finish >= Date.now()) {
        text += `But reminder that you are currently ${
          tasks[game.currentTask.id].name
        }, which will be done ${moment(game.currentTask.finish).fromNow()}.`;
      }
    }

    setTimeout(() => {
      plotUtil.process();
    }, 100);
  },
  upgrade: plot => {
    const up = plot.sprinkler + 1;
    const s = upgrades.sprinkler;
    const parts = s.parts;
    if (
      parts.every(p => {
        const _p = _p + "_" + up;
        return game.inventory[_p] && game.inventory[_p] > 0;
      })
    ) {
      parts.forEach(p => {
        const _p = _p + "_" + up;
        invUtil.pay(_p, 1);
      });
      plot.sprinkler++;
      ai.speak(`Plot ${plot.index} now has level ${plot.sprinkler} sprinklers`);
    }
  }
};
