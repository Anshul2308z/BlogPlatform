import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';

import connectDB from '../config/db.js';

dotenv.config() ;

const app = express() ; 
const PORT = process.env.PORT || 4000 ;

app.use(helmet());
app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use(morgan('dev'));

// Rate limiter <simple> 
const limiter = rateLimit({ // search this snippet on the internet 
  windowMs: 15 * 60 * 1000,
  max: 200
});

app.use(limiter());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});


// Connect to Mongo and start server
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notebookium_dev';
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });


connectDB();