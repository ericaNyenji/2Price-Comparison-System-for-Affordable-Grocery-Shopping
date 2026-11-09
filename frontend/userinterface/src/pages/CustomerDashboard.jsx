import { useState, useEffect } from "react";
import axios from "axios";
import './CustomerDashboard.css';
import DealsSection from './DealsSection';
import { io } from 'socket.io-client';
import SearchSection from '../components/SearchSection';
import ResultsSection from "../components/ResultsSection";
import ExploreSection from '../components/ExploreSection';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {

  const name = sessionStorage.getItem("name");

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exploreData, setExploreData] = useState([]);
  const [supermarkets, setSupermarkets] = useState([]);
  const [filterType, setFilterType] = useState("supermarket");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchRadius, setSearchRadius] = useState(5);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const fetchDeals = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/deals`);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const exploreData = await axios.get(`${import.meta.env.VITE_API_URL}/api/explore`);
        setExploreData(exploreData.data);
        console.log(exploreData)
        const supermarketsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/supermarkets`);
        setSupermarkets(supermarketsResponse.data);
        console.log(supermarketsResponse)
      } catch (err) {
        console.error("Error fetching explore data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => { if (searchQuery) { handleSearch();}},
  [filterType, selectedFilter,searchRadius,useCurrentLocation,customerLocation,searchQuery]);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const socket = io(`${import.meta.env.VITE_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { userId }
    });

    socket.on('connect', () => {
      console.log('web Socket connected to Server');
      socket.emit('join', userId);
    });

    socket.on('priceUpdated', (updatedProduct) => {
      console.log('Price update received:', updatedProduct);
      setItems(prevItems =>
        prevItems.map(item =>
          item.product_id === updatedProduct.product_id &&
          item.location_id === updatedProduct.location_id
            ? { ...item, price: updatedProduct.price, on_deal: updatedProduct.on_deal }
            : item
        )
      );
    });

    socket.on('priceDropped', (priceDropData) => {
      console.log('Price drop received:', priceDropData);

      setItems(prevItems =>
        prevItems.map(item =>
          item.product_id === priceDropData.product_id &&
          item.location_id === priceDropData.location_id
            ? { ...item, price: priceDropData.price, on_deal: priceDropData.on_deal }
            : item
        )
      );
    });

    socket.on('newAlert', (alert) => {
      console.log('New alert received:', alert);

      window.alert(alert.message);
    });

    socket.on('productDeleted', ({ productId, locationId }) => {
      console.log('Product removed from location event received:', { productId, locationId });

      setItems(prevItems =>
        prevItems.filter(item => !(item.product_id === productId && item.location_id === locationId))
      );
    });

    fetchDeals();

    return () => {
      socket.off('priceUpdated');
      socket.off('priceDropped');
      socket.off('newAlert');
      socket.off('productDeleted');
      socket.off('connect');
      socket.disconnect();
    };
  }, []);

const handleSearchNoFilter = async () => {
  setLoading(true);
  try {
    const token = sessionStorage.getItem("token");

    let url = `${import.meta.env.VITE_API_URL}/api/search?query=${searchQuery}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setItems(response.data.data || []);
  } catch (error) {
    console.error("Search error:", error);
    setItems([]);
  } finally {
    setLoading(false);
  }
};

const handleSearch = async () => {
  setLoading(true);
  try {
    const token = sessionStorage.getItem("token");

    let url = `${import.meta.env.VITE_API_URL}/api/search?query=${searchQuery}`;

    if (selectedFilter) {
      const selectedSupermarket = supermarkets.find(s => s.supermarket_name === selectedFilter);
      if (selectedSupermarket) {
        url += `&supermarketType=${selectedSupermarket.supermarket_id}`;
      }
    }

    if (customerLocation) {
      url += `&lat=${customerLocation.lat}&lng=${customerLocation.lng}&radius=${searchRadius}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setItems(response.data.data || []);
  } catch (error) {
    console.error("Search error:", error);
    setItems([]);
  } finally {
    setLoading(false);
  }
};

  const handleSearchChange = (e) => { setSearchQuery(e.target.value);};

  useEffect(() => { if (searchQuery !== "") {handleSearch();}}, [searchQuery]);

  const handleFilterTypeChange = (e) => {setFilterType(e.target.value); setSelectedFilter("");};
  const handleFilterChange = (e) => {setSelectedFilter(e.target.value);};

  const handleSetLocation = () => {setIsSettingLocation(true); setShowMap(true);};

  const handleLocationSelect = (location) => {
    setCustomerLocation(location);
    setIsSettingLocation(false);

    handleSearch();
  };

  const handleUseCurrentLocation = async () => {
    setShowMap(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCustomerLocation(location);
            setUseCurrentLocation(true);

            handleSearch();
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }
    } catch (error) {
      console.error("Error accessing geolocation:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-hero">
        <h1>Hello {name}, Welcome to Your Dashboard!</h1>
        <p>Here you can search for grocery items and compare prices across multiple supermarkets.</p>
        <h2>Search for Grocery Items</h2>
      </header>
      <div className="main-content">
        <SearchSection
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        showMap={showMap}
        setShowMap={setShowMap}
        handleSetLocation={handleSetLocation}
        handleUseCurrentLocation={handleUseCurrentLocation}
        customerLocation={customerLocation}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        filterType={filterType}
        handleFilterTypeChange={handleFilterTypeChange}
        selectedFilter={selectedFilter}
        handleFilterChange={handleFilterChange}
        supermarkets={supermarkets}
        loading={loading}
        handleLocationSelect={handleLocationSelect}
        handleSearchNoFilter={handleSearchNoFilter}
      />
      <ResultsSection items={items} loading={loading} searchQuery={searchQuery} />
      </div>
      <ExploreSection exploreData={exploreData} />
       <DealsSection />
    </div>
  );
};

export default CustomerDashboard;
