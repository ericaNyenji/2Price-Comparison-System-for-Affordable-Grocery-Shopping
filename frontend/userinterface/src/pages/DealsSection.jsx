//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { formatCurrency } from "../utils/currency";
import './DealsSection.css';

const DealsSection = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize socket
  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { userId }
    });

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', { userId });
    });

    newSocket.on('newDeal', (deal) => {
      setDeals(prev => [...prev, deal]);
    });

    newSocket.on('dealUpdated', (updatedDeal) => {
      setDeals(prev =>
        prev.map(deal =>
          deal.product_id === updatedDeal.product_id && deal.location_id === updatedDeal.location_id
            ? updatedDeal
            : deal
        )
      );
    });

    newSocket.on('dealRemoved', (data) => {
      setDeals(prev =>
        prev.filter(
          deal => !(deal.product_id === data.productId && deal.location_id === data.locationId)
        )
      );
    });

    return () => newSocket.close();
  }, []);

  // Fetch all active deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/deals`);
        setDeals(response.data.data);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const handleDealClick = (productId) => {
    navigate(`/products-details/${productId}`);
  };

  if (loading) return <div className="loading">Loading deals...</div>;

  return (
    <section className="deals-section">
      <h2>🔥 Special Deals</h2>

      {deals.length > 0 ? (
        <div className="grid">
          {deals.map((deal) => (
            <div
              className="card deal-card"
              key={`${deal.product_id}-${deal.location_id}`}
              onClick={() => handleDealClick(deal.product_id)}
            >
              <div
                className="card-media"
                style={{
                  backgroundImage: `url(${import.meta.env.VITE_API_URL}/${deal.image_path})`
                }}
              />

              <div className="card-content">
                <h3>{deal.product_name}</h3>                
                <p className="supermarket-name">🏬 {deal.supermarket_name}</p>
                <div className="deal-location-info">
                  <p className="location">📍 {deal.location_name}</p>
                </div>

                <div className="deal-price-info">
                  <p className="original-price">Original: {formatCurrency(deal.price)}</p>
                  <p className="deal-price">Now: {formatCurrency(deal.deal_price)}</p>
                  <br></br>
                  <div className="supermarket">
                 
                  
                </div>
                  {/* <p className="discount">Save {deal.deal_percentage}%</p> */}
                </div>

                {/* <div className="deal-dates">
                  <p>🕒 {new Date(deal.deal_start_date).toLocaleDateString()} → {new Date(deal.deal_end_date).toLocaleDateString()}</p>
                </div> */}
                
                 <img
                    src={`${import.meta.env.VITE_API_URL}/${deal.supermarket_image}`}
                    alt={deal.supermarket_name}
                    className="supermarket-logo"
                  />
              </div>

              <div className="deal-badge">DEAL</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-items">No deals available right now</p>
      )}
    </section>
  );
};

export default DealsSection;
