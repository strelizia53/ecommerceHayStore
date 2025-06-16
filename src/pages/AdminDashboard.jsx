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
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>

      <h2>📋 All Users</h2>
      <table border="1" cellPadding="10" style={{ marginBottom: "2rem" }}>
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

      <h2>🗂️ Manage Categories</h2>
      <input
        placeholder="New category"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />
      <button onClick={handleAddCategory}>Add</button>

      <ul>
        {categories.map((cat) => (
          <li key={cat.id}>
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
                />
                <button onClick={handleSaveEdit}>Save</button>
              </>
            ) : (
              <>
                {cat.name}
                <button
                  onClick={() => startEdit(cat)}
                  style={{ marginLeft: 8 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  style={{ marginLeft: 4 }}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "2rem" }}>🛍️ All Products</h2>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.length === 0 && <p>No products found.</p>}
      </div>
    </div>
  );
}
