import { Deal } from "./deal";

export interface FetchMode {
  name: string;
  code: string;
}

export const fetchModes: FetchMode[] = [
  {
    name: "Suggested",
    code: "",
  },
  {
    name: "Distance: Nearest First",
    code: "distance_ascend",
  },
  {
    name: "Date Listed: Newest First",
    code: "creation_time_descend",
  },
]
