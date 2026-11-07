//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
import React from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import "./ResultsSection.css";

const ResultsSection = ({ items, loading, searchQuery }) => {
  const navigate = useNavigate();

  return (
    <section className="results-section">
      {items.length > 0 ? (
        <div className="grid">
          {items.map((item, idx) => (
            <div
              className="card"
              key={idx}
              onClick={() => navigate(`/products-details/${item.product_id}`)}
            >
              <div className="product-image-container">
                <img 
                  src={`${process.env.REACT_APP_API_URL}/${item.image_path}` }
                  alt={item.product_name} 
                  className="product-image"
                />
              </div>
              {/* <div
                className="card-media"
                style={{ backgroundImage: `url(http://localhost:5000/${item.image_path})` }}
              /> */}
              <div className="card-content">
                <h3>{item.product_name}</h3>
                <div className="price-info">
                  <p className="supermarket">🏬 {item.supermarket_name}</p>
                  <p className="location">📍 {item.location_name}</p>
                  <p className="price">{formatCurrency(item.price)}</p>
                  <div className="supermarket">
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/${item.supermarket_image}`} 
                    alt={item.supermarket_name}
                    className="supermarket-logo"
                    //onError={(e) => e.target.src = '/fallback-logo.png'} 
                  />
                  {/* <span>{price.supermarket_name}</span> */}
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && searchQuery && <p className="no-items">No items found</p>
      )}
    </section>
  );
};

export default ResultsSection;
