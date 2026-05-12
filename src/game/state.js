export const state = {
  isLoggedIn: false,
  player: {
    username: "",
    name: "",
    id: null,
  },
  game: {
    started: false,
    score: 0,
    level: 1,
    upgrades: 0,
    baseHealth: 0,
    health: 0,
    maxHealth: 0,
    stats: {
      regen: 0,
      maxHealth: 0,
      bulletSpeed: 0,
      bodyDamage: 0,
      bulletPenetration: 0,
      bulletDamage: 0,
      reload: 0,
      movementSpeed: 0,
    },
  },
};
