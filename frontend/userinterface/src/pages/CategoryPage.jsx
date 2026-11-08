//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './CategoryPage.css';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [categoryName, setCategoryName] = useState(""); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        //const response = await axios.get(`http://localhost:5000/api/productsbycategory/${categoryId}`);
        const token = sessionStorage.getItem("token");

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/productsbycategory/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched products:", response.data);
        setCategoryName(response.data.category_name);
        setProducts(response.data.products);
      } catch (error) {
        console.error("Failed to fetch products by category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [categoryId]);

  return (
    <div className="category-page">
       <h1>{categoryName}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found in this category for your location.</p>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <div
              className="card"
              key={product.product_id}
              onClick={() => navigate(`/products-details/${product.product_id}`)}
            >
              <div
                className="card-media"
                style={{ backgroundImage: `url(${import.meta.env.VITE_API_URL}/${product.image_path})` }}
              />
              <div className="card-content">
                <h3>{product.product_name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
