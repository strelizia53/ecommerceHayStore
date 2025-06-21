import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));

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

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const allProducts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.id !== id);

      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      setSimilarProducts(shuffled.slice(0, 4));
    };

    fetchSimilarProducts();
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

  // Just use the first image if available
  const productImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || "";

  return (
    <div style={styles.container}>
      <div style={styles.productSection}>
        {/* Product Image */}
        <div style={styles.imageContainer}>
          <img src={productImage} alt="Product" style={styles.productImage} />
        </div>

        {/* Product Details */}
        <div style={styles.details}>
          <h1>{product.title}</h1>
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

          <div style={styles.actions}>
            <button onClick={handleAddToWishlist} style={styles.wishlistBtn}>
              💖 Wishlist
            </button>
            <button onClick={handleAddToCart} style={styles.cartBtn}>
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <div style={styles.similarSection}>
        <h2 style={styles.similarTitle}>🛍️ Similar Products</h2>
        <div style={styles.similarGrid}>
          {similarProducts.map((prod) => (
            <Link to={`/product/${prod.id}`} key={prod.id} style={styles.card}>
              <img
                src={prod.images?.[0] || prod.image}
                alt={prod.title}
                style={styles.cardImage}
              />
              <p style={styles.cardTitle}>{prod.title}</p>
              <p style={styles.cardPrice}>${prod.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    maxWidth: "1200px",
    margin: "auto",
  },
  productSection: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginBottom: "3rem",
  },
  imageContainer: {
    flex: 1,
    minWidth: "300px",
  },
  productImage: {
    width: "100%",
    height: "500px",
    objectFit: "cover",
    borderRadius: "10px",
  },
  details: {
    flex: 1,
    minWidth: "300px",
  },
  actions: {
    marginTop: "1.5rem",
    display: "flex",
    gap: "1rem",
  },
  wishlistBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f06292",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  cartBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  similarSection: {
    marginTop: "3rem",
  },
  similarTitle: {
    fontSize: "1.6rem",
    marginBottom: "1rem",
  },
  similarGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  card: {
    width: "200px",
    backgroundColor: "#fafafa",
    padding: "1rem",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#000",
    border: "1px solid #eee",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  cardImage: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "0.5rem",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 500,
  },
  cardPrice: {
    fontSize: "0.9rem",
    color: "#555",
  },
};
