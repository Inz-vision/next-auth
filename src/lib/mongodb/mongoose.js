import mongoose from 'mongoose';

let initialized = false;

export const connect = async () => {
  mongoose.set('strictQuery', true);

  if (initialized) {
    console.log('MongoDB already connected');
    return mongoose.connection; // Return the existing connection
  }

  import mongoose from 'mongoose';

let initialized = false;

export const connect = async () => {
  mongoose.set('strictQuery', true);

  if (initialized) {
    console.log('MongoDB already connected');
    return mongoose.connection; // Return the existing connection
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'next-auth-app',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    initialized = true;
    return connection; // Return the new connection
  } catch (error) {
    console.log('MongoDB connection error:', error);
    throw error; // Re-throw the error for better error handling upstream
  }
};
};