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
      const { productId, quantity = 1 } = docSnap.data();
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        items.push({
          id: docSnap.id,
          productId,
          cartId: docSnap.id,
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
      const newQty = Math.min(
        Math.max((prev[productId] || 1) + change, 1),
        cartItems.find((i) => i.productId === productId)?.stock || 1
      );
      return { ...prev, [productId]: newQty };
    });
  };

  const removeFromCart = async (productId) => {
    if (!user) return;

    const docId = `${user.uid}_${productId}`;
    await deleteDoc(doc(db, "carts", docId));
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    setQuantities((prev) => {
      const newQty = { ...prev };
      delete newQty[productId];
      return newQty;
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
      orderDate: Timestamp.now(), // Firestore-friendly date
    };

    await setDoc(doc(db, "orders", orderId), order);

    for (const item of items) {
      await deleteDoc(doc(db, "carts", `${buyerId}_${item.productId}`));
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
    <div style={{ padding: "2rem" }}>
      <h1>🛒 Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>No items in your cart.</p>
      ) : (
        <>
          {Object.entries(groupedByVendor).map(([vendorId, items]) => (
            <div key={vendorId} style={{ marginBottom: "2rem" }}>
              <h2>Vendor: {items[0].username}</h2>
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
                      <p>${item.price}</p>
                    </Link>
                    <div style={{ margin: "0.5rem 0" }}>
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        -
                      </button>{" "}
                      {quantities[item.productId] || 1}{" "}
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
              <button
                onClick={() => placeOrder(vendorId, items)}
                style={styles.orderBtn}
              >
                ✅ Place Order for {items.length} item(s)
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
    marginTop: "1.5rem",
  },
  card: {
    border: "1px solid #ccc",
    padding: "1rem",
    borderRadius: "8px",
    width: "220px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  img: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "0.5rem",
  },
  removeBtn: {
    marginTop: "0.5rem",
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "5px",
    cursor: "pointer",
  },
  orderBtn: {
    marginTop: "1rem",
    background: "#28a745",
    color: "white",
    padding: "0.6rem 1rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
