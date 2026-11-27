import type { PlanetRelation } from "../state/index.js";
export const relationColours: Readonly<Record<PlanetRelation, string>> = {
  own: "#33cc55",
  enemy: "#dd3333",
  unowned: "#8a8a8a",
};
