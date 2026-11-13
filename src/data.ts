export type CategoryId = 'burgers' | 'pizza' | 'chicken' | 'fries' | 'drinks'
export type FilterId = CategoryId | 'all' | 'fav'

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'chicken', label: 'Chicken', emoji: '🍗' },
  { id: 'fries', label: 'Fries', emoji: '🍟' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
]

export type Badge = 'hit' | 'spicy' | 'new' | 'veg'
export const BADGE_LABEL: Record<Badge, string> = {
  hit: 'Bestseller',
  spicy: 'Spicy',
  new: 'New',
  veg: 'Veggie',
}

export interface Product {
  id: string
  name: string
  category: CategoryId
  price: number
  image: string
  description: string
  rating: number
  reviews: number
  weight: string
  kcal: number
  badges?: Badge[]
}

export interface SizeOption {
  id: string
  label: string
  delta: number
}
export interface ExtraOption {
  id: string
  label: string
  price: number
}

/** Customisation options shared by every product in a category. Prices in EUR. */
export const OPTIONS: Record<CategoryId, { sizes: SizeOption[]; extras: ExtraOption[] }> = {
  burgers: {
    sizes: [
      { id: 'regular', label: 'Regular', delta: 0 },
      { id: 'large', label: 'Large', delta: 2.5 },
      { id: 'xl', label: 'XL', delta: 4.5 },
    ],
    extras: [
      { id: 'cheese', label: 'Double cheddar', price: 1.5 },
      { id: 'patty', label: 'Extra patty', price: 4 },
      { id: 'bacon', label: 'Crispy bacon', price: 2 },
      { id: 'jalapeno', label: 'Jalapeños', price: 1 },
    ],
  },
  pizza: {
    sizes: [
      { id: '25', label: '25 cm', delta: 0 },
      { id: '30', label: '30 cm', delta: 3 },
      { id: '35', label: '35 cm', delta: 5.5 },
    ],
    extras: [
      { id: 'burrata', label: 'Burrata from Puglia', price: 3.5 },
      { id: 'mozzarella', label: 'Extra fior di latte', price: 2 },
      { id: 'nduja', label: "Spicy 'nduja", price: 2.5 },
    ],
  },
  chicken: {
    sizes: [
      { id: 's', label: '6 pcs', delta: 0 },
      { id: 'm', label: '9 pcs', delta: 3 },
      { id: 'l', label: '12 pcs', delta: 5.5 },
    ],
    extras: [
      { id: 'ranch', label: 'Ranch dip', price: 1 },
      { id: 'bbq', label: 'Smoky BBQ dip', price: 1 },
      { id: 'hot', label: '“Inferno” hot sauce', price: 1.2 },
    ],
  },
  fries: {
    sizes: [
      { id: 's', label: 'Small', delta: 0 },
      { id: 'm', label: 'Medium', delta: 1.2 },
      { id: 'l', label: 'Large', delta: 2.2 },
    ],
    extras: [
      { id: 'cheese', label: 'Cheese sauce', price: 1.2 },
      { id: 'truffle', label: 'Truffle oil', price: 2 },
      { id: 'parmigiano', label: 'Parmigiano Reggiano', price: 1.5 },
    ],
  },
  drinks: {
    sizes: [
      { id: '03', label: '0.3 L', delta: 0 },
      { id: '05', label: '0.5 L', delta: 1.5 },
    ],
    extras: [
      { id: 'cream', label: 'Whipped cream', price: 1 },
      { id: 'syrup', label: 'Salted caramel', price: 0.8 },
    ],
  },
}

export const PRODUCTS: Product[] = [
  // Burgers
  {
    id: 'ember-classic',
    name: 'Ember Classic',
    category: 'burgers',
    price: 12.9,
    image: '1568901346375-23c9450c58cd',
    description: 'Charcoal-grilled Piedmontese beef, aged cheddar, tomato, pickled onion and our signature Ember sauce.',
    rating: 4.9,
    reviews: 1284,
    weight: '290 g',
    kcal: 640,
    badges: ['hit'],
  },
  {
    id: 'spicy-chicken',
    name: 'Spicy Chicken',
    category: 'burgers',
    price: 11.9,
    image: '1606755962773-d324e0a13086',
    description: 'Crispy fried chicken thigh in a fiery batter, slaw, pickles and sriracha mayo.',
    rating: 4.8,
    reviews: 972,
    weight: '310 g',
    kcal: 690,
    badges: ['spicy'],
  },
  {
    id: 'double-smash',
    name: 'Double Smash',
    category: 'burgers',
    price: 14.5,
    image: '1572802419224-296b0aeee0d9',
    description: 'Two thin smashed patties with a caramelised crust, double American cheese, onion and mustard.',
    rating: 4.9,
    reviews: 1530,
    weight: '340 g',
    kcal: 820,
    badges: ['hit'],
  },
  {
    id: 'black-truffle',
    name: 'Tartufo Nero',
    category: 'burgers',
    price: 16.9,
    image: '1596662951482-0c4ba74a6df6',
    description: 'Prime beef, black truffle mayo from Umbria, shiitake, rocket and brie on a charcoal bun.',
    rating: 4.7,
    reviews: 418,
    weight: '320 g',
    kcal: 710,
    badges: ['new'],
  },
  {
    id: 'bbq-bacon',
    name: 'Bacon BBQ',
    category: 'burgers',
    price: 15.5,
    image: '1553979459-d2229ba7433b',
    description: 'Double patty, crispy bacon, smoked scamorza, onion rings and whisky BBQ sauce.',
    rating: 4.8,
    reviews: 806,
    weight: '360 g',
    kcal: 880,
  },
  {
    id: 'cheddar-melt',
    name: 'Cheddar Melt',
    category: 'burgers',
    price: 13.5,
    image: '1607013251379-e6eecfffe234',
    description: 'Juicy patty, melting 18-month cheddar, pickles and roasted garlic aioli.',
    rating: 4.8,
    reviews: 655,
    weight: '300 g',
    kcal: 700,
  },
  // Pizza
  {
    id: 'pepperoni',
    name: 'Diavola',
    category: 'pizza',
    price: 11.5,
    image: '1604382354936-07c5d9983bd3',
    description: 'San Marzano tomato, fior di latte and plenty of spicy salame piccante.',
    rating: 4.9,
    reviews: 1102,
    weight: '520 g',
    kcal: 1240,
    badges: ['hit'],
  },
  {
    id: 'margherita',
    name: 'Margherita',
    category: 'pizza',
    price: 9.5,
    image: '1574071318508-1cdbab80d002',
    description: '48-hour Neapolitan dough, San Marzano tomato, fior di latte, basil and extra-virgin olive oil.',
    rating: 4.8,
    reviews: 760,
    weight: '470 g',
    kcal: 980,
    badges: ['veg'],
  },
  {
    id: 'four-cheese',
    name: 'Quattro Formaggi',
    category: 'pizza',
    price: 13.5,
    image: '1565299624946-b28f40a0ae38',
    description: 'Mozzarella, gorgonzola dolce, Parmigiano and taleggio with a drizzle of acacia honey.',
    rating: 4.7,
    reviews: 512,
    weight: '500 g',
    kcal: 1310,
  },
  {
    id: 'green-garden',
    name: 'Verde',
    category: 'pizza',
    price: 12.5,
    image: '1593560708920-61dd98c46a4e',
    description: 'Spinach, ricotta, mozzarella, Genovese pesto and roasted garlic on a thin crust.',
    rating: 4.6,
    reviews: 298,
    weight: '480 g',
    kcal: 940,
    badges: ['veg', 'new'],
  },
  // Chicken
  {
    id: 'buffalo-wings',
    name: 'Buffalo Wings',
    category: 'chicken',
    price: 10.5,
    image: '1608039755401-742074f0548d',
    description: 'Crispy wings tossed in creamy-hot buffalo sauce, with celery and gorgonzola dip.',
    rating: 4.8,
    reviews: 890,
    weight: '320 g',
    kcal: 610,
    badges: ['spicy', 'hit'],
  },
  {
    id: 'tenders',
    name: 'Chicken Tenders',
    category: 'chicken',
    price: 8.9,
    image: '1562967914-608f82629710',
    description: 'Free-range chicken in herby panko crumbs. Juicy inside, shatteringly crisp outside.',
    rating: 4.7,
    reviews: 640,
    weight: '280 g',
    kcal: 540,
  },
  {
    id: 'bbq-wings',
    name: 'BBQ Wings',
    category: 'chicken',
    price: 10.5,
    image: '1527477396000-e27163b481c2',
    description: 'Smoked wings in a sticky BBQ glaze with sesame and spring onion.',
    rating: 4.7,
    reviews: 433,
    weight: '320 g',
    kcal: 640,
  },
  {
    id: 'crispy-chicken',
    name: 'Southern Crispy Chicken',
    category: 'chicken',
    price: 9.9,
    image: '1569058242253-92a9c755a0ec',
    description: 'Double-dredged thigh bites, Southern style, with smoked paprika.',
    rating: 4.8,
    reviews: 502,
    weight: '300 g',
    kcal: 660,
  },
  // Fries
  {
    id: 'classic-fries',
    name: 'Classic Fries',
    category: 'fries',
    price: 3.9,
    image: '1630384060421-cb20d0e0649d',
    description: 'Skinny double-fried fries with Sicilian sea salt.',
    rating: 4.8,
    reviews: 2100,
    weight: '150 g',
    kcal: 380,
    badges: ['veg'],
  },
  {
    id: 'truffle-fries',
    name: 'Truffle & Parmigiano Fries',
    category: 'fries',
    price: 6.5,
    image: '1573080496219-bb080dd4f877',
    description: 'Fries with truffle oil, Parmigiano Reggiano and parsley.',
    rating: 4.9,
    reviews: 870,
    weight: '170 g',
    kcal: 460,
    badges: ['hit'],
  },
  {
    id: 'rustic-fries',
    name: 'Rustic Wedges',
    category: 'fries',
    price: 4.5,
    image: '1541592106381-b31e9677c0e5',
    description: 'Skin-on wedges with rosemary and garlic.',
    rating: 4.7,
    reviews: 530,
    weight: '180 g',
    kcal: 420,
    badges: ['veg'],
  },
  {
    id: 'chili-fries',
    name: 'Chilli Fries',
    category: 'fries',
    price: 5.5,
    image: '1576107232684-1279f390859f',
    description: 'Fries with smoked paprika, Calabrian chilli and lime salt.',
    rating: 4.6,
    reviews: 311,
    weight: '170 g',
    kcal: 440,
    badges: ['spicy'],
  },
  // Drinks
  {
    id: 'choco-shake',
    name: 'Cookies & Cream Shake',
    category: 'drinks',
    price: 6.9,
    image: '1572490122747-3968b75cc699',
    description: 'Vanilla gelato, dark chocolate, crushed cookies and a crown of whipped cream.',
    rating: 4.9,
    reviews: 940,
    weight: '400 ml',
    kcal: 560,
    badges: ['hit'],
  },
  {
    id: 'berry-shake',
    name: 'Strawberry Shake',
    category: 'drinks',
    price: 6.5,
    image: '1579954115545-a95591f28bfc',
    description: 'Fresh strawberries, fior di latte gelato and a hint of vanilla.',
    rating: 4.8,
    reviews: 488,
    weight: '400 ml',
    kcal: 420,
  },
  {
    id: 'lemonade',
    name: 'Amalfi Lemonade',
    category: 'drinks',
    price: 4.5,
    image: '1621263764928-df1444c5e859',
    description: 'Freshly squeezed Amalfi Coast lemons, lime and garden mint.',
    rating: 4.7,
    reviews: 372,
    weight: '400 ml',
    kcal: 140,
    badges: ['veg'],
  },
  {
    id: 'mojito',
    name: 'Virgin Mojito',
    category: 'drinks',
    price: 5,
    image: '1513558161293-cdaf765ed2fd',
    description: 'Lime, mint, cane sugar and soda. The perfect cool-down after something spicy.',
    rating: 4.7,
    reviews: 260,
    weight: '400 ml',
    kcal: 120,
    badges: ['veg'],
  },
]

export const COMBO = {
  id: 'spicy-combo',
  name: 'Spicy Combo',
  items: 'Spicy Chicken + Classic Fries + Amalfi Lemonade',
  oldPrice: 20.3,
  price: 15.9,
  image: '1594212699903-ec8a3eca50f5',
}

export const PROMO_CODES: Record<string, number> = {
  FEELGOOD: 0.15,
  CIAO10: 0.1,
}

export const DELIVERY_FEE = 2.9
export const FREE_DELIVERY_FROM = 30

export const IMAGES = {
  hero: '1571091718767-18b5b1457add',
  heroAlt: '1551782450-a2132b4ba21d',
  detail: '1550317138-10000687a72b',
  courier: '1617347454431-f49d7ff5c3b1',
  restaurant: '1517248135467-4c7edcad34c4',
  grill: '1610614819513-58e34989848b',
  fries: '1561758033-d89a9ad46330',
}

export const REVIEWS = [
  {
    name: 'Giulia R.',
    avatar: '1494790108377-be9c29b29330',
    rating: 5,
    date: '2 days ago',
    text: 'The Spicy Chicken is love at first bite. The rider arrived in 22 minutes, everything was hot and the fries were still crispy. Lovely packaging too.',
  },
  {
    name: 'Marco B.',
    avatar: '1500648767791-00dcc994a43e',
    rating: 5,
    date: 'a week ago',
    text: 'Best smash burger in Milan, no exaggeration. The crust on the patty is pure New York. Our whole office orders every Friday.',
  },
  {
    name: 'Sophie L.',
    avatar: '1438761681033-6461ffad8d80',
    rating: 5,
    date: '3 days ago',
    text: 'Visiting from Lyon and found this gem in Navigli. Built my own burger — no onion, extra jalapeños and bacon. The English menu made it so easy.',
  },
  {
    name: 'Luca F.',
    avatar: '1507003211169-0a1dd7228f2d',
    rating: 4,
    date: '2 weeks ago',
    text: 'Truffle & Parmigiano fries with a cookies & cream shake — a perfect evening. The Diavola has a proper Neapolitan crust. Coming back for the Tartufo Nero.',
  },
  {
    name: 'Emma W.',
    avatar: '1534528741775-53994a69daeb',
    rating: 5,
    date: 'a month ago',
    text: 'We celebrated a birthday at the Brera restaurant: warm, buzzing and the staff were wonderful. The buffalo wings are literally on fire.',
  },
]

export const STEPS = [
  {
    title: 'You choose',
    text: 'Build your burger your way: size, toppings, sauces. Pay by card, Apple Pay, Google Pay or cash.',
  },
  {
    title: 'We grill on fire',
    text: 'Every patty hits the charcoal only after you order — at 400 °C. Nothing waiting under heat lamps.',
  },
  {
    title: 'We deliver',
    text: 'Our own riders and insulated bags. Average delivery time across central Milan: 27 minutes.',
  },
]

export const LOCATIONS = [
  {
    name: 'EMBER Navigli',
    address: 'Ripa di Porta Ticinese 27, 20143 Milano',
    hours: 'Daily 11:30 am – 1:00 am',
  },
  {
    name: 'EMBER Brera',
    address: 'Via Solferino 12, 20121 Milano',
    hours: 'Daily 12:00 pm – 12:00 am',
  },
  {
    name: 'EMBER Porta Nuova',
    address: 'Piazza Gae Aulenti 6, 20154 Milano',
    hours: 'Mon–Fri 8:00 am – 11:00 pm',
  },
]

export const FAQ = [
  {
    q: 'How much is delivery?',
    a: 'Delivery is €2.90 and free on orders over €30. Pick-up from any of our restaurants is always free — and your order skips the queue.',
  },
  {
    q: 'How fast will my order arrive?',
    a: 'Usually within 25–35 minutes. It depends on your area and how busy the kitchen is — you will see the exact window at checkout.',
  },
  {
    q: 'Can I remove or add ingredients?',
    a: 'Of course. Open any dish to choose the size and toppings, and leave requests like “no onion” in the order comment.',
  },
  {
    q: 'Do you have vegetarian and gluten-free options?',
    a: 'Look for the “Veggie” tag. Any burger can be made with our chickpea & mushroom patty, and we offer a gluten-free bun on request.',
  },
  {
    q: 'How do I use a promo code?',
    a: 'Open your cart, enter the code in the “Promo code” field and tap “Apply”. Try FEELGOOD for 15% off your first order.',
  },
]

export const CONTACTS = {
  phone: '+39 02 8745 2210',
  phoneHref: 'tel:+390287452210',
  email: 'ciao@ember.it',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'TikTok', href: 'https://www.tiktok.com/' },
    { label: 'Tripadvisor', href: 'https://www.tripadvisor.com/' },
  ],
}

export const NAV = [
  { id: 'menu', label: 'Menu' },
  { id: 'offer', label: 'Deals' },
  { id: 'how', label: 'Delivery' },
  { id: 'app', label: 'App' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contacts', label: 'Visit us' },
]
