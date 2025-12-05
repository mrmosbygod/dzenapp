import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './App.css';

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
            <Route path="/videos" element={<Videos />} />
            <Route path="/videos/:id" element={<VideoDetail token={token} />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </main>

        <footer className="App-footer">
            <Link to="/terms">Пользовательское соглашение</Link>
            <Link to="/contacts">Контакты</Link>
        </footer>
      </div>
    </Router>
  );
}

// --- Компоненты страниц ---

function Home() {
  return (
    <div>
      <h2>Онлайн-уроки фитнеса</h2>
      <p>Ваш путь к здоровому и гибкому телу начинается здесь.</p>
    </div>
  );
}

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage('Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage(error.toString());
        }
    };

    return (
        <div>
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <div><label>Имя пользователя:</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div><label>Пароль:</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button type="submit">Зарегистрироваться</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            onLogin(data.token, username);
            navigate('/videos');
        } catch (error) {
            setMessage(error.toString());
        }
    };

    return (
        <div>
            <h2>Вход</h2>
            <form onSubmit={handleSubmit}>
                <div><label>Имя пользователя:</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div><label>Пароль:</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button type="submit">Войти</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

function Videos() {
    const [videos, setVideos] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch('/videos');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                setVideos(data);
            } catch (error) {
                setMessage(error.toString());
            }
        };
        fetchVideos();
    }, []);

    return (
        <div>
            <h2>Доступные видеоуроки</h2>
            {message && <p>{message}</p>}
            <div className="video-list">
                {videos.map(video => (
                    <div key={video.id} className="video-item">
                        <h3>{video.title}</h3>
                        <p>{video.description}</p>
                        {video.type === 'paid' && <p className="price">Цена: {video.price} руб.</p>}
                        <Link to={`/videos/${video.id}`} className="view-button">
                            {video.type === 'free' ? 'Смотреть бесплатно' : 'Подробнее'}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VideoDetail({ token }) {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVideo = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`/videos/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                setVideo(data);
            } catch (error) {
                setMessage(error.toString());
            }
        };
        fetchVideo();
    }, [id, token, navigate]);

    if (message) {
        return (
            <div>
                <h2>Доступ ограничен</h2>
                <p>{message}</p>
                <p>После успешной оплаты видео будет доступно для просмотра в этом разделе.</p>
            </div>
        );
    }
    
    if (!video) return <div>Загрузка...</div>;

    return (
        <div>
            <h2>{video.title}</h2>
            <p>{video.description}</p>
            <video controls width="100%" key={video.url}>
                <source src={video.url} type="video/mp4" />
                Ваш браузер не поддерживает видео.
            </video>
        </div>
    );
}

function Terms() {
    return (
        <div style={{textAlign: 'left'}}>
            <h2>Публичная оферта на оказание информационно-консультационных услуг</h2>
            <p>
                Настоящий документ представляет собой официальное предложение (публичную оферту)
                Самозанятого Зенкова Антона Ивановича (ИНН 780109548557), именуемого в дальнейшем «Исполнитель»,
                любому физическому лицу, именуемому в дальнейшем «Пользователь», совместно именуемые «Стороны».
            </p>
            <h4>1. Общие положения</h4>
            <p>1.1. Настоящая оферта определяет условия предоставления Исполнителем информационно-консультационных услуг в виде доступа к авторским видеоматериалам (далее – «Услуги») на возмездной и безвозмездной основе.</p>
            <p>1.2. Акцептом (полным и безоговорочным принятием) настоящей оферты является совершение Пользователем оплаты за платные Услуги или начало использования бесплатных материалов, размещенных на Сайте. Акцепт оферты означает, что Пользователь полностью согласен со всеми положениями настоящего Соглашения.</p>
            <p>1.3. Сайт – совокупность программных и аппаратных средств для ЭВМ, обеспечивающих публикацию данных в сети Интернет по адресу [АДРЕС ВАШЕГО БУДУЩЕГО САЙТА].</p>
            
            <h4>2. Предмет оферты</h4>
            <p>2.1. Исполнитель обязуется предоставить Пользователю доступ к предварительно выбранным и оплаченным видеоматериалам (платные Услуги) или к материалам в свободном доступе (бесплатные Услуги) посредством сети Интернет на данном Сайте.</p>
            <p>2.2. Пользователь обязуется оплачивать платные Услуги в соответствии с ценами, указанными на Сайте.</p>

            <h4>3. Порядок предоставления услуг</h4>
            <p>3.1. Доступ к платным видеоматериалам предоставляется Пользователю в его личном кабинете на Сайте после подтверждения факта оплаты.</p>
            <p>3.2. Пользователь осознает, что Услуги предоставляются «как есть» и не несут гарантий достижения каких-либо спортивных или иных результатов.</p>
            <p>3.3. Исполнитель не несет ответственности за возможные травмы или вред здоровью, полученные Пользователем во время или в результате выполнения упражнений. Пользователь обязан самостоятельно оценивать состояние своего здоровья и консультироваться с врачом перед началом тренировок.</p>

            <h4>4. Стоимость услуг и порядок расчетов</h4>
            <p>4.1. Стоимость Услуг указывается на Сайте рядом с описанием каждого платного видеокурса. Цены указаны в рублях РФ.</p>
            <p>4.2. Оплата производится через платежный сервис YooKassa в соответствии с правилами данного сервиса.</p>
            
            <h4>5. Реквизиты исполнителя</h4>
            <p>Самозанятый Зенков Антон Иванович</p>
            <p>ИНН: 780109548557</p>
            <p>Email: mrmosbygod@gmail.com</p>
        </div>
    );
}

function Contacts() {
    return (
        <div style={{textAlign: 'left'}}>
            <h2>Контакты</h2>
            <p>Вы можете связаться со мной по следующим контактам:</p>
            <ul>
                <li><strong>ФИО:</strong> Зенков Антон Иванович</li>
                <li><strong>Статус:</strong> Самозанятый</li>
                <li><strong>ИНН:</strong> 780109548557</li>
                <li><strong>Электронная почта:</strong> mrmosbygod@gmail.com</li>
                <li><strong>Телефон:</strong> +7 (952) 272-63-07</li>
                <li><strong>Почтовый адрес:</strong> 199106, г. Санкт-Петербург, Косая линия, д. 24/25</li>
            </ul>
        </div>
    );
}

export default App;
