export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export const formatTime = (date) =>
  new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const getRangeStart = (range) => {
  const now = new Date();

  if (range === "day") return startOfDay(now);

  if (range === "week") {
    const result = startOfDay(now);
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const calculateSales = (orders, range) => {
  const rangeStart = getRangeStart(range);

  return orders
    .filter((order) => order.status !== "cancelled")
    .filter((order) => new Date(order.createdAt) >= rangeStart)
    .reduce((total, order) => total + order.total, 0);
};

export const getOrderCount = (orders, range) => {
  const rangeStart = getRangeStart(range);

  return orders.filter(
    (order) =>
      order.status !== "cancelled" && new Date(order.createdAt) >= rangeStart,
  ).length;
};
