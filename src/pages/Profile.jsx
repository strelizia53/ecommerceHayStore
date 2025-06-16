import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username);
          setUserType(data.userType);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleBecomeVendor = async () => {
    const confirm = window.confirm("Are you sure you want to become a vendor?");
    if (confirm) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { userType: "vendor" });
      setUserType("vendor");
      alert("You're now a vendor!");
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 Profile</h2>
        <p>
          <strong>Username:</strong> {username}
        </p>
        <p>
          <strong>Role:</strong> {userType}
        </p>

        <div style={styles.links}>
          <Link to="/cart" style={styles.link}>
            🛒 View Cart
          </Link>
          <Link to="/wishlist" style={styles.link}>
            💖 View Wishlist
          </Link>
          <Link to="/myorders" style={styles.link}>
            📦 My Orders
          </Link>
          <Link to="/orderauthenticator" style={styles.link}>
            🧾 Order Authenticator
          </Link>
        </div>

        {userType !== "vendor" && (
          <button onClick={handleBecomeVendor} style={styles.vendorBtn}>
            Become a Vendor
          </button>
        )}

        {userType === "vendor" && (
          <div style={{ marginTop: "1rem" }}>
            <Link to="/vendor" style={styles.vendorLink}>
              🚀 Go to Vendor Portal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    backgroundColor: "#f7f9fc",
    minHeight: "100vh",
  },
  card: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    width: "100%",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#333",
  },
  links: {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  link: {
    textDecoration: "none",
    fontSize: "1rem",
    color: "#0077cc",
    fontWeight: "500",
    padding: "0.5rem 0.8rem",
    borderRadius: "6px",
    background: "#eef6ff",
    transition: "0.2s ease",
  },
  vendorBtn: {
    marginTop: "2rem",
    padding: "0.7rem 1.2rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  vendorLink: {
    textDecoration: "none",
    color: "#000",
    fontWeight: "600",
    backgroundColor: "#ffe9a3",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    display: "inline-block",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
  },
};
