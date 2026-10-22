export const SIZES = [
  { name: "Small", multiplier: 1 },
  { name: "Medium", multiplier: 1.25 },
  { name: "Large", multiplier: 1.5 },
];

export const ORDER_STATUSES = ["new", "preparing", "ready", "completed"];

export const DEFAULT_PRODUCTS = [
  {
    id: "espresso",
    name: "Espresso",
    description: "Rich, focused, and beautifully simple.",
    price: 110,
    emoji: "☕",
    accent: "#d58a55",
    image: "",
  },
  {
    id: "americano",
    name: "Americano",
    description: "Espresso mellowed with hot water.",
    price: 125,
    emoji: "🫘",
    accent: "#8b6248",
    image: "",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Velvety milk foam with a bold espresso base.",
    price: 155,
    emoji: "☁️",
    accent: "#be8b67",
    image: "",
  },
  {
    id: "latte",
    name: "Cafe Latte",
    description: "Silky steamed milk and balanced espresso.",
    price: 165,
    emoji: "🥛",
    accent: "#d9a58c",
    image: "",
  },
  {
    id: "mocha",
    name: "Dark Mocha",
    description: "Chocolatey, smooth, and deeply comforting.",
    price: 180,
    emoji: "🍫",
    accent: "#724339",
    image: "",
  },
  {
    id: "matcha",
    name: "Matcha Latte",
    description: "Earthy ceremonial matcha with creamy milk.",
    price: 175,
    emoji: "🍵",
    accent: "#8ba46c",
    image: "",
  },
];

export const createEmptyProduct = () => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  price: 0,
  emoji: "☕",
  accent: "#d58a55",
  image: "",
});
