const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use('/images', express.static(path.join(__dirname, 'public/images')));

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://price-comparison-frontend-t96z.onrender.com"
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const { removeExpiredDeals, activateDeals, createDealExpirationAlerts } = require('./scheduledTasks');

const alertsModule = require('./routes/alerts');
alertsModule.initializeSocket(io);

const reviewsModule = require('./routes/reviews');
reviewsModule.initializeSocket(io);

const priceSubmissionsModule = require('./routes/priceSubmissions');
priceSubmissionsModule.initializeSocket(io);

io.on('connection', (socket) => {
  console.log('📡 A user connected with ID:', socket.id);

  socket.on('join', (userId) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined room ${roomName}`);
  });

  socket.on('joinOwnerRoom', (locationId) => {
    const roomName = `owner_${locationId}`;
    socket.join(roomName);
    console.log(`Owner joined room ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('❌User disconnected:', socket.id);
  });
});

app.set('io', io);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/alerts', require('./routes/alerts').router);
app.use('/api/auth', require("./routes/auth"));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/register', require("./routes/register"));
app.use('/api/products', require('./routes/products'));
app.use('/api/supermarkets', require('./routes/supermarkets'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reviews', require('./routes/reviews').router);
app.use('/api/explore', require('./routes/explore'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/users', require('./routes/users'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/supermarket_locations', require('./routes/supermarket_locations'));
app.use('/api/search', require('./routes/search'));
app.use('/api/category', require('./routes/category'));
app.use('/api/productsbycategory', require('./routes/productsbycategory'));
app.use('/api/instock', require('./routes/instock'));
app.use('/api/price-submissions', require('./routes/priceSubmissions').router);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

setInterval(removeExpiredDeals, 60 * 60 * 1000);

setInterval(activateDeals, 60 * 60 * 1000);

setInterval(() => createDealExpirationAlerts(io), 60 * 60 * 1000);

removeExpiredDeals();
activateDeals();

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
