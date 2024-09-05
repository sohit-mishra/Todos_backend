const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI

const connectToDatabase = async()=>{
    try {
        await mongoose.connect(URI) ;
        console.log("Database is connect");
    } catch (error) {
        console.log(error); 
    }
}


module.exports = connectToDatabase;