import { FitsColorMaps } from "~/utils/types";

export const API_URL = "http://localhost:7000";

export const fitsColorMaps: FitsColorMaps[] = [
  { wwt: "viridis", desc: "Viridis" },
  { wwt: "plasma", desc: "Plasma" },
  { wwt: "inferno", desc: "Inferno" },
  { wwt: "magma", desc: "Magma" },
  { wwt: "cividis", desc: "Cividis" },
  { wwt: "rdylbu", desc: "Thermal (Red-Yellow-Blue)" },
  { wwt: "gray", desc: "Black-to-White" },
  { wwt: "greys", desc: "White-to-Black" },
  { wwt: "purples", desc: "White-to-Purple" },
  { wwt: "blues", desc: "White-to-Blue" },
  { wwt: "greens", desc: "White-to-Green" },
  { wwt: "oranges", desc: "White-to-Orange" },
  { wwt: "reds", desc: "White-to-Red" },
];
