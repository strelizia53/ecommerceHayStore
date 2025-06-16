import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const { username, email, password, repeatPassword } = form;

    if (password !== repeatPassword) {
      return setError("Passwords do not match");
    }

    try {
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) return setError("Username already in use");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        username,
        email,
        userType: "user",
      });

      alert("Registered successfully!");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Left Image Panel */}
      <div style={styles.imageSection}>
        <img
          src="https://images.pexels.com/photos/32466493/pexels-photo-32466493.jpeg"
          alt="Register Visual"
          style={styles.image}
        />
      </div>

      {/* Form Section */}
      <div style={styles.formSection}>
        <form onSubmit={handleRegister} style={styles.form}>
          <h2 style={styles.title}>Register</h2>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="repeatPassword"
            type="password"
            placeholder="Repeat Password"
            onChange={handleChange}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "row",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    flexWrap: "wrap",
  },
  imageSection: {
    flex: "1 1 400px",
    maxHeight: "100vh",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  formSection: {
    flex: "1 1 400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: "2rem",
  },
  form: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#000",
  },
  input: {
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: {
    color: "#e74c3c",
    marginBottom: "1rem",
    textAlign: "center",
  },
};
