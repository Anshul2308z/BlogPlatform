import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import healthRoutes from '../routes/health.js';
import authRoutes from '../routes/auth.js';
import postRoutes from '../routes/posts.js';
import test from '../routes/me.js'

import connectDB from '../config/db.js';

dotenv.config() ;

const app = express() ; 
const PORT = process.env.PORT || 4000 ;

app.use(helmet());
app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use(morgan('dev'));

// Rate limiter <simple>
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

// rateLimit returns a middleware function — pass it directly (don't call it)
app.use(limiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/me', test);;

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});


// Connect to Mongo and start server using the shared connectDB helper
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error', err);
    process.exit(1);
  });;

