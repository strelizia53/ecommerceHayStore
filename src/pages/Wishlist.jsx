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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchWishlist(u.uid);
      }
    });

    return () => unsub();
  }, []);

  const fetchWishlist = async (uid) => {
    setLoading(true);
    const q = query(collection(db, "wishlists"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const items = [];

    for (const docSnap of snapshot.docs) {
      const { productId } = docSnap.data();
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        items.push({
          id: docSnap.id,
          productId,
          ...productSnap.data(),
        });
      }
    }

    setWishlist(items);
    setLoading(false);
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    const docId = `${user.uid}_${productId}`;
    await deleteDoc(doc(db, "wishlists", docId));
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (!user)
    return <p style={styles.message}>Please log in to view your wishlist.</p>;

  if (loading) return <p style={styles.message}>Loading wishlist...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💖 Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <p style={styles.message}>No items in your wishlist.</p>
      ) : (
        <div style={styles.grid}>
          {wishlist.map((item) => (
            <div key={item.productId} style={styles.card}>
              <Link to={`/product/${item.productId}`} style={styles.link}>
                <img
                  src={item.images?.[0] || item.image}
                  alt={item.title}
                  style={styles.img}
                />
                <h3 style={styles.productTitle}>{item.title}</h3>
                <p style={styles.price}>${item.price.toFixed(2)}</p>
              </Link>
              <button
                onClick={() => removeFromWishlist(item.productId)}
                style={styles.removeBtn}
              >
                ❌ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    maxWidth: "1100px",
    margin: "auto",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
  },
  message: {
    fontSize: "1rem",
    padding: "2rem",
    color: "#666",
  },
  grid: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  card: {
    width: "220px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    padding: "1rem",
    textAlign: "center",
    transition: "transform 0.2s ease",
  },
  link: {
    textDecoration: "none",
    color: "#000",
  },
  img: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "0.5rem",
  },
  productTitle: {
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.3rem",
  },
  price: {
    fontSize: "0.95rem",
    color: "#555",
  },
  removeBtn: {
    marginTop: "0.75rem",
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "0.4rem 0.8rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};
