import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const navigation = [
  { label: 'Overview', path: '/' },
  { label: 'My learning', path: '/learning' },
  { label: 'Explore courses', path: '/courses' },
]

function Dashboard() {
  return (
    <main className="dashboard">
      <p className="eyebrow">Monday, August 23, 2026</p>
      <h1>Keep your learning in motion.</h1>
      <p className="lede">Pick up where you left off, or make room for a new idea today.</p>
      <section className="stats" aria-label="Learning progress">
        <div><span>In progress</span><strong>04</strong></div>
        <div><span>Hours learned</span><strong>18.5</strong></div>
        <div><span>Current streak</span><strong>12 days</strong></div>
      </section>
      <section className="continue-panel">
        <div><p className="eyebrow">Continue learning</p><h2>Product Strategy: From Insight to Impact</h2><p>Chapter 4 · Building a durable product narrative</p></div>
        <button type="button">Resume chapter <span aria-hidden="true">→</span></button>
      </section>
      <section className="section-heading"><div><p className="eyebrow">Your library</p><h2>Recent courses</h2></div><NavLink to="/courses">View all</NavLink></section>
      <div className="course-grid">
        <article className="course-card coral"><span>Design</span><h3>Research that moves teams</h3><p>72% complete</p></article>
        <article className="course-card teal"><span>Leadership</span><h3>Clarity in complex decisions</h3><p>34% complete</p></article>
        <article className="course-card gold"><span>Technology</span><h3>Systems thinking for builders</h3><p>Not started</p></article>
      </div>
    </main>
  )
}

function Placeholder({ title }) {
  return <main className="placeholder"><p className="eyebrow">LMS workspace</p><h1>{title}</h1><p>This area is ready for its feature module.</p></main>
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">Lumen<span>.</span></NavLink>
        <nav aria-label="Primary navigation">{navigation.map((item) => <NavLink key={item.path} to={item.path}>{item.label}</NavLink>)}</nav>
        <button className="profile-button" type="button" aria-label="Open profile menu">AS</button>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learning" element={<Placeholder title="My learning" />} />
        <Route path="/courses" element={<Placeholder title="Explore courses" />} />
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Routes>
    </div>
  )
}

export default App
