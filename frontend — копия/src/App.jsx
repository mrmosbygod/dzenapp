 import { useState, useEffect } from 'react' // Добавлено useEffect
      import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'; //
       Добавлено useParams
      import './App.css'
     
      function App() {
        const [token, setToken] = useState(localStorage.getItem('token') || '');
        const [username, setUsername] = useState(localStorage.getItem('username') || '');
     
        const handleLogin = (newToken, newUsername) => {
         setToken(newToken);
         setUsername(newUsername);
         localStorage.setItem('token', newToken);
         localStorage.setItem('username', newUsername);
       };
    
       const handleLogout = () => {
         setToken('');
         setUsername('');
         localStorage.removeItem('token');
         localStorage.removeItem('username');
       };
    
       return (
         <Router>
           <div className="App">
             <header className="App-header">
               <nav>
                 <Link to="/">Главная</Link>
                 {!token ? (
                   <>
                     <Link to="/register">Регистрация</Link>
                     <Link to="/login">Вход</Link>
                   </>
                 ) : (
                   <>
                     <span>Привет, {username}!</span>
                     <Link to="/videos">Видеоуроки</Link>
                     <button onClick={handleLogout}>Выход</button>
                   </>
                 )}
               </nav>
             </header>
    
             <main>
               <Routes>
                 <Route path="/" element={<Home />} />
                 <Route path="/register" element={<Register />} />
                 <Route path="/login" element={<Login onLogin={handleLogin} />} />
                 <Route path="/videos" element={<Videos token={token} />} />
                 <Route path="/videos/:id" element={<VideoDetail token={token} />} />
               </Routes>
             </main>
           </div>
         </Router>
       );
     }
    
     // Home Component
     function Home() {
       return (
         <div>
           <h2>Добро пожаловать в Fitness App!</h2>
           <p>Ваш путь к здоровому образу жизни начинается здесь.</p>
         </div>
       );
     }
    
     // Register Component
     function Register() {
       const [username, setUsername] = useState('');
       const [password, setPassword] = useState('');
       const [message, setMessage] = useState('');
       const navigate = useNavigate();
    
       const handleSubmit = async (e) => {
         e.preventDefault();
         try {
           const response = await fetch('http://localhost:3000/register', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ username, password }),
           });
           const data = await response.json();
           setMessage(data.message);
           if (response.ok) {
             navigate('/login');
           }
         } catch (error) {
           setMessage('Ошибка регистрации.');
           console.error('Error:', error);
         }
       };
    
       return (
         <div>
           <h2>Регистрация</h2>
           <form onSubmit={handleSubmit}>
             <div>
               <label>Имя пользователя:</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label>Пароль:</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit">Зарегистрироваться</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      );
    }
   
    // Login Component
    function Login({ onLogin }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [message, setMessage] = useState('');
      const navigate = useNavigate();
   
      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const data = await response.json();
          setMessage(data.message);
          if (response.ok) {
            onLogin(data.token, username);
            navigate('/videos');
          }
        } catch (error) {
          setMessage('Ошибка входа.');
          console.error('Error:', error);
        }
      };
   
      return (
        <div>
          <h2>Вход</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Имя пользователя:</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label>Пароль:</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit">Войти</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      );
    }
   
    // Videos Component
    function Videos({ token }) {
      const [videos, setVideos] = useState([]);
      const [message, setMessage] = useState('');
   
      useEffect(() => {
        const fetchVideos = async () => {
          try {
            const response = await fetch('http://localhost:3000/videos', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            if (response.ok) {
              setVideos(data);
            } else {
              setMessage(data.message);
            }
          } catch (error) {
            setMessage('Ошибка загрузки видео.');
            console.error('Error:', error);
          }
        };
   
        fetchVideos();
      }, [token]);
   
      return (
        <div>
          <h2>Доступные видеоуроки</h2>
          {message && <p>{message}</p>}
          <div className="video-list">
            {videos.map(video => (
              <div key={video.id} className="video-item">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
                {video.type === 'free' ? (
                  <Link to={`/videos/${video.id}`}>Смотреть бесплатно</Link>
                ) : (
                  token ? (
                    <Link to={`/videos/${video.id}`}>Смотреть (требуется оплата)</Link>
                  ) : (
                    <p>Войдите, чтобы просмотреть платный контент</p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
   
    // VideoDetail Component
    function VideoDetail({ token }) {
      const { id } = useParams();
      const [video, setVideo] = useState(null);
      const [message, setMessage] = useState('');
   
      useEffect(() => {
        const fetchVideo = async () => {
          try {
            const response = await fetch(`http://localhost:3000/videos/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            if (response.ok) {
              setVideo(data);
            } else {
              setMessage(data.message);
            }
          } catch (error) {
            setMessage('Ошибка загрузки видео.');
            console.error('Error:', error);
          }
        };
   
        if (token) {
          fetchVideo();
        } else {
          setMessage('Пожалуйста, войдите, чтобы получить доступ к видео.');
        }
      }, [id, token]);
   
      if (!video) {
        return <div>{message || 'Загрузка видео...'}</div>;
      }
   
      return (
        <div>
          <h2>{video.title}</h2>
          <p>{video.description}</p>
          {video.url ? (
            <video controls width="100%">
              <source src={video.url} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          ) : (
            <p>{message || 'Доступ к видео ограничен.'}</p>
          )}
        </div>
      );
    }
   
    export default App