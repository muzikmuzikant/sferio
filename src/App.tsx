import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  ClipboardList, Heart, Home, LogOut, MessageCircle, MoreHorizontal, Plus,
  Search, ShieldCheck, Users, Eye, EyeOff, ImagePlus, X
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

type FeedPhoto = { id: string; mime_type: string; width: number; height: number }
type FeedPost = {
  id: string
  body: string
  created_at: string
  author_name: string
  author_username: string
  comment_count: number
  reaction_count: number
  my_reaction: string | null
  photos: FeedPhoto[]
}
type FeedComment = {
  id: string
  body: string
  created_at: string
  author_name: string
  author_username: string
}

function MemberHome({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [draft, setDraft] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoError, setPhotoError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [sendingComment, setSendingComment] = useState<string | null>(null)

  async function loadPosts() {
    setError('')
    try {
      const response = await fetch('/api/posts', { credentials: 'include' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Не вдалося завантажити стрічку.')
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити стрічку.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadPosts() }, [])

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files || [])
    setPhotoError('')
    if (chosen.length > 5) {
      setPhotoError('В одному дописі можна додати не більше 5 фото.')
      event.target.value = ''
      return
    }
    const invalid = chosen.find(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    if (invalid) {
      setPhotoError('Дозволені лише JPG, PNG та WebP.')
      event.target.value = ''
      return
    }
    const tooLarge = chosen.find(file => file.size > 2 * 1024 * 1024)
    if (tooLarge) {
      setPhotoError('Кожне фото має бути розміром до 2 МБ.')
      event.target.value = ''
      return
    }
    setSelectedPhotos(chosen)
    event.target.value = ''
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ((!draft.trim() && selectedPhotos.length === 0) || sending) return
    setSending(true)
    setError('')
    setPhotoError('')
    try {
      let response: Response
      if (selectedPhotos.length) {
        const formData = new FormData()
        formData.append('body', draft.trim())
        selectedPhotos.forEach(file => formData.append('photos', file))
        response = await fetch('/api/posts/with-photos', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })
      } else {
        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ body: draft.trim() })
        })
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Не вдалося опублікувати допис.')
      setDraft('')
      setSelectedPhotos([])
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося опублікувати допис.')
    } finally {
      setSending(false)
    }
  }

  async function toggleReaction(post: FeedPost) {
    try {
      const response = await fetch('/api/posts/' + post.id + '/reaction', {
        method: post.my_reaction ? 'DELETE' : 'PUT',
        headers: post.my_reaction ? undefined : { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: post.my_reaction ? undefined : JSON.stringify({ reaction: 'like' })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не вдалося змінити реакцію.')
      }
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося змінити реакцію.')
    }
  }

  async function toggleComments(postId: string) {
    const willOpen = !openComments[postId]
    setOpenComments(current => ({ ...current, [postId]: willOpen }))
    if (willOpen && !comments[postId]) {
      try {
        const response = await fetch('/api/posts/' + postId + '/comments', { credentials: 'include' })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Не вдалося завантажити коментарі.')
        setComments(current => ({ ...current, [postId]: data.comments || [] }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити коментарі.')
      }
    }
  }

  async function createComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault()
    const body = (commentDrafts[postId] || '').trim()
    if (!body || sendingComment) return
    setSendingComment(postId)
    try {
      const response = await fetch('/api/posts/' + postId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Не вдалося додати коментар.')
      setComments(current => ({ ...current, [postId]: [...(current[postId] || []), data.comment] }))
      setCommentDrafts(current => ({ ...current, [postId]: '' }))
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати коментар.')
    } finally {
      setSendingComment(null)
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  }

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
        <p>Ділись новинами, підтримуй ідеї та будь у курсі життя ліцею.</p>
      </section>
      <section className="feed-workspace">
        <div className="feed-main-column">
          <form className="real-composer" onSubmit={createPost}>
            <div className="real-composer-top">
              <span className="member-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={5000} rows={3} placeholder="Чим хочеш поділитися зі школою?" aria-label="Текст допису" />
            </div>
            {selectedPhotos.length > 0 && <div className="selected-photos">{selectedPhotos.map((photo, index) => <div className="selected-photo" key={photo.name + index}><ImagePlus size={13} /><span>{photo.name}</span><small>{(photo.size / 1024 / 1024).toFixed(2)} МБ</small><button type="button" onClick={() => setSelectedPhotos(current => current.filter((_, i) => i !== index))} aria-label="Прибрати фото"><X size={13} /></button></div>)}</div>}
            {photoError && <div className="photo-error" role="alert">{photoError}</div>}
            <div className="real-composer-bottom"><div className="composer-tools"><label className="photo-picker"><ImagePlus size={15} /> Додати фото<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choosePhotos} /></label><span>{draft.length}/5000 · {selectedPhotos.length}/5 фото</span></div><button type="submit" disabled={(!draft.trim() && selectedPhotos.length === 0) || sending}>{sending ? 'Публікуємо…' : 'Опублікувати'} <ArrowUpRight size={15} /></button></div>
          </form>
          {error && <div className="feed-error" role="alert">{error}</div>}
          <div className="real-feed-heading"><div><span className="auth-overline">СПІЛЬНИЙ ПРОСТІР</span><h2>Стрічка ліцею</h2></div><button onClick={() => void loadPosts()} className="feed-refresh">Оновити</button></div>
          {loading ? <div className="feed-placeholder">Завантажуємо дописи…</div> : posts.length === 0 ? (
            <div className="feed-placeholder"><div className="member-empty-icon"><MessageCircle size={22} /></div><h3>Поки що тут тихо</h3><p>Створи перший допис для спільноти ліцею.</p></div>
          ) : posts.map(post => (
            <article className="real-post" key={post.id}>
              <div className="real-post-head"><span className="member-avatar post-avatar">{post.author_name.slice(0, 1).toUpperCase()}</span><div><b>{post.author_name}</b><small>@{post.author_username} · {formatDate(post.created_at)}</small></div><button className="post-menu" title="Додаткові дії"><MoreHorizontal size={18} /></button></div>
              {post.body && <p className="real-post-body">{post.body}</p>}
              {post.photos?.length > 0 && <div className="real-post-photos">{post.photos.map(photo => <img key={photo.id} src={'/api/photos/' + photo.id} alt="Фото до допису" loading="lazy" />)}</div>}
              <div className="real-post-actions">
                <button className={post.my_reaction ? 'reacted' : ''} onClick={() => void toggleReaction(post)}><Heart size={16} /> {post.reaction_count || 0}</button>
                <button onClick={() => void toggleComments(post.id)}><MessageCircle size={16} /> {post.comment_count || 0} коментарів</button>
              </div>
              {openComments[post.id] && <div className="comments-panel">
                {(comments[post.id] || []).map(comment => <div className="feed-comment" key={comment.id}><b>{comment.author_name}</b><p>{comment.body}</p><small>{formatDate(comment.created_at)}</small></div>)}
                <form className="comment-form" onSubmit={event => void createComment(event, post.id)}>
                  <input value={commentDrafts[post.id] || ''} onChange={e => setCommentDrafts(current => ({ ...current, [post.id]: e.target.value }))} maxLength={1500} placeholder="Написати коментар…" aria-label="Текст коментаря" />
                  <button type="submit" disabled={!(commentDrafts[post.id] || '').trim() || sendingComment === post.id} aria-label="Надіслати коментар"><ArrowUpRight size={17} /></button>
                </form>
              </div>}
            </article>
          ))}
        </div>
        <aside className="feed-side-column">
          <div className="feed-side-card"><span className="auth-overline">SFERIO</span><h3>Спільнота нашого ліцею</h3><p>Тут збиратимуться шкільні новини, думки та ініціативи.</p><div className="side-private"><ShieldCheck size={15} /> Закритий простір</div></div>
          <div className="feed-side-card"><span className="auth-overline">НАСТУПНІ ЕТАПИ</span><ul><li>Сторінки класів</li><li>Фото в дописах</li><li>Голосування та події</li></ul></div>
        </aside>
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
