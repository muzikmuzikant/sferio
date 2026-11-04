import { ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp, Compass, GraduationCap, LockKeyhole, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'

const features = [
  { icon: MessageCircle, title: 'Спільна стрічка', text: 'Новини, думки та обговорення всієї шкільної спільноти.' },
  { icon: Users, title: 'Класи', text: 'Окремі простори класів, їхні учасники та оголошення.' },
  { icon: Check, title: 'Голосування', text: 'Вибори, опитування та важливі рішення ліцею.' },
  { icon: CalendarDays, title: 'Події', text: 'Шкільні заходи, ініціативи та спільні активності.' },
]

function App() {
  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="SFERIO — головна">
          <span className="brand-mark">S</span>
          <span>SFERIO</span>
        </a>
        <div className="school-label"><GraduationCap size={15} /> Слобідський ліцей №2</div>
        <button className="help-button" aria-label="Допомога"><CircleHelp size={19} /></button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> ПРОСТІР НАШОГО ЛІЦЕЮ</div>
          <h1>Усе шкільне<br /><span>життя в одному місці.</span></h1>
          <p className="hero-description">Спілкуйся, ділися ідеями, долучайся до подій та впливай на те, якою буде наша спільнота.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button">Увійти до SFERIO <ArrowRight size={17} /></button>
            <button className="secondary-button" type="button">Як це працює <ChevronRight size={17} /></button>
          </div>
          <div className="access-note"><LockKeyhole size={14} /> Закрита спільнота. Реєстрація за кодом ліцею.</div>
        </div>

        <div className="preview-wrap" aria-label="Попередній вигляд SFERIO">
          <div className="preview-glow" />
          <div className="preview-card">
            <div className="preview-head">
              <div className="preview-brand"><span className="mini-mark">S</span><b>SFERIO</b></div>
              <div className="preview-icons"><Bell size={16} /><span className="avatar">М</span></div>
            </div>
            <div className="preview-welcome"><span>ВІТАЄМО У СПІЛЬНОТІ</span><h3>Твій ліцей.<br />Твій простір.</h3></div>
            <div className="preview-tabs"><span className="active-tab">Для всіх</span><span>Мій клас</span><span>Події</span></div>
            <article className="post-card">
              <div className="post-author"><span className="post-avatar">А</span><div><b>Анастасія</b><small>Учнівське самоврядування · щойно</small></div><span className="post-menu">···</span></div>
              <h4>Починаємо створювати SFERIO ✨</h4>
              <p>Тут збиратимуться новини, ідеї та події нашого ліцею. Долучайся!</p>
              <div className="post-footer"><span>♡ 24</span><span>◯ 8 коментарів</span></div>
            </article>
            <div className="preview-bottom"><span className="selected"><Compass size={17} />Головна</span><span><Users size={17} />Спільнота</span><span><Check size={17} />Голосування</span><span><Sparkles size={17} />Профіль</span></div>
          </div>
          <div className="floating-chip"><ShieldCheck size={16} /> Лише для учнів ліцею</div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading"><span>МОЖЛИВОСТІ</span><h2>Шкільне життя — <em>не лише уроки.</em></h2></div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}><div className="feature-icon"><Icon size={19} /></div><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <footer className="footer"><span>© SFERIO · Слобідський ліцей №2</span><span>Простір, який створюємо разом.</span></footer>
    </main>
  )
}

export default App