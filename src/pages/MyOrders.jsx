import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchOrders(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchOrders = async (uid) => {
    setLoading(true);
    const q = query(collection(db, "orders"), where("buyerId", "==", uid));
    const snapshot = await getDocs(q);
    const fetchedOrders = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const vendorRef = doc(db, "users", data.vendorId);
      const vendorSnap = await getDoc(vendorRef);
      const vendorName = vendorSnap.exists()
        ? vendorSnap.data().username
        : "Unknown Vendor";

      fetchedOrders.push({
        id: docSnap.id,
        ...data,
        vendorName,
      });
    }

    setOrders(fetchedOrders);
    setLoading(false);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading orders...</p>;

  if (!user)
    return (
      <p style={{ padding: "2rem" }}>Please log in to view your orders.</p>
    );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📦 My Orders</h1>
      {orders.length === 0 ? (
        <p style={styles.empty}>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={styles.orderBox}>
            <div style={styles.orderHeader}>
              <h3 style={styles.orderId}>Order #{order.id}</h3>
              <p style={styles.status}>
                <strong>Status:</strong> {order.status}
              </p>
              <p style={styles.vendor}>
                <strong>Vendor:</strong> {order.vendorName}
              </p>
            </div>

            <ul style={styles.itemList}>
              {order.items.map((item, idx) => (
                <li key={idx} style={styles.item}>
                  <img src={item.image} alt={item.title} style={styles.image} />
                  <div>
                    <p style={styles.itemTitle}>{item.title}</p>
                    <p style={styles.itemPrice}>
                      {item.quantity} × ${item.price.toFixed(2)} = $
                      {(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div style={styles.totalSection}>
              <p>
                <strong>Total:</strong>{" "}
                {order.totalPrice !== undefined
                  ? `$${order.totalPrice.toFixed(2)}`
                  : "N/A"}
              </p>
              <p style={styles.date}>
                <strong>Date:</strong>{" "}
                {order.orderDate?.toDate
                  ? order.orderDate.toDate().toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 600,
    marginBottom: "2rem",
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    fontSize: "1rem",
    color: "#666",
  },
  orderBox: {
    border: "1px solid #e0e0e0",
    padding: "1.5rem",
    borderRadius: "10px",
    marginBottom: "2rem",
    backgroundColor: "#fafafa",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  orderHeader: {
    marginBottom: "1rem",
  },
  orderId: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
  },
  status: {
    fontSize: "0.95rem",
    marginBottom: "0.3rem",
  },
  vendor: {
    fontSize: "0.95rem",
  },
  itemList: {
    listStyle: "none",
    padding: 0,
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  item: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
    backgroundColor: "#fff",
    padding: "0.8rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  image: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "6px",
  },
  itemTitle: {
    fontSize: "1rem",
    fontWeight: 500,
  },
  itemPrice: {
    fontSize: "0.9rem",
    color: "#555",
  },
  totalSection: {
    marginTop: "1rem",
    fontSize: "1rem",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  date: {
    fontSize: "0.9rem",
    color: "#777",
  },
};
