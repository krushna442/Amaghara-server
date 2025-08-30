import express, { json, urlencoded } from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import loginRoute from './src/routes/login.js';
import session from 'express-session';
import userRoute from './src/routes/userRoute.js';
import propertyRoute from './src/routes/propertyRoute.js'; // Assuming you have a property route
import adminRoute from './src/routes/adminRoute.js'
import rozarpayRoute from './src/routes/rozorpayRoute.js'; // Assuming you have a Razorpay route
import messageRoute from './src/routes/messageRoute.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

// CORS Setup
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false, // set true if using HTTPS
        maxAge: 60 * 60 * 1000 // 1 hour
    }
}));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', loginRoute); 
app.use('/user', userRoute);
app.use('/property', propertyRoute); 
app.use('/admin', adminRoute); 
app.use('/api', rozarpayRoute); // Razorpay route
app.use('/api', messageRoute);
// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});


// Global error handler

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
