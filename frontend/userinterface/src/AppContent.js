//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
//controls the layout, navigation bar visibility, and page routing...This is the file that controls what users see as they navigate around your application.

import React, { useState, useEffect } from "react";//useState — a React Hook used to store data that can change.(state variable).....useEffect — a React Hook used to run code after rendering or when specified dependencies change.
//Here these Hooks help keep track of the logged-in user's role and update it when the URL changes.
import { Routes, Route, useLocation } from "react-router-dom";
//These are tools from React Router.- Routes — contains the collection of routes available in your application.- Route — defines a URL and the component that should appear at that URL.- useLocation — tells you the current URL location, including its pathname.(For example, if the browser is at /favorites, useLocation() lets you access that pathname.)
import './AppContent.css';//Imports the CSS file containing styling for this component, such as the top bar and logo.
import TopNav from "./components/TopNav";//Imports your navigation bar component. It is displayed on most pages, depending on the current route.
import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import Login from "./pages/Login";
//These import the components for your home page, registration page, and login page
import CustomerDashboard from "./pages/CustomerDashboard";
import SupermarketOwnerDashboard from "./pages/SupermarketOwnerDashboard";
//These import the dashboards for two different user types:- CustomerDashboard — for customers.- SupermarketOwnerDashboard — for supermarket owners.
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import ProductDetails from "./pages/ProductDetails";
//These import the components for the favorites page, user profile, and individual product details.
import CategoryPage from './pages/CategoryPage';
import EditProduct from './pages/EditProduct';
import Alerts from "./pages/Alerts";
import Review from "./pages/Review";
import OwnerCategoryPage from './pages/OwnerCategoryPage';
//These import additional pages: - CategoryPage — displays products belonging to a category.- EditProduct — lets an owner edit a product.- Alerts — displays alerts.- Review — handles product reviews or price reviews.- OwnerCategoryPage — displays category-related content for supermarket owners


//AppContent component wraps your entire app’s routing. It conditionally renders the TopNav component based on the current route and user type.

const AppContent = () => {
  const location = useLocation();//eg./
  const [userType, setUserType] = useState("");
  

  useEffect(() => {
    const storedUserType = sessionStorage.getItem("role"); // "customer" or "owner"
    //where is session storage gotten/set from. ???????????can't I get this role from TopNav instead
    if (storedUserType) {
      setUserType(storedUserType);//if usertype is "" it will navigate to / (check topNav component) 
    }
  }, [location.pathname]); // << updates on page change.eg."/" or "/login" or "/register"

  return (
    <>
      <div className="top-bar">
        <div
          className="logo"
          // style={{ cursor: "pointer" }}
          // onClick={() => navigate("/")}
        >
          <span style={{ fontSize: "48px", marginRight: "5px", marginTop: "1px", marginBottom: "7px"  }}>🛒</span>
          Price Comparison System
        </div>
      </div>

      {location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/register" && (
        <TopNav userType={userType} />
      )}      {/* You show <TopNav /> everywhere except on Home (/), Login pages & Register Pages*/}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        {/* <Route path="/customer-dashboard" element={<div className="main-content"><CustomerDashboard /> </div>} /> */}
        <Route path="/owner-dashboard" element={<SupermarketOwnerDashboard />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/products-details/:id" element={<ProductDetails />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/edit-product/:product_id" element={<EditProduct />} />
        <Route path="/review/:productId/location/:locationId/price/:price" element={<Review />} />
        <Route path="/owner-category/:categoryId" element={<OwnerCategoryPage />} />
      </Routes>
    </>
  );
};

export default AppContent;
