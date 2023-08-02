export interface Region {
  name: string,
  url: string,
  areaId: number
}

export const regions: Region[] = [
  { name: 'Kitchener Area', url: 'kitchener-area', areaId: 1700209 },
  { name: 'Kitchener Waterloo', url: 'kitchener-waterloo', areaId: 1700212 },
  { name: 'Cambridge', url: 'cambridge', areaId: 1700210 },
  { name: 'Guelph', url: 'guelph', areaId: 1700242 },
  { name: 'Stratford', url: 'stratford', areaId: 1700213 },
  { name: 'Ontario', url: 'ontario', areaId: 9004 }
]
