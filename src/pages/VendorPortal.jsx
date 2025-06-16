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
import ProductCard from "../components/ProductCard"; // <-- Import shared component

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
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "products", id));
    loadProducts(user.uid);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Vendor Portal</h1>

      <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
      />
      <input
        name="price"
        placeholder="Price"
        type="number"
        value={form.price}
        onChange={handleChange}
      />
      <input
        name="stock"
        placeholder="Stock"
        type="number"
        value={form.stock}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />
      <select name="category" value={form.category} onChange={handleChange}>
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
      />
      <p style={{ fontSize: "0.9rem", color: "gray" }}>
        You can upload up to 5 images.
      </p>
      <button onClick={handleAddProduct}>
        {editId ? "Update" : "Add"} Product
      </button>

      <hr />

      <h2>My Products</h2>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {products.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
