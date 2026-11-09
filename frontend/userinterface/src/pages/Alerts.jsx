import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './Alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    const userType = sessionStorage.getItem('userType') || 'customer';
    if (!userId) return;

    const socket = io(`${import.meta.env.VITE_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { userId }
    });

    socket.on('connect', () => {
      console.log('Socket connected, joining room:', userId);
      socket.emit('join', userId);

    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('newAlert', (alert) => {
      console.log('New alert received:', alert);

      const alertKey = `${alert.message}-${alert.timestamp}`;

      setAlerts(prevAlerts => {

        const isDuplicate = prevAlerts.some(
          existingAlert =>
            `${existingAlert.message}-${existingAlert.timestamp}` === alertKey
        );

        if (!isDuplicate) {
          return [{ ...alert, alertKey }, ...prevAlerts];
        }
        return prevAlerts;
      });
    });

    const fetchAlerts = async () => {
      try {
        console.log('Fetching alerts for user:', userId);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/alerts/${userId}?userType=${userType}`);
        console.log('Alerts response:', response.data);
        setAlerts(response.data || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    return () => {
      console.log('Cleaning up socket connection');
      socket.off('newAlert');
      socket.off('connect');
      socket.off('connect_error');
      socket.close();
    };
  }, []);

  const handleMarkAsRead = async (alertId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/alerts/${alertId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {

        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.alert_id === alertId
              ? { ...alert, read_at: new Date().toISOString() }
              : alert
          )
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      if (error.response?.status === 401) {

        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  return (
    <div className="alerts-container">
      <h2>Your Alerts</h2>
      {alerts && alerts.length > 0 ? (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div
              key={alert.alertKey || alert.alert_id}
              className={`alert-card ${!alert.read_at ? 'unread' : 'read'}`}
              onClick={() => !alert.read_at && handleMarkAsRead(alert.alert_id)}
            >
              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <span className="alert-time">
                  {new Date(alert.timestamp || alert.created_at).toLocaleString()}
                </span>
                {alert.type === 'price_change' && (
                  <div className="price-drop-info">
                    <span className="price-drop-icon">💰</span>
                    <span className="price-drop-text">Price Drop!</span>
                  </div>
                )}
              </div>
              {alert.type === 'price_change' && (
                <div className="alert-icon">💰</div>
              )}
              {alert.type === 'deal_expiration' && (
                <div className="alert-icon">⏰</div>
              )}
              {!alert.read_at && (
                <div className="unread-indicator">New</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-alerts">No alerts at the moment</p>
      )}
    </div>
  );
};

export default Alerts;
