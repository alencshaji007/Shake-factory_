/**
 * Shared, late-bound handles (the three.js atmosphere loads after first paint).
 */
export const noAtmosphere = { state: {}, setTheme() {}, setPush() {}, setCamera() {}, burst() {}, setSpeed() {}, setVisible() {} };

export const world = {
  atmos: noAtmosphere
};
