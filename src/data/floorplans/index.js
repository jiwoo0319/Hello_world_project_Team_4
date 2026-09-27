import b1 from "./b1.json";
import f1 from "./1f.json";
import f2 from "./2f.json";
import f3 from "./3f.json";
import f4 from "./4f.json";
import { FLOOR_IMAGES } from "./images";

export const FLOORS = [b1, f1, f2, f3, f4].map((floor) => ({
  ...floor,
  image: FLOOR_IMAGES[floor.id],
}));
