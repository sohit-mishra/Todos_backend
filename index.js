const express = require('express');
const connectToDatabase = require('./config/db');
const User = require('./models/user');
const Todos = require('./models/todos');
const Message = require('./models/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

connectToDatabase();

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const requiredEnvVars = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'CORS_ORIGIN'];
requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

app.get('/api', (req, res) => {
    res.status(200).json({ message: "Hello World" });
});

app.post('/api/signup', async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, Email, and Password are required." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        next(error);
    }
});

app.post('/api/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and Password are required." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const accessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: existingUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.status(200).json({ accessToken, refreshToken, userId: existingUser._id });
    } catch (error) {
        next(error);
    }
});

app.post('/api/token', async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token missing." });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const existingUser = await User.findById(decoded.userId);
        if (!existingUser) {
            return res.status(403).json({ message: "Invalid refresh token." });
        }
        const newAccessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        next(error);
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({ message: "Logged out successfully." });
});

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token." });
    }
};

app.get('/api/todos/:userId', authMiddleware, async (req, res, next) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const todos = await Todos.find({ userId }).skip(skip).limit(limit);
        const total = await Todos.countDocuments({ userId });
        res.status(200).json({ todos, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
});

app.post('/api/todos', authMiddleware, async (req, res, next) => {
    try {
        const todo = new Todos(req.body);
        const result = await todo.save();
        res.status(201).json({ todo: result });
    } catch (error) {
        next(error);
    }
});

app.post('/api/message', async (req, res, next) => {
    try {
        const message = new Message(req.body);
        const result = await message.save();
        res.status(201).json({ message: "Message saved successfully", data: result });
    } catch (error) {
        next(error);
    }
});

app.patch('/api/todos/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await Todos.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!result) {
            return res.status(404).json({ message: "Todo not found." });
        }
        res.status(200).json({ message: "Updated successfully", todo: result });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/todos/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await Todos.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: "Todo not found." });
        }
        res.status(200).json({ message: "Todo deleted successfully." });
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.use((req, res) => {
    res.status(404).json({ message: "404 - Not Found" });
});

app.listen(PORT, () => {
    console.log(`Server is working at http://localhost:${PORT}`);
});
