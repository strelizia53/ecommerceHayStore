import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function Cart() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchCart(u.uid);
      }
    });
    return () => unsub();
  }, []);

  const fetchCart = async (uid) => {
    setLoading(true);
    const q = query(collection(db, "carts"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const items = [];
    const qty = {};

    for (const docSnap of snapshot.docs) {
      const cartId = docSnap.id;
      const { productId, quantity = 1 } = docSnap.data();
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        items.push({
          id: cartId,
          productId,
          cartId,
          ...data,
        });
        qty[productId] = quantity;
      }
    }

    setCartItems(items);
    setQuantities(qty);
    setLoading(false);
  };

  const updateQuantity = (productId, change) => {
    setQuantities((prev) => {
      const currentQty = prev[productId] || 1;
      const stock =
        cartItems.find((i) => i.productId === productId)?.stock || 1;
      const newQty = Math.min(Math.max(currentQty + change, 1), stock);
      return { ...prev, [productId]: newQty };
    });
  };

  const removeFromCart = async (productId) => {
    if (!user) return;
    const cartItem = cartItems.find((item) => item.productId === productId);
    if (!cartItem) return;

    await deleteDoc(doc(db, "carts", cartItem.cartId));
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    setQuantities((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const placeOrder = async (vendorId, items) => {
    const orderId = uuidv4();
    const buyerId = user.uid;

    const orderItems = items.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: quantities[item.productId],
      price: item.price,
      image: item.images?.[0] || item.image || "",
      subtotal: item.price * quantities[item.productId],
    }));

    const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = {
      orderId,
      buyerId,
      vendorId,
      items: orderItems,
      totalPrice,
      status: "Pending",
      orderDate: Timestamp.now(),
    };

    await setDoc(doc(db, "orders", orderId), order);

    for (const item of items) {
      await deleteDoc(doc(db, "carts", item.cartId));
    }

    fetchCart(buyerId);
    alert("Order placed successfully!");
  };

  if (!user)
    return <p style={{ padding: "2rem" }}>Please log in to view your cart.</p>;

  if (loading) return <p style={{ padding: "2rem" }}>Loading cart...</p>;

  const groupedByVendor = cartItems.reduce((acc, item) => {
    const vendorId = item.uid;
    if (!acc[vendorId]) acc[vendorId] = [];
    acc[vendorId].push(item);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🛒 Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>No items in your cart.</p>
      ) : (
        Object.entries(groupedByVendor).map(([vendorId, items]) => {
          const total = items.reduce(
            (sum, item) => sum + (quantities[item.productId] || 1) * item.price,
            0
          );

          return (
            <div key={vendorId} style={styles.vendorBlock}>
              <h2 style={styles.vendorName}>Vendor: {items[0].username}</h2>
              <div style={styles.grid}>
                {items.map((item) => (
                  <div key={item.productId} style={styles.card}>
                    <Link
                      to={`/product/${item.productId}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.title}
                        style={styles.img}
                      />
                      <h3>{item.title}</h3>
                      <p>${item.price.toFixed(2)}</p>
                    </Link>
                    <div style={styles.quantityControls}>
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        -
                      </button>
                      <span style={{ margin: "0 1rem" }}>
                        {quantities[item.productId] || 1}
                      </span>
                      <button onClick={() => updateQuantity(item.productId, 1)}>
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={styles.removeBtn}
                    >
                      ❌ Remove
                    </button>
                  </div>
                ))}
              </div>
              <div style={styles.footer}>
                <p style={styles.totalText}>
                  🧾 Total: <strong>${total.toFixed(2)}</strong>
                </p>
                <button
                  onClick={() => placeOrder(vendorId, items)}
                  style={styles.orderBtn}
                >
                  ✅ Place Order for {items.length} item(s)
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "2rem",
  },
  vendorBlock: {
    marginBottom: "3rem",
  },
  vendorName: {
    fontSize: "1.2rem",
    marginBottom: "1rem",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  card: {
    border: "1px solid #ddd",
    padding: "1rem",
    borderRadius: "10px",
    width: "220px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
    background: "#fff",
  },
  img: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "0.5rem",
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "0.5rem",
  },
  removeBtn: {
    marginTop: "0.5rem",
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
  },
  orderBtn: {
    marginTop: "1rem",
    background: "#000",
    color: "#fff",
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  footer: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: "1rem",
    borderRadius: "8px",
  },
  totalText: {
    fontSize: "1rem",
    color: "#222",
  },
};
