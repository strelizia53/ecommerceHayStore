import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div style={styles.card}>
      {(product.images?.[0] || product.image) && (
        <img
          src={product.images?.[0] || product.image}
          alt={product.title}
          style={styles.img}
        />
      )}

      <div style={styles.info}>
        <h3 style={styles.title}>{product.title}</h3>
        <p style={styles.description}>{product.description}</p>
        <p style={styles.detail}>
          <strong>Category:</strong> {product.category}
        </p>
        <p style={styles.detail}>
          <strong>Price:</strong> ${product.price}
        </p>
        <p style={styles.detail}>
          <strong>Stock:</strong> {product.stock}
        </p>
        <p style={styles.seller}>
          <small>Seller: {product.username}</small>
        </p>
      </div>

      {onEdit && onDelete ? (
        <div style={styles.actions}>
          <button style={styles.editBtn} onClick={() => onEdit(product)}>
            Edit
          </button>
          <button style={styles.deleteBtn} onClick={() => onDelete(product.id)}>
            Delete
          </button>
        </div>
      ) : (
        <Link to={`/product/${product.id}`} style={{ textDecoration: "none" }}>
          <button style={styles.viewBtn}>View Details</button>
        </Link>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "1rem",
    width: "250px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  img: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  info: {
    flexGrow: 1,
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
    color: "#111",
  },
  description: {
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: "0.5rem",
  },
  detail: {
    fontSize: "0.85rem",
    color: "#333",
    marginBottom: "0.3rem",
  },
  seller: {
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "0.5rem",
  },
  viewBtn: {
    marginTop: "1rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    width: "100%",
    transition: "background 0.3s",
  },
  actions: {
    marginTop: "1rem",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
