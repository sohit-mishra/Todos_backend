const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI;
console.log('MongoDB URI:', URI); // Check if the URI is logged correctly

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Database is connected");
  } catch (error) {
    console.log("Error connecting to the database:", error);
  }
};

module.exports = connectToDatabase;
