import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import './Login.css';

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth`, { email, password });

      console.log("Login response data:", response.data);

      const { token, role, userId, name} = response.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("name", name);//mary
      sessionStorage.setItem("role", role);//customer

      sessionStorage.setItem("userId", response.data.userId);
      sessionStorage.setItem("locationId", response.data.locationId);

      sessionStorage.setItem("currencyCode", response.data.currency_code);

      if (role === "owner") {
        navigate("/owner-dashboard");
      } else {
        navigate("/customer-dashboard");
      }
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
      <h2 className="login-title">Login</h2>
      {error && <p className="login-error">{error}</p>}  {}
      <form className="login-form" onSubmit={handleSubmit}>
        {}
        <input
          className="login-input"
          type="email"
          placeholder="Email adress..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button  className="login-button" type="submit">Login</button>
      </form>
      <div className="login-footer">
          <p>Don't have an account? <Link to="/register" className="register-link">Register here</Link></p>
        </div>
    </div>
  </div>
  );
};

export default Login;
