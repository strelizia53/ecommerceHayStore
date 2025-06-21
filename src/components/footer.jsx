import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>
        © {new Date().getFullYear()} ParcelSafe — Secure Delivery, Simplified.
      </p>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "4rem",
    padding: "1rem",
    backgroundColor: "#222",
    color: "#fff",
    textAlign: "center",
    fontSize: "0.9rem",
    borderTop: "2px solid #444",
  },
  text: {
    margin: 0,
  },
};
