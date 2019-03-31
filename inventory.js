var invUtil = {
  has: things => {
    return Object.keys(things).every(k => {
      return game.inventory[k] && game.inventory[k] >= things[k];
    });
  },
  give: (thing, amt) => {
    if (!game.inventory[thing]) {
      game.inventory[thing] = 0;
    }
    if (thing.includes("_seed")) {
      const p = thing.split("_seed")[0];
      const plant = plantUtil.getPlant(p);
      if (plant) {
        game.unlocked[thing] = true;
        game.unlocked[plant.id] = true;
      }
    }
    game.inventory[thing] += amt;
  },
  pay: (thing, amt) => {
    if (!game.inventory[thing] || game.inventory[thing] < amt) {
      return false;
    } else {
      game.inventory[thing] -= amt;
      return true;
    }
  },
  listSeeds: () => {
    const ret = {};
    Object.keys(game.inventory).forEach(k => {
      if (game.inventory[k] > 0 && k.includes("_seed")) {
        ret[k] = game.inventory[k];
      }
    });
    return ret;
  },
  listPlants: () => {
    const ret = {};
    Object.keys(game.inventory).forEach(k => {
      if (game.inventory[k] > 0 && plants[k]) {
        ret[k] = game.inventory[k];
      }
    });
    return ret;
  },
  sell: (p, amt) => {
    const plant = plantUtil.getPlant(p);
    if (!plant) {
      return false;
    }

    if (invUtil.pay(plant.id, amt)) {
      const money = plant.price * amt;
      game.money += money;
      return money;
    } else {
      return false;
    }
  }
};
