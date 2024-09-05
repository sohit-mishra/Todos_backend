const express = require('express');
const connectToDatabase = require('./config/db');
const user = require('./models/user');
const Todos = require('./models/todos');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const PORT = process.env.PORT;

connectToDatabase();
app.use(express.json());
app.use(cookieParser());

app.get('/api', (req, res) => {
    try {
        res.status(200).send("Hello World");
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await user.findOne({ email });

        if (existingUser) {
            return res.status(400).send("User already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new user({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).send({ message: "User created successfully", user: newUser });

    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await user.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const accessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: existingUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/token', async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).send("Refresh token missing.");
    }
    try {
        
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('start',{ _id: decoded.userId, refreshToken });

        let existingUser = await user.findOne({ _id: decoded.userId});

        if (!existingUser) {
            return res.status(403).send("Invalid refresh token.");
        }

        const newAccessToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/api/logout', async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).send("Refresh token missing.");
    }
    try {
        await user.updateOne({ refreshToken }, { $unset: { refreshToken: "" } });
        res.clearCookie('refreshToken');
        res.status(200).send("Logged out successfully.");
    } catch (error) {
        res.status(500).send(error);
    }
});

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json("Access denied. No token provided.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        res.status(401).json(error);
    }
};

app.get('/api/todos', authMiddleware, async (req, res) => {
    try {
        const todos = await Todos.find();
        res.status(200).send(todos);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/api/todos', authMiddleware, async (req, res) => {
    const data = req.body;
    try {
        const todo = new Todos(data);
        const result = await todo.save();
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.patch('/api/todos/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    try {
        const result = await Todos.findByIdAndUpdate(id, updates, { new: true });

        if (!result) {
            return res.status(404).send("Todo not found");
        }

        res.status(200).send("Update successfully");
    } catch (error) {
        res.status(500).send(error);
    }
});

app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    try {
        const result = await Todos.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).send("Todo not found");
        }

        res.status(200).send("Todo deleted successfully");
    } catch (error) {
        res.status(500).send(error);
    }
});

app.use((req, res) => {
    res.status(404).send("404 - Not Found");
});

app.listen(PORT || 3000, () => {
    console.log("Server is working at http://localhost:" + (PORT || 3000));
});
