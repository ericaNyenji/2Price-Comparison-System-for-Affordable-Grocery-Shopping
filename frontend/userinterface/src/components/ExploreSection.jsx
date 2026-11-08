//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
import { useNavigate } from 'react-router-dom';
import './ExploreSection.css';

const ExploreSection = ({ exploreData }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  return (
    <section className="explore-section">
      <h2>Explore Categories</h2>
      <div className="explore-icons-grid">
        {exploreData.map((category, idx) => (
          <div
            key={idx}
            className="explore-category-icon"
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
    </section>
  );
};

export default ExploreSection;
