import { Deal } from "./deal";

export interface SortMode {
  name: string;
  sort: (deals: Deal[]) => void
}

export const sortModes: SortMode[] = [
  {
    name: "Date Posted",
    sort(deals: Deal[]) {
      deals.sort((a, b) => a.date.getTime() - b.date.getTime())
    }
  },
  {
    name: "Date Posted (Desc.)",
    sort(deals: Deal[]) {
      deals.sort((a, b) => b.date.getTime() - a.date.getTime())
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
