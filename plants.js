var plants = {
  garlic: {
    name: "Garlic",
    pl: "Garlics",
    price: 50,
    time: 3,
    maxHarvest: 4,
    season: "spring",
  },
  kale: {
    name: "Kale",
    pl: "Kales",
    price: 120,
    time: 8,
    season: "spring"
  },
  potato: {
    name: "Potato",
    pl: "Potatoes",
    price: 80,
    time: 7,
    season: "spring"
  },
  tulip: {
    name: "Tulip",
    pl: "Tulips",
    price: 30,
    time: 15,
    maxHarvest: 3,
    season: "spring"
  },
  radish: {
    name: "Radish",
    pl: "Radishes",
    price: 250,
    time: 10,
    season: "summer"
  },
  cabbage: {
    name: "Cabbage",
    pl: "Cabbages",
    price: 1400,
    time: 20,
    season: "summer"
  },
  corn: {
    name: "Corn",
    pl: "Corns",
    price: 120,
    time: 15,
    maxHarvest: 3,
    season: "summer"
  },
  sunflower: {
    name: "Sunflower",
    pl: "Sunflowers",
    price: 150,
    time: 45,
    season: "summer"
  },
  grape: {
    name: "Grape",
    pl: "Grapes",
    price: 160,
    maxHarvest: 3,
    time: 30,
    season: "autumn"
  },
  pumpkin: {
    name: "Pumpkin",
    pl: "Pumpkins",
    price: 640,
    time: 120,
    season: "autumn"
  }
};

Object.keys(plants).forEach(k => {
  plants[k].id = k;
});


var plantUtil = {
  getPlant: p => {
    let plant = plants[p];
    // try plural
    if (!plant) {
      const _p = Object.keys(plants).find(k => {
        const _plant = plants[k];
        if (_plant.pl.toLowerCase() === p) {
          return true;
        }
      });
      if (_p) {
        plant = plants[_p];
      }
    }

    return plant;
  },
  getSeedPrice: p => {
    let plant = plantUtil.getPlant(p);
    if (!plant) {
      return 0;
    } else {
      if (plant.maxHarvest > 1) {
        return plant.price * 3 * plant.maxHarvest;
      } else {
        return plant.price * 5;
      }
    }
  }
};