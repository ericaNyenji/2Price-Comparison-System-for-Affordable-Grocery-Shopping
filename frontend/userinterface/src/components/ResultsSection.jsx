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
                  src={`${import.meta.env.VITE_API_URL}/${item.image_path}` }
                  alt={item.product_name}
                  className="product-image"
                />
              </div>
              {}
              <div className="card-content">
                <h3>{item.product_name}</h3>
                <div className="price-info">
                  <p className="supermarket">🏬 {item.supermarket_name}</p>
                  <p className="location">📍 {item.location_name}</p>
                  <p className="price">{formatCurrency(item.price)}</p>
                  <div className="supermarket">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${item.supermarket_image}`}
                    alt={item.supermarket_name}
                    className="supermarket-logo"

                  />
                  {}
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
