import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username);
          setUserType(data.userType);
        }
      } else {
        setUsername("");
        setUserType("");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.logoText}>
          SafeParcel
        </Link>
      </div>
      <div style={styles.links}>
        {user ? (
          <>
            <span style={styles.welcome}>Welcome, {username}</span>
            {username === "admin" && (
              <Link to="/admin" style={styles.link}>
                Admin
              </Link>
            )}
            <Link to="/profile" style={styles.link}>
              Profile
            </Link>
            <button onClick={handleLogout} style={styles.button}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  logoText: {
    color: "#fff",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  welcome: {
    color: "#aaa",
    fontSize: "0.95rem",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s",
  },
  button: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "1px solid #fff",
    padding: "0.4rem 0.8rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "all 0.3s",
  },
};

// Optional: Add hover effect using inline styles
const addHoverEffect = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    a:hover {
      color: #ccc !important;
    }
    button:hover {
      background-color: #fff !important;
      color: #000 !important;
    }
  `;
  document.head.appendChild(style);
};
addHoverEffect();
