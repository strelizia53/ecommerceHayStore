import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Webcam from "react-webcam";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function OrderAuthenticator() {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [scanStatus, setScanStatus] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [useCamera, setUseCamera] = useState(false);

  // Camera scanning interval
  useEffect(() => {
    let interval;
    if (useCamera) {
      interval = setInterval(() => {
        captureAndScan();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [useCamera]);

  // Capture from camera and scan
  const captureAndScan = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      processQR(code?.data);

      // ✅ NEW: Convert base64 image to blob and send to API
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append("file", blob, "snapshot.jpg");

      try {
        const response = await fetch(
          "https://backendqrcodehayyan-production.up.railway.app/scan",
          {
            method: "POST",
            body: formData,
          }
        );
        const json = await response.json();
        setScanStatus(json.result);
      } catch (err) {
        setScanStatus("API scan failed");
      }
    };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setScanStatus("Processing...");
    setOrderDetails(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        processQR(code?.data);
      };
    };
    reader.readAsDataURL(file);

    // Send to damage detection API
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        "https://backendqrcodehayyan-production.up.railway.app/scan",
        {
          method: "POST",
          body: formData,
        }
      );
      const json = await response.json();
      setScanStatus(json.result);
    } catch {
      setScanStatus("API scan failed");
    }
  };

  const processQR = async (data) => {
    if (!data) return;

    const params = new URLSearchParams(data);
    const orderId = params.get("orderId");
    const secretKey = params.get("secretKey");

    const qrRef = doc(db, "orderQRCodes", orderId);
    const qrSnap = await getDoc(qrRef);

    if (qrSnap.exists()) {
      const data = qrSnap.data();
      if (data.secretKey === secretKey) {
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        const orderData = orderSnap.exists() ? orderSnap.data() : null;

        setOrderDetails({
          ...orderData,
          matched: true,
          orderId,
        });
      } else {
        setOrderDetails({ matched: false });
      }
    } else {
      setOrderDetails({ matched: false });
    }
  };

  return (
    <div style={styles.container}>
      <h1>🔐 Order Authenticator</h1>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={useCamera}
          onChange={() => {
            setUseCamera((prev) => !prev);
            setOrderDetails(null);
            setScanStatus("");
          }}
        />
        Use Camera Scanner
      </label>

      {useCamera ? (
        <div style={{ marginBottom: "1rem" }}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            style={{ width: "100%", maxWidth: "500px", borderRadius: "10px" }}
          />
        </div>
      ) : (
        <label style={styles.uploadLabel}>
          Upload QR Image:
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={styles.fileInput}
          />
        </label>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {scanStatus && (
        <p>
          🧪 Damage Scan Result:{" "}
          <strong
            style={{
              color:
                scanStatus === "undamageQR"
                  ? "green"
                  : scanStatus === "damageQR"
                  ? "red"
                  : "#555",
            }}
          >
            {scanStatus}
          </strong>
        </p>
      )}

      {orderDetails && (
        <div style={styles.resultBox}>
          {orderDetails.matched ? (
            <>
              <h3 style={{ color: "green" }}>✅ Order Verified</h3>
              <p>
                <strong>Order ID:</strong> {orderDetails.orderId}
              </p>
              <p>
                <strong>Status:</strong> {orderDetails.status}
              </p>
              <p>
                <strong>Total:</strong> ${orderDetails.totalPrice.toFixed(2)}
              </p>
              <ul>
                {orderDetails.items.map((item, i) => (
                  <li key={i}>
                    {item.title} — {item.quantity} × ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "red" }}>❌ Order could not be authenticated</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
  },
  toggle: {
    marginBottom: "1rem",
    display: "block",
  },
  uploadLabel: {
    display: "block",
    marginBottom: "1rem",
  },
  fileInput: {
    display: "block",
    marginTop: "0.5rem",
  },
  resultBox: {
    marginTop: "2rem",
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
};
