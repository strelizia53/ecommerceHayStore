import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ Initialize navigate

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { identifier, password } = form;

    let emailToUse = identifier;

    // Convert username to email if needed
    if (!identifier.includes("@")) {
      const q = query(
        collection(db, "users"),
        where("username", "==", identifier)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return setError("Username not found");
      emailToUse = snapshot.docs[0].data().email;
    }

    try {
      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate("/"); // ✅ Redirect to homepage after login
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.imageSection}>
        <img
          src="https://images.pexels.com/photos/29124192/pexels-photo-29124192.jpeg"
          alt="Login Visual"
          style={styles.image}
        />
      </div>

      <div style={styles.formSection}>
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.title}>Login</h2>
          <input
            name="identifier"
            placeholder="Username or Email"
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
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

// Styling remains the same...
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
