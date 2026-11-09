import { useState, useEffect  } from "react";
import axios from "axios";
import Select from 'react-select';
import { useNavigate, Link } from "react-router-dom";
import SupermarketLocationPicker from '../components/SupermarketLocationPicker';
import './Register.css';

const Register = () => {

  const [currencyMap, setCurrencyMap] = useState({});
  const [countryOptions, setCountryOptions] = useState([]);

  useEffect(() => {
    const loadCurrencyData = async () => {
      try {
        const response = await fetch("/currencyMap.json");
        const data = await response.json();
        setCurrencyMap(data);

        const options = Object.entries(data).map(([country, currency]) => ({
          value: country,
          label: `${country} (${currency.code})`,
          currency_code: currency.code,
          currency_symbol: currency.symbol,
        }));
        setCountryOptions(options);
      } catch (error) {
        console.error("Error loading currency map:", error);
      }
    };

    loadCurrencyData();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    role: "",

  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [supermarketLocation, setSupermarketLocation] = useState(null);
  const [supermarketType, setSupermarketType] = useState("");
  const [supermarketName, setSupermarketName] = useState("");
  const navigate = useNavigate();

 const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'owner', label: 'Supermarket Owner' },
];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.country) {

    setError("Please select a country");
    return;
  }

  if (!formData.role) {
    setError("Please select a role");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    let currency_code = null;

    if (formData.country && currencyMap[formData.country]) {
      currency_code = currencyMap[formData.country].code;
    }

    if (formData.role === "owner") {
      if (!supermarketLocation || !supermarketType || !supermarketName) {
        setError("Please fill in all supermarket details");
        return;
      }
    }
          await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, {
        ...formData,
        currency_code,
        supermarketLocation,
        supermarketType,
        supermarketName,
      });
      setSuccess(true);
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
  } catch (err) {
    setError(err.response?.data?.error || "Registration failed");
  }
};

  return (
    <div className="register-container">
      <h2 className="register-title">Register</h2>
      {error && <p className="error-message">{error}</p>}
      {success && (
        <div className="success-message">
          <p>Registration successful! Redirecting to login...</p>
        </div>
      )}
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          className="input-field"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          className="input-field"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p className="error-message" style={{ marginTop: "-10px" }}>
          Passwords do not match
        </p>
      )}
        {}
{}
<Select
  options={countryOptions}
  placeholder="Select Country"
  value={countryOptions.find((option) => option.value === formData.country) || null}
  onChange={(selectedOption) =>
    setFormData((prev) => ({ ...prev, country: selectedOption ? selectedOption.value : "" }))
  }
  styles={{
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "orangered" : "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#e65100" },
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "orangered" : "white",
      color: isFocused ? "white" : "black",
    }),
  }}
/>
<Select
  options={roleOptions}
  placeholder="Select Role"
  value={roleOptions.find((option) => option.value === formData.role) || null}
  onChange={(selectedOption) =>
    setFormData((prev) => ({ ...prev, role: selectedOption ? selectedOption.value : "" }))
  }
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
        {formData.role === "owner" && (
          <SupermarketLocationPicker
            onLocationSelect={setSupermarketLocation}
            onSupermarketSelect={setSupermarketType}
            onNameChange={setSupermarketName}
          />
        )}
        <button className="btn submit-btn" type="submit">
          Register
        </button>
      </form>
      <div >
        <p>Already have an account? <Link className="login-link" to="/login">Login here</Link></p>
      </div>
    </div>
  );
};

export default Register;
