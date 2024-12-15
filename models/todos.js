const mongoose = require('mongoose');
const User = require('../models/user');

const todoSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    userId: {
        type: String, 
        required: true
    }
}, { timestamps: true });

const Todos = mongoose.model('Todos', todoSchema);

module.exports = Todos;
