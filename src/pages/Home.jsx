import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard";

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
    <div style={styles.page}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Welcome to HayStore 🛒</h1>
          <p style={styles.heroSubtitle}>Shop smart. Live stylishly.</p>

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
        </div>
      </div>

      {/* Product Grid */}
      <div style={styles.gridWrapper}>
        <h2 style={styles.sectionHeading}>Featured Products</h2>
        <div style={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {filteredProducts.length === 0 && (
            <p style={styles.noProducts}>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fff",
    color: "#111",
  },
  hero: {
    backgroundImage: `url('https://images.pexels.com/photos/19691166/pexels-photo-19691166.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "80vh",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
    position: "relative",
  },
  heroContent: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "2rem",
    borderRadius: "10px",
    maxWidth: "700px",
    width: "100%",
  },
  heroTitle: {
    fontSize: "2.8rem",
    marginBottom: "0.5rem",
    fontWeight: "bold",
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    color: "#eee",
  },
  filterRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  search: {
    padding: "0.6rem 1rem",
    width: "260px",
    border: "1px solid #fff",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#000",
    fontSize: "1rem",
  },
  dropdown: {
    padding: "0.6rem 1rem",
    border: "1px solid #fff",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#000",
    fontSize: "1rem",
  },
  gridWrapper: {
    padding: "3rem 2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionHeading: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#000",
  },
  grid: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    flexWrap: "wrap",
  },
  noProducts: {
    width: "100%",
    textAlign: "center",
    marginTop: "2rem",
    fontSize: "1rem",
    color: "#666",
  },
};
