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
    <div style={{ padding: "2rem" }}>
      <h1>📦 My Orders</h1>
      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={styles.orderBox}>
            <h3>Order ID: {order.id}</h3>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Vendor:</strong> {order.vendorName}
            </p>
            <ul>
              {order.items.map((item, idx) => (
                <li key={idx} style={styles.item}>
                  <img src={item.image} alt={item.title} style={styles.image} />
                  <div>
                    <p>{item.title}</p>
                    <p>
                      {item.quantity} × ${item.price.toFixed(2)} = $
                      {(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p>
              <strong>Total:</strong>{" "}
              {order.totalPrice !== undefined
                ? `$${order.totalPrice.toFixed(2)}`
                : "N/A"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  orderBox: {
    border: "1px solid #ccc",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  item: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
  },
  image: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "4px",
  },
};
