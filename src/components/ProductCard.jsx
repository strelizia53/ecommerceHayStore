// src/components/ProductCard.jsx
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
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <p>
        <strong>Category:</strong> {product.category}
      </p>
      <p>
        <strong>Price:</strong> ${product.price}
      </p>
      <p>
        <strong>Stock:</strong> {product.stock}
      </p>
      <p>
        <small>Seller: {product.username}</small>
      </p>

      {/* Optional buttons for vendor editing */}
      {onEdit && onDelete && (
        <>
          <button onClick={() => onEdit(product)}>Edit</button>
          <button onClick={() => onDelete(product.id)}>Delete</button>
        </>
      )}

      {/* Optional link to details if no edit/delete provided */}
      {!onEdit && (
        <Link to={`/product/${product.id}`}>
          <button style={styles.viewBtn}>View Details</button>
        </Link>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "1rem",
    width: "220px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  img: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    marginBottom: "0.5rem",
    borderRadius: "4px",
  },
  viewBtn: {
    marginTop: "0.5rem",
  },
};
