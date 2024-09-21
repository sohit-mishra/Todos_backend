const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI;
console.log('MongoDB URI:', URI); // Check if the URI is logged correctly

const connectToDatabase = mongoose.connect(URI);

module.exports = connectToDatabase;
