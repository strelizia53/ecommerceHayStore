import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Navbar from "./components/Navbar"; // import navbar
import Home from "./pages/Home"; // Add this import
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import VendorPortal from "./pages/VendorPortal";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import VendorOrders from "./pages/VendorOrders";
import OrderAuthenticator from "./pages/OrderAuthenticator";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/vendor" element={<VendorPortal />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/myorders" element={<MyOrders />} />
        <Route path="/vendororders" element={<VendorOrders />} />
        <Route path="/orderauthenticator" element={<OrderAuthenticator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
