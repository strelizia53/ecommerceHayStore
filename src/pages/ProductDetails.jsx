import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProduct(null);
      }
    };

    fetchProduct();
    return () => unsub();
  }, [id]);

  const handleAddToWishlist = async () => {
    if (!user || !product) return alert("Please log in first.");
    await setDoc(doc(db, "wishlists", `${user.uid}_${product.id}`), {
      uid: user.uid,
      productId: product.id,
      createdAt: serverTimestamp(),
    });
    alert("Added to wishlist!");
  };

  const handleAddToCart = async () => {
    if (!user || !product) return alert("Please log in first.");
    await addDoc(collection(db, "carts"), {
      uid: user.uid,
      productId: product.id,
      quantity: 1,
      createdAt: serverTimestamp(),
    });
    alert("Added to cart!");
  };

  if (!product)
    return <p style={{ padding: "2rem" }}>Loading or product not found...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <div style={styles.gallery}>
        {(product.images || [product.image]).map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${product.title} ${index + 1}`}
            style={styles.image}
          />
        ))}
      </div>
      <h1>{product.title}</h1>
      <p>
        <strong>Description:</strong>
      </p>
      <p>{product.description}</p>
      <p>
        <strong>Price:</strong> ${product.price}
      </p>
      <p>
        <strong>Stock:</strong> {product.stock}
      </p>
      <p>
        <strong>Category:</strong> {product.category}
      </p>
      <p>
        <strong>Seller:</strong> {product.username}
      </p>

      {/* Action Buttons */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button onClick={handleAddToWishlist}>💖 Add to Wishlist</button>
        <button onClick={handleAddToCart}>🛒 Add to Cart</button>
      </div>
    </div>
  );
}

const styles = {
  gallery: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    overflowX: "auto",
  },
  image: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
  },
};
