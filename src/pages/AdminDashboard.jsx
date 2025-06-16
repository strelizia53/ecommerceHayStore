import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ProductCard from "../components/ProductCard";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editCategory, setEditCategory] = useState({ id: "", name: "" });

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };

    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      const catList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(catList);
    };

    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    };

    fetchUsers();
    fetchCategories();
    fetchProducts();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await addDoc(collection(db, "categories"), { name: newCategory });
    setNewCategory("");
  };

  const handleDeleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
  };

  const startEdit = (cat) => {
    setEditCategory(cat);
  };

  const handleSaveEdit = async () => {
    if (!editCategory.name.trim()) return;
    await updateDoc(doc(db, "categories", editCategory.id), {
      name: editCategory.name,
    });
    setEditCategory({ id: "", name: "" });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Admin Dashboard</h1>

      <section style={styles.section}>
        <h2 style={styles.subheading}>📋 All Users</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>User Type</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.userType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subheading}>🗂️ Manage Categories</h2>
        <div style={styles.categoryForm}>
          <input
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleAddCategory} style={styles.button}>
            Add
          </button>
        </div>
        <ul style={styles.categoryList}>
          {categories.map((cat) => (
            <li key={cat.id} style={styles.categoryItem}>
              {editCategory.id === cat.id ? (
                <>
                  <input
                    value={editCategory.name}
                    onChange={(e) =>
                      setEditCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                  <button onClick={handleSaveEdit} style={styles.buttonSmall}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <div>
                    <button
                      onClick={() => startEdit(cat)}
                      style={styles.buttonSmall}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ ...styles.buttonSmall, background: "#f44336" }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subheading}>🛍️ All Products</h2>
        <div style={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {products.length === 0 && <p>No products found.</p>}
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fff",
    color: "#111",
  },
  heading: {
    fontSize: "2.4rem",
    fontWeight: "bold",
    marginBottom: "2rem",
    textAlign: "center",
  },
  section: {
    marginBottom: "3rem",
  },
  subheading: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  input: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    padding: "0.5rem 1.2rem",
    marginLeft: "0.5rem",
    border: "none",
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  buttonSmall: {
    padding: "0.3rem 0.8rem",
    marginLeft: "0.5rem",
    border: "none",
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  categoryForm: {
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
  },
  categoryList: {
    listStyle: "none",
    paddingLeft: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  categoryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f9f9f9",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
  },
  productsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2rem",
    justifyContent: "flex-start",
  },
};
