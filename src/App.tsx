import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  ClipboardList, Heart, Home, LogOut, MessageCircle, MoreHorizontal, Plus,
  Search, ShieldCheck, Users, Eye, EyeOff
} from 'lucide-react'

type User = {
  id: string
  username: string
  displayName: string
  role: string
  createdAt?: string
}

type AuthMode = 'login' | 'register'

const API = '/api'

function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(mode === 'register'
          ? { username, displayName, password, schoolCode }
          : { username, password })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Не вдалося виконати запит.')
      if (data.user) onAuthenticated(data.user)
      else setNotice('Запит виконано.')
    } catch (err) {
      setError(err instanceof Error
        ? err.message
        : 'Не вдалося з’єднатися із сервером. Перевір підключення та спробуй ще раз.')
    } finally {
      setBusy(false)
    }
  }

  function changeMode(next: AuthMode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  return (
    <section className="auth-layout">
      <div className="auth-aside">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-aside-content">
          <span className="auth-eyebrow">СЛОБІДСЬКИЙ ЛІЦЕЙ №2</span>
          <h1>Твоя школа.<br /><i>Твій простір.</i></h1>
          <p>Місце для ідей, шкільних новин і спільних рішень. Усе важливе для нашої спільноти — поруч.</p>
          <div className="auth-assurance"><ShieldCheck size={16} /> Закрита спільнота ліцею</div>
        </div>
        <div className="auth-aside-foot"><span>SFERIO / 2026</span><span>01 — COMMUNITY</span></div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-brand"><span className="wordmark-symbol">s<span>.</span></span><span className="wordmark-name">sferio</span></div>
          <div className="auth-heading">
            <span className="auth-overline">{mode === 'login' ? 'РАДІ БАЧИТИ ЗНОВУ' : 'СТВОРЕННЯ АКАУНТА'}</span>
            <h2>{mode === 'login' ? 'Увійти до SFERIO' : 'Приєднатися до нас'}</h2>
            <p>{mode === 'login' ? 'Введи свій логін і пароль, щоб продовжити.' : 'Створи акаунт, використовуючи код доступу ліцею.'}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Тип авторизації">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'selected' : ''} onClick={() => changeMode('login')}>Вхід</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'selected' : ''} onClick={() => changeMode('register')}>Реєстрація</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>Логін
              <input autoComplete="username" minLength={mode === 'register' ? 3 : 1} maxLength={24} required value={username} onChange={e => setUsername(e.target.value)} placeholder="Твій логін" />
              {mode === 'register' && <small>Латинські літери, цифри, крапка, дефіс або нижнє підкреслення</small>}
            </label>
            {mode === 'register' && <label>Ім’я у SFERIO
              <input autoComplete="nickname" minLength={2} maxLength={40} required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Як тебе показувати іншим" />
            </label>}
            <label>Пароль
              <div className="password-field">
                <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 10 : 1} maxLength={128} required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Щонайменше 10 символів' : 'Твій пароль'} />
                <button type="button" aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>
            {mode === 'register' && <label>Код доступу ліцею
              <input autoComplete="off" required value={schoolCode} onChange={e => setSchoolCode(e.target.value)} placeholder="Введи код, отриманий у ліцеї" />
              <small>Код поширюється всередині ліцею. Не публікуй його.</small>
            </label>}
            {error && <div className="auth-message error" role="alert">{error}</div>}
            {notice && <div className="auth-message success" role="status">{notice}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Зачекай…' : mode === 'login' ? 'Увійти' : 'Створити акаунт'} <ArrowUpRight size={17} /></button>
          </form>
          <div className="auth-privacy"><ShieldCheck size={14} /><span>Не просимо номер телефону, пошту чи інші зайві персональні дані.</span></div>
          <p className="auth-help">Не можеш увійти? Звернися до класного керівника або адміністратора ліцею.</p>
        </div>
      </div>
    </section>
  )
}

function MemberHome({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <main className="member-shell">
      <header className="member-header">
        <a className="wordmark" href="#"><span className="wordmark-symbol">s<span>.</span></span><span className="wordmark-name">sferio</span></a>
        <span className="member-school"><span className="school-dot" /> Слобідський ліцей №2</span>
        <div className="member-user"><span className="member-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span>{user.displayName}</span><button onClick={onLogout} title="Вийти"><LogOut size={16} /></button></div>
      </header>
      <section className="member-welcome">
        <span className="auth-overline">ТВОЯ ШКІЛЬНА СПІЛЬНОТА</span>
        <h1>Привіт, {user.displayName}.</h1>
        <p>Твій акаунт SFERIO створено. Простір поступово наповнюватиметься можливостями.</p>
        <div className="member-status"><Check size={16} /> Ти увійшов до SFERIO</div>
      </section>
      <section className="member-empty">
        <div className="member-empty-icon"><Users size={25} /></div>
        <h2>Тут з’явиться життя ліцею</h2>
        <p>Стрічка дописів, сторінки класів, голосування та шкільні події будуть додані наступними етапами.</p>
      </section>
      <footer className="member-footer"><span>SFERIO · Слобідський ліцей №2</span><span>Акаунт: @{user.username}</span></footer>
    </main>
  )
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="site">
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="SFERIO"><span className="wordmark-symbol">s<span>.</span></span><span className="wordmark-name">sferio</span></a>
        <div className="school-name"><span className="school-dot" /> Слобідський ліцей №2</div>
        <nav className="header-nav" aria-label="Головна навігація"><a href="#space">Про простір</a><a href="#inside">Можливості</a></nav>
        <button className="header-login" onClick={onLogin}>Увійти <ArrowUpRight size={15} /></button>
      </header>
      <section className="intro">
        <div className="intro-copy">
          <div className="kicker"><span>01</span> ШКІЛЬНА СПІЛЬНОТА ОНЛАЙН</div>
          <h1>Ліцей не закінчується<br />після <i>дзвінка.</i></h1>
          <p className="intro-text">SFERIO — місце, де учні нашого ліцею діляться новинами, обговорюють ідеї, стежать за подіями та разом вирішують важливе.</p>
          <div className="intro-links"><button className="solid-link" onClick={onLogin}>Увійти до SFERIO <ArrowUpRight size={16} /></button><span className="private-note"><ShieldCheck size={15} /> Тільки для спільноти ліцею</span></div>
          <div className="intro-index"><span>СЛОБІДСЬКИЙ ЛІЦЕЙ №2</span><span>01 / 04</span></div>
        </div>
        <div className="product-stage" id="space">
          <div className="stage-label"><span>ПОПЕРЕДНІЙ ВИГЛЯД</span><span>DESKTOP / 01</span></div>
          <div className="app-window">
            <aside className="app-rail"><div className="rail-logo">s.</div><div className="rail-items"><span className="rail-active"><Home size={17} /></span><span><Users size={17} /></span><span><ClipboardList size={17} /></span><span><CalendarDays size={17} /></span></div><span className="rail-help"><CircleHelp size={17} /></span></aside>
            <div className="app-main">
              <div className="app-topline"><div className="app-school">Слобідський ліцей №2 <ChevronDown size={13} /></div><div className="app-top-actions"><Search size={16} /><Bell size={16} /><span className="user-circle">М</span></div></div>
              <div className="app-content">
                <div className="feed-column">
                  <div className="feed-heading"><div><span className="feed-overline">ПРИКЛАД СТРІЧКИ</span><h2>Що нового?</h2></div><span className="feed-filter">Уся школа <ChevronDown size={12} /></span></div>
                  <div className="composer"><span className="composer-avatar">М</span><span>Поділитися чимось зі школою...</span><Plus size={17} /></div>
                  <article className="feed-post"><div className="post-meta"><span className="author-avatar">УС</span><div><b>Учнівське самоврядування</b><small>Оголошення · приклад</small></div><MoreHorizontal className="post-more" size={18} /></div><div className="post-copy"><span className="post-tag">ВАЖЛИВО</span><h3>Є ідея для ліцею? Розкажи про неї.</h3><p>Збираємо пропозиції учнів до наступної зустрічі самоврядування. Можна запропонувати подію, зміни у просторі або власний проєкт.</p></div><div className="post-actions"><span><Heart size={15} /> 18</span><span><MessageCircle size={15} /> 6 коментарів</span><span className="post-open">Приклад <ArrowUpRight size={13} /></span></div></article>
                  <div className="feed-post second-post"><div className="post-meta"><span className="author-avatar class-avatar">9</span><div><b>9-А · класна сторінка</b><small>Приклад допису</small></div><MoreHorizontal className="post-more" size={18} /></div><p className="second-copy">Нагадуємо: у п’ятницю збираємо книжки для шкільного обміну 📚</p><div className="post-actions"><span><Heart size={15} /> 12</span><span><MessageCircle size={15} /> 3 коментарі</span></div></div>
                </div>
                <aside className="app-side"><div className="side-block"><div className="side-title">НАЙБЛИЖЧЕ <ArrowUpRight size={13} /></div><div className="event-date"><b>07</b><span>ЛИСТОПАДА</span></div><h4>Зустріч учнівського самоврядування</h4><p>П’ятниця · актова зала</p></div><div className="side-block vote-block"><div className="side-title">ГОЛОСУВАННЯ <span className="live-dot" /></div><h4>Яку тему оберемо для наступного тижня?</h4><div className="vote-option"><span>День без рюкзаків</span><span>42%</span></div><div className="vote-bar"><i style={{ width: '42%' }} /></div><div className="vote-option"><span>Тематичний одяг</span><span>35%</span></div><div className="vote-bar"><i style={{ width: '35%' }} /></div><div className="vote-option"><span>Кіноперерва</span><span>23%</span></div><div className="vote-bar"><i style={{ width: '23%' }} /></div><small className="vote-foot">Приклад опитування</small></div></aside>
              </div>
              <div className="app-bottom"><span className="bottom-current"><Home size={13} /> Головна</span><span><Users size={13} /> Спільнота</span><span><ClipboardList size={13} /> Рішення</span><span><CalendarDays size={13} /> Події</span></div>
            </div>
          </div>
          <div className="stage-caption"><span>Так може виглядати твій шкільний простір</span><span>КОНЦЕПТ ІНТЕРФЕЙСУ</span></div>
        </div>
      </section>
      <section className="inside" id="inside"><div className="inside-heading"><div className="kicker"><span>02</span> ЩО Є ВСЕРЕДИНІ</div><h2>Не просто стрічка.<br /><i>Спільні справи.</i></h2></div><div className="inside-list"><article><span className="inside-number">01</span><div><h3>Спілкування всієї школи</h3><p>Дописи, коментарі й обговорення в одному спільному просторі.</p></div><MessageCircle size={19} /></article><article><span className="inside-number">02</span><div><h3>Сторінки класів</h3><p>Оголошення, новини та своє коло однокласників.</p></div><Users size={19} /></article><article><span className="inside-number">03</span><div><h3>Голосування та ініціативи</h3><p>Можливість висловитися й долучитися до рішень ліцею.</p></div><Check size={19} /></article><article><span className="inside-number">04</span><div><h3>Події та оголошення</h3><p>Важливе шкільне життя не губиться в загальних чатах.</p></div><CalendarDays size={19} /></article></div></section>
      <section className="access-strip"><div><span className="kicker"><span>03</span> ЗАКРИТА СПІЛЬНОТА</span><h2>Свій простір для своїх.</h2></div><p>Доступ до SFERIO матимуть учні та працівники Слобідського ліцею №2. Реєстрація — за спеціальним кодом, який поширюється всередині ліцею.</p><span className="access-icon"><ShieldCheck size={22} /></span></section>
      <footer className="site-footer"><a className="wordmark footer-mark" href="#"><span className="wordmark-symbol">s<span>.</span></span><span className="wordmark-name">sferio</span></a><span>Слобідський ліцей №2</span><span>Простір нашої спільноти.</span></footer>
    </main>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (active && data?.user) setUser(data.user) })
      .catch(() => undefined)
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  async function logout() {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }) } catch { /* session expires server-side */ }
    setUser(null)
    setShowAuth(false)
  }

  if (checking) return <div className="app-loading"><span className="loading-mark">s.</span><span>Завантажуємо SFERIO</span></div>
  if (user) return <MemberHome user={user} onLogout={logout} />
  if (showAuth) return <><button className="auth-back" onClick={() => setShowAuth(false)}>← На головну</button><AuthPanel onAuthenticated={setUser} /></>
  return <LandingPage onLogin={() => setShowAuth(true)} />
}

export default App
