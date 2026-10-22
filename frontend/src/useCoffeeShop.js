import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PRODUCTS } from "./data";

const STORAGE_KEY = "drift-coffee-kiosk-data";
const CHANNEL_NAME = "drift-coffee-kiosk-sync";

const createInitialData = () => ({
  products: DEFAULT_PRODUCTS,
  orders: [],
  updatedAt: new Date().toISOString(),
});

const readStoredData = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) return createInitialData();

    const parsedData = JSON.parse(storedData);

    if (!Array.isArray(parsedData.products) || !Array.isArray(parsedData.orders)) {
      return createInitialData();
    }

    return parsedData;
  } catch {
    return createInitialData();
  }
};

export function useCoffeeShop() {
  const [data, setData] = useState(readStoredData);
  const channelRef = useRef(null);

  useEffect(() => {
    const receiveStorageUpdate = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;

      try {
        setData(JSON.parse(event.newValue));
      } catch {
        // Ignore damaged data and keep the most recent valid state in memory.
      }
    };

    window.addEventListener("storage", receiveStorageUpdate);

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (event) => setData(event.data);
    }

    return () => {
      window.removeEventListener("storage", receiveStorageUpdate);
      channelRef.current?.close();
    };
  }, []);

  const save = useCallback((nextData) => {
    const stampedData = {
      ...nextData,
      updatedAt: new Date().toISOString(),
    };

    setData(stampedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stampedData));
    channelRef.current?.postMessage(stampedData);
  }, []);

  const placeOrder = useCallback(
    (items) => {
      const order = {
        id: crypto.randomUUID(),
        queueNumber: String(Math.floor(100 + Math.random() * 900)),
        createdAt: new Date().toISOString(),
        status: "new",
        items,
        total: items.reduce((total, item) => total + item.lineTotal, 0),
      };

      save({ ...data, orders: [order, ...data.orders] });

      return order;
    },
    [data, save],
  );

  const updateOrderStatus = useCallback(
    (orderId, status) => {
      save({
        ...data,
        orders: data.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      });
    },
    [data, save],
  );

  const saveProduct = useCallback(
    (product) => {
      const isExistingProduct = data.products.some(
        (currentProduct) => currentProduct.id === product.id,
      );

      const products = isExistingProduct
        ? data.products.map((currentProduct) =>
            currentProduct.id === product.id ? product : currentProduct,
          )
        : [...data.products, product];

      save({ ...data, products });
    },
    [data, save],
  );

  const deleteProduct = useCallback(
    (productId) => {
      save({
        ...data,
        products: data.products.filter((product) => product.id !== productId),
      });
    },
    [data, save],
  );

  return {
    products: data.products,
    orders: data.orders,
    placeOrder,
    updateOrderStatus,
    saveProduct,
    deleteProduct,
  };
}
