import { useState, useEffect } from "react";
import axios from "axios";
import Select from 'react-select';
import { useNavigate } from "react-router-dom";
import './CustomerDashboard.css';
import './SupermarketOwnerDashboard.css';
import { io } from 'socket.io-client';

const SupermarketOwnerDashboard = () => {
  const navigate = useNavigate();
  const name = sessionStorage.getItem("name");
  const locationId = sessionStorage.getItem("locationId");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productCategory, setProductCategory] = useState("1");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [productsInStock, setProductsInStock] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newSubmissions, setNewSubmissions] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/category`);
        setCategories(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch categories');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinOwnerRoom', locationId);
    });

  newSocket.on('newPriceSubmission', (data) => {
  if (!data.submission) return;

  if (data?.submission?.location_id === parseInt(locationId)) {
  setNewSubmissions(prev => [data, ...prev]);
  if (data?.message) alert(data.message);
}
});

    return () => {
      newSocket.off('connect');
      newSocket.off('newPriceSubmission');
      newSocket.close();
    };
  }, [locationId]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
        setExistingProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchAllProducts();
  }, []);

  const groupProductsByCategory = (products) => {
    return products.reduce((acc, product) => {
      const categoryId = product.category_id?.toString() || 'unknown';
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category_name: product.category_name || 'Unknown',
          products: []
        };
      }
      acc[categoryId].products.push(product);
      return acc;
    }, {});
  };

  const fetchProductsInStock = async () => {
    try {
      setLoadingProducts(true);
      const locationId = sessionStorage.getItem("locationId") || 1;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/instock?locationId=${locationId}`);
      const groupedProducts = groupProductsByCategory(response.data.data || []);
      setProductsInStock(groupedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductsInStock({});
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProductsInStock();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("Please log in again");
        return;
      }

      let productId;

      if (isNewProduct) {

  if (!productImage) {
    setImageError("Please upload a product image before submitting.");
    return;
  } else {
    setImageError("");
  }

  const formData = new FormData();
  formData.append('productName', productName);
  formData.append('productPrice', productPrice);
  formData.append('productImage', productImage);
  formData.append('categoryId', productCategory);

        const productResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        productId = productResponse.data.product_id;
      } else {
        productId = selectedProduct.product_id;
      }

      const priceResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/prices`,
        {
          product_id: productId,
          price: productPrice,
          location_id: locationId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (priceResponse.data.status === 'success') {
        alert("Product added successfully!");

        setProductName("");
        setProductPrice("");
        setProductImage(null);
        setProductCategory("1");
        setIsNewProduct(false);
        setSelectedProduct(null);

        await fetchProductsInStock();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      if (error.response && error.response.status === 400 && error.response.data?.error === 'Product already exists in the supermarket') {
        alert('Product already exists in the supermarket');
      } else {
        alert("Failed to add product. Please try again.");
      }
    }
  };

  const handleCategoryClick = (categoryId) => {

    const categoryProducts = Object.values(productsInStock)
      .flatMap(category => category.products)
      .filter(product => product.category_id === categoryId)
      .map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        image_path: product.image_path,
        price: product.price
      }));

    navigate(`/owner-category/${categoryId}`, { state: { products: categoryProducts } });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="owner-dashboard">
      <h1>Hello {name}, Welcome to Your Dashboard!</h1>
      <h2>Products in Stock</h2>
      <div className="categories-grid">
        {categories.map((category) => (
          <div
            key={category.category_id}
            className="category-card"
            onClick={() => handleCategoryClick(category.category_id)}
          >
            <img
              src={`/images/categories/${category.category_name.toLowerCase()}.jpg`}
              alt={category.category_name}
            />
            <p>{category.category_name}</p>
          </div>
        ))}
      </div>
      <div className="add-product-section">
        <h2>Add New Product to your Supermarket</h2>
<form onSubmit={handleAddProduct} className="add-product-form">
  {}
  {}
  <Select
  value={
    selectedProduct
      ? { value: selectedProduct.product_id, label: selectedProduct.product_name }
      : null
  }
  onChange={(selectedOption) => {
    if (selectedOption) {
      const product = existingProducts.find(p => p.product_id === selectedOption.value);
      setSelectedProduct(product);
      setIsNewProduct(false);
      setProductName(product.product_name);
      setProductCategory(product.category_id?.toString() || "1");
    } else {
      setSelectedProduct(null);
    }
  }}
  options={existingProducts.map(product => ({
    value: product.product_id,
    label: product.product_name,
  }))}
  isDisabled={isNewProduct}
  placeholder="Select a product"
  styles={{
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? 'orangered' : '#ccc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#e65100' },
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? 'orangered' : 'white',
      color: isFocused ? 'white' : 'black',
    }),
  }}
/>
  {}
  {isNewProduct ? (
    <>
      <input
        type="text"
        placeholder="Product Name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        required
      />
      <div className="image-upload-container">
        <label htmlFor="productImage" className="image-upload-label">
          {productImage ? 'Change Product Image' : 'Upload Product Image'}
        </label>
        <input
          id="productImage"
          type="file"
          accept="image/*"

          onChange={(e) => { setProductImage(e.target.files[0]); setImageError(""); }}

          className="image-upload-input"
        />
        {productImage && (
          <div className="image-preview">
            <img
              src={URL.createObjectURL(productImage)}
              alt="Preview"
              className="preview-image"
            />
          </div>
        )}
         {imageError && <p className="error-text">{imageError}</p>}
      </div>
      {}
      <Select
  value={
    categories.find(cat => cat.category_id === parseInt(productCategory))
      ? {
          value: productCategory,
          label: categories.find(cat => cat.category_id === parseInt(productCategory))?.category_name,
        }
      : null
  }
  onChange={(selectedOption) => setProductCategory(selectedOption.value)}
  options={categories.map(category => ({
    value: category.category_id,
    label: category.category_name,
  }))}
  placeholder="Select Category"
  styles={{
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? 'orangered' : '#ccc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#e65100' },
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? 'orangered' : 'white',
      color: isFocused ? 'white' : 'black',
    }),
  }}
/>
      <input
        type="number"
        placeholder="Product Price"
        value={productPrice}
        onChange={(e) => setProductPrice(e.target.value)}
        required
      />
      <div className="button-row">
        <button type="submit" className="submit-btn">
          Submit New Product
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => {
            setIsNewProduct(false);
            setProductName("");
            setProductPrice("");
            setProductImage(null);
            setProductCategory("1");
          }}
        >
          Cancel
        </button>
      </div>
    </>
  ) : selectedProduct ? (
    <>
      {}
      <div className="selected-product-preview">
        <img
          src={`${import.meta.env.VITE_API_URL}/${selectedProduct.image_path}`}
          alt={selectedProduct.product_name}
          className="preview-image"
        />
      </div>
      <input
        type="number"
        placeholder="Product Price"
        value={productPrice}
        onChange={(e) => setProductPrice(e.target.value)}
        required
      />
      <div className="button-row">
        <button type="submit" className="submit-btn">
          Add Product
        </button>
        <button
          type="button"
          className="submit-btn cancel-btn"
          onClick={() => {
            setSelectedProduct(null);
            setProductPrice("");
          }}
        >
          Cancel
        </button>
      </div>
    </>
  ) : (
    <>
      {}
      <div className="button-row">
        <button
          type="button"
          className="submit-btn"
          onClick={() => {
            setIsNewProduct(true);
            setSelectedProduct(null);
          }}
        >
          Add New Product
        </button>
        <button
          type="submit"
          className="submit-btn"
          disabled={!selectedProduct}
        >
          Add Product
        </button>
      </div>
    </>
  )}
</form>
      </div>
    </div>
  );
};

export default SupermarketOwnerDashboard;
