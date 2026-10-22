import { useMemo, useState } from "react";
import { ORDER_STATUSES, SIZES, createEmptyProduct } from "./data";
import { useCoffeeShop } from "./useCoffeeShop";
import {
  calculateSales,
  formatCurrency,
  formatDateTime,
  formatTime,
  getOrderCount,
} from "./utils";

const STATUS_COPY = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

const STATUS_ACTIONS = {
  new: { label: "Start preparing", next: "preparing" },
  preparing: { label: "Mark ready", next: "ready" },
  ready: { label: "Complete order", next: "completed" },
};

export default function App() {
  const coffeeShop = useCoffeeShop();
  const [activePage, setActivePage] = useState("order");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);

  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (product, size, quantity) => {
    const selectedSize = SIZES.find((option) => option.name === size);
    const unitPrice = Number((product.price * selectedSize.multiplier).toFixed(2));
    const cartItem = {
      cartId: product.id + "-" + size,
      productId: product.id,
      name: product.name,
      size,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };

    setCart((currentCart) => {
      const matchedItem = currentCart.find((item) => item.cartId === cartItem.cartId);

      if (!matchedItem) return [...currentCart, cartItem];

      return currentCart.map((item) =>
        item.cartId === cartItem.cartId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              lineTotal: item.unitPrice * (item.quantity + quantity),
            }
          : item,
      );
    });

    setSelectedProduct(null);
  };

  const changeCartQuantity = (cartId, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.cartId !== cartId) return item;

          const quantity = item.quantity + amount;
          return { ...item, quantity, lineTotal: item.unitPrice * quantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const placeOrder = () => {
    if (!cart.length) return;

    const order = coffeeShop.placeOrder(cart);
    setLatestOrder(order);
    setCart([]);
    setActivePage("queue");
  };

  return (
    <main className="app-shell">
      <Header
        activePage={activePage}
        cartQuantity={cartQuantity}
        onNavigate={setActivePage}
      />

      <section className="page-content">
        {activePage === "order" && (
          <OrderingPage
            cart={cart}
            onChangeQuantity={changeCartQuantity}
            onOpenProduct={setSelectedProduct}
            onPlaceOrder={placeOrder}
            products={coffeeShop.products}
          />
        )}

        {activePage === "queue" && (
          <QueuePage
            latestOrder={latestOrder}
            onUpdateOrder={coffeeShop.updateOrderStatus}
            orders={coffeeShop.orders}
          />
        )}

        {activePage === "admin" && (
          <AdminPage
            onDeleteProduct={coffeeShop.deleteProduct}
            onSaveProduct={coffeeShop.saveProduct}
            onUpdateOrder={coffeeShop.updateOrderStatus}
            orders={coffeeShop.orders}
            products={coffeeShop.products}
          />
        )}
      </section>

      {selectedProduct && (
        <ProductDialog
          product={selectedProduct}
          onAdd={addToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}

function Header({ activePage, cartQuantity, onNavigate }) {
  const navigation = [
    { id: "order", label: "Order" },
    { id: "queue", label: "Order queue" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate("order")}>
        <span className="brand-mark">D</span>
        <span>
          <strong>Drift Coffee</strong>
          <small>kiosk &amp; counter</small>
        </span>
      </button>

      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            className={activePage === item.id ? "nav-link active" : "nav-link"}
            key={item.id}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
            {item.id === "order" && cartQuantity > 0 && (
              <span className="cart-badge">{cartQuantity}</span>
            )}
          </button>
        ))}
      </nav>

      <span className="sync-indicator" title="Changes sync with other open kiosk tabs">
        <i /> Local sync on
      </span>
    </header>
  );
}

function OrderingPage({
  cart,
  onChangeQuantity,
  onOpenProduct,
  onPlaceOrder,
  products,
}) {
  const cartTotal = cart.reduce((total, item) => total + item.lineTotal, 0);

  return (
    <div className="order-layout">
      <section>
        <div className="page-intro">
          <p className="eyebrow">ORDER AT YOUR PACE</p>
          <h1>What are you in the mood for?</h1>
          <p>Choose a drink, then make it just the right size for you.</p>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <button
              className="product-card"
              key={product.id}
              onClick={() => onOpenProduct(product)}
            >
              <ProductVisual product={product} />
              <span className="product-copy">
                <strong>{product.name}</strong>
                <small>{product.description}</small>
              </span>
              <span className="product-footer">
                <b>from {formatCurrency(product.price)}</b>
                <span className="add-circle">+</span>
              </span>
            </button>
          ))}
        </div>

        {!products.length && (
          <EmptyState
            title="Your menu is empty"
            copy="Add drinks from the Admin page to start taking orders."
          />
        )}
      </section>

      <aside className="cart-panel">
        <div className="cart-heading">
          <div>
            <p className="eyebrow">YOUR ORDER</p>
            <h2>Basket</h2>
          </div>
          <span>{cart.length} items</span>
        </div>

        {cart.length ? (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <article className="cart-item" key={item.cartId}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.size} · {formatCurrency(item.unitPrice)} each</small>
                  </div>
                  <div className="quantity-stepper" aria-label={"Quantity for " + item.name}>
                    <button onClick={() => onChangeQuantity(item.cartId, -1)}>-</button>
                    <b>{item.quantity}</b>
                    <button onClick={() => onChangeQuantity(item.cartId, 1)}>+</button>
                  </div>
                  <b>{formatCurrency(item.lineTotal)}</b>
                </article>
              ))}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>
            <button className="primary-button checkout-button" onClick={onPlaceOrder}>
              Place order <span>→</span>
            </button>
          </>
        ) : (
          <div className="empty-cart">
            <span>☕</span>
            <strong>Your basket is waiting.</strong>
            <p>Select a drink to get started.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ProductDialog({ product, onAdd, onClose }) {
  const [size, setSize] = useState("Medium");
  const [quantity, setQuantity] = useState(1);
  const selectedSize = SIZES.find((option) => option.name === size);
  const itemPrice = product.price * selectedSize.multiplier;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby="drink-title"
        className="product-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="close-button" aria-label="Close drink options" onClick={onClose}>×</button>
        <ProductVisual product={product} large />
        <div className="dialog-copy">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2 id="drink-title">{product.name}</h2>
          <p>{product.description}</p>

          <div className="option-group">
            <span>Size</span>
            <div className="size-options">
              {SIZES.map((option) => (
                <button
                  className={size === option.name ? "size-option selected" : "size-option"}
                  key={option.name}
                  onClick={() => setSize(option.name)}
                >
                  <b>{option.name}</b>
                  <small>{formatCurrency(product.price * option.multiplier)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="dialog-footer">
            <div className="quantity-stepper large" aria-label="Drink quantity">
              <button disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}>-</button>
              <b>{quantity}</b>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="primary-button" onClick={() => onAdd(product, size, quantity)}>
              Add · {formatCurrency(itemPrice * quantity)}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function QueuePage({ latestOrder, onUpdateOrder, orders }) {
  const [filter, setFilter] = useState("active");
  const visibleOrders = orders.filter((order) =>
    filter === "active" ? order.status !== "completed" : order.status === filter,
  );

  return (
    <div className="queue-page">
      <div className="page-intro queue-intro">
        <div>
          <p className="eyebrow">LIVE ORDER QUEUE</p>
          <h1>Every order, in one calm place.</h1>
          <p>Customers can check their number here while the team moves drinks along.</p>
        </div>
        <div className="queue-count">
          <strong>{orders.filter((order) => order.status !== "completed").length}</strong>
          <span>open orders</span>
        </div>
      </div>

      {latestOrder && (
        <section className="order-confirmation">
          <div>
            <span className="confirmation-icon">✓</span>
            <div>
              <p>Your order is in the queue</p>
              <strong>Order #{latestOrder.queueNumber}</strong>
            </div>
          </div>
          <span>We'll start on it shortly.</span>
        </section>
      )}

      <div className="queue-toolbar">
        <div className="segmented-control" aria-label="Queue filter">
          <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>
            Active
          </button>
          {ORDER_STATUSES.map((status) => (
            <button
              className={filter === status ? "active" : ""}
              key={status}
              onClick={() => setFilter(status)}
            >
              {STATUS_COPY[status]}
            </button>
          ))}
        </div>
        <p>Staff can update status directly on each order.</p>
      </div>

      <div className="queue-grid">
        {visibleOrders.map((order) => (
          <OrderCard key={order.id} onUpdateOrder={onUpdateOrder} order={order} />
        ))}
      </div>

      {!visibleOrders.length && (
        <EmptyState
          title="Nothing in this view yet"
          copy="New orders placed at the kiosk will appear here instantly."
        />
      )}
    </div>
  );
}

function OrderCard({ onUpdateOrder, order }) {
  const action = STATUS_ACTIONS[order.status];

  return (
    <article className={"order-card status-" + order.status}>
      <div className="order-card-heading">
        <div>
          <span className="order-number">#{order.queueNumber}</span>
          <small>{formatTime(order.createdAt)}</small>
        </div>
        <span className={"status-pill " + order.status}>{STATUS_COPY[order.status]}</span>
      </div>

      <ul className="order-line-items">
        {order.items.map((item) => (
          <li key={item.cartId}>
            <span>{item.quantity}× {item.name} <small>{item.size}</small></span>
            <b>{formatCurrency(item.lineTotal)}</b>
          </li>
        ))}
      </ul>

      <div className="order-card-total">
        <span>Total</span>
        <strong>{formatCurrency(order.total)}</strong>
      </div>

      {action ? (
        <button
          className="secondary-button order-action"
          onClick={() => onUpdateOrder(order.id, action.next)}
        >
          {action.label} <span>→</span>
        </button>
      ) : (
        <p className="completed-note">This order is complete.</p>
      )}
    </article>
  );
}

function AdminPage({
  onDeleteProduct,
  onSaveProduct,
  onUpdateOrder,
  orders,
  products,
}) {
  const [editingProduct, setEditingProduct] = useState(null);
  const sales = useMemo(
    () => ({
      day: calculateSales(orders, "day"),
      week: calculateSales(orders, "week"),
      month: calculateSales(orders, "month"),
    }),
    [orders],
  );

  const startEditing = (product) => setEditingProduct({ ...product });

  const handleSave = (event) => {
    event.preventDefault();

    if (!editingProduct.name.trim() || Number(editingProduct.price) <= 0) return;

    onSaveProduct({
      ...editingProduct,
      name: editingProduct.name.trim(),
      description: editingProduct.description.trim(),
      price: Number(editingProduct.price),
    });
    setEditingProduct(null);
  };

  const updateEditingField = (field, value) => {
    setEditingProduct((currentProduct) => ({
      ...currentProduct,
      [field]: value,
    }));
  };

  const handlePhotoUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateEditingField("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="admin-page">
      <div className="page-intro admin-intro">
        <div>
          <p className="eyebrow">OWNER DASHBOARD</p>
          <h1>Good coffee, clear numbers.</h1>
          <p>Manage the menu and keep an eye on your sales without leaving the kiosk.</p>
        </div>
        <button className="primary-button" onClick={() => setEditingProduct(createEmptyProduct())}>
          + Add a drink
        </button>
      </div>

      <section className="sales-grid" aria-label="Sales overview">
        <SalesCard label="Today" value={sales.day} orders={getOrderCount(orders, "day")} />
        <SalesCard label="This week" value={sales.week} orders={getOrderCount(orders, "week")} />
        <SalesCard label="This month" value={sales.month} orders={getOrderCount(orders, "month")} />
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MENU MANAGEMENT</p>
            <h2>Your drinks</h2>
          </div>
          <span>{products.length} on the menu</span>
        </div>

        <div className="admin-menu-grid">
          {products.map((product) => (
            <article className="admin-product" key={product.id}>
              <ProductVisual product={product} />
              <div>
                <strong>{product.name}</strong>
                <p>{product.description}</p>
                <b>from {formatCurrency(product.price)}</b>
              </div>
              <button className="text-button" onClick={() => startEditing(product)}>Edit</button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENT SALES</p>
            <h2>Orders</h2>
          </div>
          <span>{orders.length} total orders</span>
        </div>

        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Items</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 12).map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.queueNumber}</strong></td>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td>{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                  <td><span className={"status-pill " + order.status}>{STATUS_COPY[order.status]}</span></td>
                  <td><strong>{formatCurrency(order.total)}</strong></td>
                  <td>
                    {STATUS_ACTIONS[order.status] && (
                      <button
                        className="table-action"
                        onClick={() => onUpdateOrder(order.id, STATUS_ACTIONS[order.status].next)}
                      >
                        {STATUS_ACTIONS[order.status].label}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && <p className="table-empty">Orders will appear here after the first sale.</p>}
        </div>
      </section>

      {editingProduct && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setEditingProduct(null)}>
          <form
            aria-labelledby="product-editor-title"
            className="product-editor"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="editor-heading">
              <div>
                <p className="eyebrow">MENU ITEM</p>
                <h2 id="product-editor-title">
                  {products.some((product) => product.id === editingProduct.id)
                    ? "Edit drink"
                    : "Add drink"}
                </h2>
              </div>
              <button className="close-button" type="button" onClick={() => setEditingProduct(null)}>×</button>
            </div>

            <label>
              Drink name
              <input
                autoFocus
                onChange={(event) => updateEditingField("name", event.target.value)}
                required
                value={editingProduct.name}
              />
            </label>
            <label>
              Description
              <textarea
                onChange={(event) => updateEditingField("description", event.target.value)}
                rows="3"
                value={editingProduct.description}
              />
            </label>
            <div className="field-row">
              <label>
                Base price (PHP)
                <input
                  min="1"
                  onChange={(event) => updateEditingField("price", event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={editingProduct.price}
                />
              </label>
              <label>
                Emoji fallback
                <input
                  maxLength="3"
                  onChange={(event) => updateEditingField("emoji", event.target.value)}
                  value={editingProduct.emoji}
                />
              </label>
              <label>
                Accent color
                <input
                  onChange={(event) => updateEditingField("accent", event.target.value)}
                  type="color"
                  value={editingProduct.accent}
                />
              </label>
            </div>
            <label>
              Photo URL
              <input
                onChange={(event) => updateEditingField("image", event.target.value)}
                placeholder="https://..."
                type="url"
                value={editingProduct.image}
              />
            </label>
            <label className="upload-field">
              Or upload a product photo
              <input accept="image/*" onChange={handlePhotoUpload} type="file" />
            </label>

            <div className="editor-actions">
              {products.some((product) => product.id === editingProduct.id) && (
                <button
                  className="danger-button"
                  onClick={() => {
                    onDeleteProduct(editingProduct.id);
                    setEditingProduct(null);
                  }}
                  type="button"
                >
                  Remove drink
                </button>
              )}
              <span />
              <button className="secondary-button" onClick={() => setEditingProduct(null)} type="button">
                Cancel
              </button>
              <button className="primary-button" type="submit">Save drink</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SalesCard({ label, orders, value }) {
  return (
    <article className="sales-card">
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
      <small>{orders} {orders === 1 ? "order" : "orders"}</small>
    </article>
  );
}

function ProductVisual({ large = false, product }) {
  const className = large ? "product-visual large" : "product-visual";

  return (
    <div className={className} style={{ "--accent": product.accent || "#d58a55" }}>
      {product.image ? (
        <img alt={product.name} src={product.image} />
      ) : (
        <span aria-hidden="true">{product.emoji || "☕"}</span>
      )}
    </div>
  );
}

function EmptyState({ copy, title }) {
  return (
    <div className="empty-state">
      <span>✦</span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}
