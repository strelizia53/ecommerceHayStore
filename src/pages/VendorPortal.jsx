import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

export default function VendorPortal() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    images: [],
  });

  const [editId, setEditId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        loadProducts(u.uid);
      }
    });

    const loadCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      setCategories(snapshot.docs.map((doc) => doc.data().name));
    };

    loadCategories();
    return () => unsubscribe();
  }, []);

  const loadProducts = async (uid) => {
    const q = query(collection(db, "products"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      const selectedFiles = Array.from(files).slice(0, 5);
      setForm((prev) => ({ ...prev, images: selectedFiles }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;

    let imageUrls = [];

    if (form.images.length > 0) {
      for (let i = 0; i < form.images.length; i++) {
        const file = form.images[i];
        const imageRef = ref(
          storage,
          `product_images/${Date.now()}_${file.name}`
        );
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }
    }

    if (editId && existingImages.length > 0 && imageUrls.length === 0) {
      imageUrls = existingImages;
    }

    const productData = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      images: imageUrls,
      username: user.displayName || user.email,
      uid: user.uid,
    };

    if (editId) {
      await updateDoc(doc(db, "products", editId), productData);
      alert("Product updated!");
    } else {
      await addDoc(collection(db, "products"), productData);
      alert("Product added!");
    }

    setForm({
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      images: [],
    });
    setEditId(null);
    setExistingImages([]);
    loadProducts(user.uid);
  };

  const handleEdit = (product) => {
    setForm({ ...product, images: [] });
    setEditId(product.id);
    setExistingImages(product.images || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "products", id));
    loadProducts(user.uid);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🛠️ Vendor Portal</h1>

      <div style={styles.form}>
        <h2 style={styles.subHeader}>
          {editId ? "✏️ Edit Product" : "➕ Add New Product"}
        </h2>

        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          name="stock"
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          style={styles.input}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          style={styles.textarea}
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select Category</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          style={styles.input}
        />
        <p style={styles.hint}>You can upload up to 5 images.</p>

        <button onClick={handleAddProduct} style={styles.addBtn}>
          {editId ? "Update Product" : "Add Product"}
        </button>
      </div>

      <hr style={styles.divider} />

      <h2 style={styles.subHeader}>📦 My Products</h2>
      <div style={styles.grid}>
        {products.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Link to="/vendororders" style={styles.link}>
        📬 View My Orders
      </Link>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    maxWidth: "900px",
    margin: "auto",
  },
  header: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
  },
  form: {
    background: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    marginBottom: "2rem",
  },
  subHeader: {
    fontSize: "1.3rem",
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    resize: "vertical",
  },
  addBtn: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "0.8rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  hint: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "1rem",
  },
  divider: {
    margin: "2rem 0",
    borderTop: "1px solid #eee",
  },
  grid: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  link: {
    display: "block",
    marginTop: "2rem",
    fontSize: "1rem",
    textDecoration: "none",
    color: "#007bff",
  },
};
