require('dotenv').config(); 
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// --- РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ FRONTEND ---
app.use(express.static(path.join(__dirname, 'public')));
// -----------------------------------------

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- СЕКРЕТНЫЙ КЛЮЧ ДЛЯ JWT ---
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
}
// ---------------------------------

// Инициализация базы данных
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                purchases TEXT DEFAULT '[]'
            );
        `);
        console.log('Database initialized: users table ensured.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}
initDb();

const videos = [
    { id: 1, title: 'Free Yoga Basics', description: 'Learn the fundamentals of yoga.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'free' },
    { id: 2, title: 'Advanced HIIT Workout', description: 'High-intensity interval training for advanced users.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'paid' },
    { id: 3, title: 'Beginner Cardio', description: 'Easy cardio exercises for beginners.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'free' },
    { id: 4, title: 'Strength Training Pro', description: 'Build muscle with professional techniques.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'paid' }
];

// --- API Маршруты ---

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, purchases) VALUES ($1, $2, $3) RETURNING id;',
            [username, hashedPassword, '[]']
        );
        res.status(201).json({ message: 'User registered successfully!', userId: result.rows[0].id });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'User already exists.' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const result = await pool.query('SELECT id, username, password_hash, purchases FROM users WHERE username = $1;', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Logged in successfully!', token, userId: user.id });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Token not provided.' });
    }
    jwt.verify(token, SECRET_KEY, async (err, decodedUser) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        try {
            const result = await pool.query('SELECT id, username, purchases FROM users WHERE id = $1;', [decodedUser.id]);
            const user = result.rows[0];
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            req.user = { 
                id: user.id, 
                username: user.username, 
                purchases: JSON.parse(user.purchases || '[]')
            };
            next();
        } catch (dbError) {
            console.error('Database error in authenticateToken:', dbError);
            res.status(500).json({ message: 'Authentication error.' });
        }
    });
};

app.get('/videos', (req, res) => {
    const videosList = videos.map(video => {
        if (video.type === 'paid') {
            return { ...video, url: undefined };
        }
        return video;
    });
    res.json(videosList);
});

app.get('/videos/:id', authenticateToken, async (req, res) => {
    const videoId = parseInt(req.params.id);
    const video = videos.find(v => v.id === videoId);
    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }
    if (video.type === 'paid') {
        const hasPurchased = req.user.purchases.includes(videoId);
        if (!hasPurchased) {
            return res.status(403).json({ message: 'Access denied. Please purchase the video to watch.' });
        }
    }
    res.json(video);
});

// --- Обработка роутинга React ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
