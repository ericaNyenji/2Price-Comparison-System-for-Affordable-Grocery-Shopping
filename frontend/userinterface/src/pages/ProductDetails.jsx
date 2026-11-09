import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from 'socket.io-client';
import { formatCurrency } from "../utils/currency";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritePrices, setFavoritePrices] = useState({});
  const userId = sessionStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: userId
      }
    });

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', {
        userId: userId
      });
    });

    newSocket.on('priceUpdated', (updatedPrice) => {
      if (updatedPrice.product_id === parseInt(id)) {
        setProduct(prevProduct => {
          if (!prevProduct) return prevProduct;
          return {
            ...prevProduct,
            prices: prevProduct.prices.map(price =>
              price.price_id === updatedPrice.price_id
                ? { ...price, price: updatedPrice.price }
                : price
            )
          };
        });
      }
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('priceUpdated');
      newSocket.close();
    };
  }, [id, userId]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/details/${id}`);
        setProduct(response.data.product);
        setLoading(false);

        if (userId) {
          try {
            const favoritesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/favorites/user/${userId}`);
            const favorites = favoritesResponse.data.data;

            const favoriteMap = {};
            favorites.forEach(fav => {
              if (fav.product_id === parseInt(id)) {
                favoriteMap[fav.price_id] = true;
              }
            });

            setFavoritePrices(favoriteMap);
          } catch (err) {
            console.error("Error checking favorites:", err);
          }
        }
      } catch (err) {
        setError("Failed to load product details");
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, userId]);

  const toggleFavorite = async (price) => {
    if (!userId) {
      alert("Please log in to add favorites");
      return;
    }

    try {
      if (favoritePrices[price.price_id]) {

        console.log("Removing favorite:", { userId, productId: id, priceId: price.price_id });
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/favorites/${id}?userId=${userId}&priceId=${price.price_id}`);
        setFavoritePrices(prev => ({...prev, [price.price_id]: false}));
      } else {

        const data = {
          userId: parseInt(userId),
          productId: parseInt(id),
          priceId: parseInt(price.price_id)
        };
        console.log("Adding favorite:", data);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/favorites`, data);
        setFavoritePrices(prev => ({...prev, [price.price_id]: true}));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to update favorites");
    }
  };

  const handleFavoriteClick = async (price, e) => {
    e.stopPropagation();
    await toggleFavorite(price);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-details-container">
      <div className="product-header">
        <img
          src={`${import.meta.env.VITE_API_URL}/${product.image_path}`}
          alt={product.product_name}
          className="product-image"
        />
        <h1>{product.product_name}</h1>
      </div>
      <div className="prices-container">
        <h2>Available Prices</h2>
        <div className="prices-grid">
          {product.prices.map((price) => (
            <div
              key={price.price_id}
              className="price-card"
              onClick={() => navigate(`/review/${product.product_id}/location/${price.location_id}/price/${price.price}`)}
            >
              <div className="product-image-container">
                <img
                  src={`${import.meta.env.VITE_API_URL}/${product.image_path}`}
                  alt={product.product_name}
                  className="product-image"
                />
              </div>
              <div className="price-info">
                <p className="supermarketP">🏬 {price.supermarket_name}</p>
                <p className="location">📍 {price.location_name}</p>
                <p className="price">{formatCurrency(price.price)}</p>
                <div className="supermarket">
                <img
                   src={`${import.meta.env.VITE_API_URL}/${price.supermarket_image}`}

                  alt={price.supermarket_name}
                  className="supermarket-logo"

                />
                {}
              </div>
                {price.on_deal && (
                  <span className="deal-badge">On Deal!</span>
                )}
              </div>
              <div
                className="favorite-button"
                onClick={(e) => handleFavoriteClick(price, e)}
              >
                <div className={`heart-icon ${favoritePrices[price.price_id] ? 'favorited' : ''}`}>
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={favoritePrices[price.price_id] ? "#e74c3c" : "none"}
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
