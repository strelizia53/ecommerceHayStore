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
    return (
      <p style={{ padding: "2rem" }}>Please log in to view your wishlist.</p>
    );

  if (loading) return <p style={{ padding: "2rem" }}>Loading wishlist...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Your Wishlist 💖</h1>
      {wishlist.length === 0 ? (
        <p>No items in your wishlist.</p>
      ) : (
        <div style={styles.grid}>
          {wishlist.map((item) => (
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
};
