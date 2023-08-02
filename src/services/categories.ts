export interface Category {
  name: string;
  url: string;
  id: number;
  all?: boolean
}

export const categories: Category[] = [
  { name: 'All', url: '', id: 0, all: true },
  { name: 'Phones', url: 'phone-tablet', id: 132 },
  { name: 'Laptops', url: 'laptops', id: 773 },
  { name: 'Computer Accessories', url: 'computer-accessories', id: 128 },
  { name: 'Computers', url: 'computers', id: 16 },
  { name: 'Desktops', url: 'desktop-computers', id: 772 },
  { name: 'Electronics', url: 'value', id: 29659001 },
  { name: 'Video Games', url: 'video-games-consoles', id: 141 },
  { name: 'Audio', url: 'audio', id: 767 },
  { name: 'Furniture', url: 'furniture', id: 235 },
]
