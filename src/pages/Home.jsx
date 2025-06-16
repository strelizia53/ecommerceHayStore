import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard"; // 👈 import the component

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    };

    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      const categoryList = snapshot.docs.map((doc) => doc.data().name);
      setCategories(categoryList);
    };

    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === "" || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to HayStore 🛒</h1>
      <p style={styles.subtitle}>Your one-stop shop for everything you need.</p>

      {/* Search and Filter */}
      <div style={styles.filterRow}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={styles.dropdown}
        >
          <option value="">All Categories</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div style={styles.grid}>
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {filteredProducts.length === 0 && (
          <p style={{ width: "100%", marginTop: "2rem" }}>No products found.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
  },
  filterRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  search: {
    padding: "0.5rem",
    width: "250px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  dropdown: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  grid: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    flexWrap: "wrap",
  },
};
