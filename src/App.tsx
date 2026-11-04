import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  ClipboardList, Heart, Home, MessageCircle, MoreHorizontal, Plus,
  Search, ShieldCheck, Users
} from 'lucide-react'

function App() {
  return (
    <main className="site">
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="SFERIO">
          <span className="wordmark-symbol">s<span>.</span></span>
          <span className="wordmark-name">sferio</span>
        </a>
        <div className="school-name"><span className="school-dot" /> Слобідський ліцей №2</div>
        <nav className="header-nav" aria-label="Головна навігація">
          <a href="#space">Про простір</a>
          <a href="#inside">Можливості</a>
        </nav>
        <a className="header-login" href="#space">Увійти <ArrowUpRight size={15} /></a>
      </header>

      <section className="intro">
        <div className="intro-copy">
          <div className="kicker"><span>01</span> ШКІЛЬНА СПІЛЬНОТА ОНЛАЙН</div>
          <h1>Ліцей не закінчується<br />після <i>дзвінка.</i></h1>
          <p className="intro-text">SFERIO — місце, де учні нашого ліцею діляться новинами, обговорюють ідеї, стежать за подіями та разом вирішують важливе.</p>
          <div className="intro-links">
            <a className="solid-link" href="#space">Зазирнути всередину <ArrowUpRight size={16} /></a>
            <span className="private-note"><ShieldCheck size={15} /> Тільки для спільноти ліцею</span>
          </div>
          <div className="intro-index"><span>СЛОБІДСЬКИЙ ЛІЦЕЙ №2</span><span>01 / 04</span></div>
        </div>

        <div className="product-stage" id="space">
          <div className="stage-label"><span>ПОПЕРЕДНІЙ ВИГЛЯД</span><span>DESKTOP / 01</span></div>
          <div className="app-window">
            <aside className="app-rail">
              <div className="rail-logo">s.</div>
              <div className="rail-items">
                <span className="rail-active"><Home size={17} /></span>
                <span><Users size={17} /></span>
                <span><ClipboardList size={17} /></span>
                <span><CalendarDays size={17} /></span>
              </div>
              <span className="rail-help"><CircleHelp size={17} /></span>
            </aside>
            <div className="app-main">
              <div className="app-topline">
                <div className="app-school">Слобідський ліцей №2 <ChevronDown size={13} /></div>
                <div className="app-top-actions"><Search size={16} /><Bell size={16} /><span className="user-circle">М</span></div>
              </div>
              <div className="app-content">
                <div className="feed-column">
                  <div className="feed-heading">
                    <div><span className="feed-overline">ВІВТОРОК, 4 ЛИСТОПАДА</span><h2>Що нового?</h2></div>
                    <span className="feed-filter">Уся школа <ChevronDown size={12} /></span>
                  </div>
                  <div className="composer">
                    <span className="composer-avatar">М</span>
                    <span>Поділитися чимось зі школою...</span>
                    <Plus size={17} />
                  </div>
                  <article className="feed-post">
                    <div className="post-meta">
                      <span className="author-avatar">УС</span>
                      <div><b>Учнівське самоврядування</b><small>Оголошення · сьогодні о 09:20</small></div>
                      <MoreHorizontal className="post-more" size={18} />
                    </div>
                    <div className="post-copy">
                      <span className="post-tag">ВАЖЛИВО</span>
                      <h3>Є ідея для ліцею? Розкажи про неї.</h3>
                      <p>Збираємо пропозиції учнів до наступної зустрічі самоврядування. Можна запропонувати подію, зміни у просторі або власний проєкт.</p>
                    </div>
                    <div className="post-actions"><span><Heart size={15} /> 18</span><span><MessageCircle size={15} /> 6 коментарів</span><span className="post-open">Відкрити <ArrowUpRight size={13} /></span></div>
                  </article>
                  <div className="feed-post second-post">
                    <div className="post-meta"><span className="author-avatar class-avatar">9</span><div><b>9-А · класна сторінка</b><small>Учора о 16:42</small></div><MoreHorizontal className="post-more" size={18} /></div>
                    <p className="second-copy">Нагадуємо: у п’ятницю збираємо книжки для шкільного обміну 📚</p>
                    <div className="post-actions"><span><Heart size={15} /> 12</span><span><MessageCircle size={15} /> 3 коментарі</span></div>
                  </div>
                </div>
                <aside className="app-side">
                  <div className="side-block">
                    <div className="side-title">НАЙБЛИЖЧЕ <ArrowUpRight size={13} /></div>
                    <div className="event-date"><b>07</b><span>ЛИСТОПАДА</span></div>
                    <h4>Зустріч учнівського самоврядування</h4>
                    <p>П’ятниця · актова зала</p>
                  </div>
                  <div className="side-block vote-block">
                    <div className="side-title">ГОЛОСУВАННЯ <span className="live-dot" /></div>
                    <h4>Яку тему оберемо для наступного тижня?</h4>
                    <div className="vote-option"><span>День без рюкзаків</span><span>42%</span></div>
                    <div className="vote-bar"><i style={{ width: '42%' }} /></div>
                    <div className="vote-option"><span>Тематичний одяг</span><span>35%</span></div>
                    <div className="vote-bar"><i style={{ width: '35%' }} /></div>
                    <div className="vote-option"><span>Кіноперерва</span><span>23%</span></div>
                    <div className="vote-bar"><i style={{ width: '23%' }} /></div>
                    <small className="vote-foot">Приклад опитування</small>
                  </div>
                </aside>
              </div>
              <div className="app-bottom"><span className="bottom-current"><Home size={13} /> Головна</span><span><Users size={13} /> Спільнота</span><span><ClipboardList size={13} /> Рішення</span><span><CalendarDays size={13} /> Події</span></div>
            </div>
          </div>
          <div className="stage-caption"><span>Так може виглядати твій шкільний простір</span><span>КОНЦЕПТ ІНТЕРФЕЙСУ</span></div>
        </div>
      </section>

      <section className="inside" id="inside">
        <div className="inside-heading"><div className="kicker"><span>02</span> ЩО Є ВСЕРЕДИНІ</div><h2>Не просто стрічка.<br /><i>Спільні справи.</i></h2></div>
        <div className="inside-list">
          <article><span className="inside-number">01</span><div><h3>Спілкування всієї школи</h3><p>Дописи, коментарі й обговорення в одному спільному просторі.</p></div><MessageCircle size={19} /></article>
          <article><span className="inside-number">02</span><div><h3>Сторінки класів</h3><p>Оголошення, новини та своє коло однокласників.</p></div><Users size={19} /></article>
          <article><span className="inside-number">03</span><div><h3>Голосування та ініціативи</h3><p>Можливість висловитися й долучитися до рішень ліцею.</p></div><Check size={19} /></article>
          <article><span className="inside-number">04</span><div><h3>Події та оголошення</h3><p>Важливе шкільне життя не губиться в загальних чатах.</p></div><CalendarDays size={19} /></article>
        </div>
      </section>

      <section className="access-strip">
        <div><span className="kicker"><span>03</span> ЗАКРИТА СПІЛЬНОТА</span><h2>Свій простір для своїх.</h2></div>
        <p>Доступ до SFERIO матимуть учні та працівники Слобідського ліцею №2. Реєстрація — за спеціальним кодом, який поширюється всередині ліцею.</p>
        <span className="access-icon"><ShieldCheck size={22} /></span>
      </section>

      <footer className="site-footer"><a className="wordmark footer-mark" href="#"><span className="wordmark-symbol">s<span>.</span></span><span className="wordmark-name">sferio</span></a><span>Слобідський ліцей №2</span><span>Простір нашої спільноти.</span></footer>
    </main>
  )
}

export default App
