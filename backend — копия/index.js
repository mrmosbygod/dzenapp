const express = require('express');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const cors = require('cors');

const app = express();

app.use(cors()); 
app.use(express.json());

const users = [];
const SECRET_KEY = 'your_jwt_secret_key';

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        if (users.find(u => u.username === username)) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: users.length + 1, username, password: hashedPassword };
        users.push(newUser);
        console.log('New user registered:', newUser);
        console.log('All users:', users);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        console.log(`Login attempt for user: ${username}`);
        console.log('Current users:', users);
        const user = users.find(u => u.username === username);
        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Login failed: Invalid password.');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        console.log('Login successful, token generated.');
        res.status(200).json({ message: 'Logged in successfully!', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Token not provided.' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

const videos = [
    { id: 1, title: 'Free Yoga Basics', description: 'Learn the fundamentals of yoga.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'free' },
    { id: 2, title: 'Advanced HIIT Workout', description: 'High-intensity interval training for advanced users.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'paid' },
    { id: 3, title: 'Beginner Cardio', description: 'Easy cardio exercises for beginners.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'free' },
    { id: 4, title: 'Strength Training Pro', description: 'Build muscle with professional techniques.', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', type: 'paid' }
];

app.get('/videos', (req, res) => {
    const videosList = videos.map(video => {
        if (video.type === 'paid') {
            return { ...video, url: undefined };
        }
        return video;
    });
    res.json(videosList);
});

// Исправленный маршрут для получения одного видео
app.get('/videos/:id', authenticateToken, (req, res) => {
    const videoId = parseInt(req.params.id);
    const video = videos.find(v => v.id === videoId);

    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }

    // Если видео платное, всегда отказываем в доступе, так как системы оплаты еще нет.
    if (video.type === 'paid') {
        return res.status(403).json({ message: 'Access denied. Please purchase the video to watch.' });
    }

    // Для бесплатных видео возвращаем полный объект с URL
    res.json(video);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
