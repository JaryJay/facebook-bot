import { Deal } from "./deal";

export interface SortMode {
  name: string;
  sort: (deals: Deal[]) => void
}

export const sortModes: SortMode[] = [
  {
    name: "Original Order",
    sort(deals: Deal[]) {
    }
  },
  {
    name: "Reverse",
    sort(deals: Deal[]) {
      deals.reverse()
    }
  },
  {
    name: "Price",
    sort(deals: Deal[]) {
      deals.sort((a, b) => a.price - b.price)
    }
  },
  {
    name: "Price (Desc.)",
    sort(deals: Deal[]) {
      deals.sort((a, b) => b.price - a.price)
    }
  },
]
