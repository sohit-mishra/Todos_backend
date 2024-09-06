const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true })

const todos = mongoose.model('todos', schema);

module.exports = todos;
