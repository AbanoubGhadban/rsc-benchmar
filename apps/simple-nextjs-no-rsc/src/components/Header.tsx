// Server Component - no 'use client' directive

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="logo">RSC Benchmark</div>
        <nav className="nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
          <a href="#faq" className="nav-link">FAQ</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>
      </div>
    </header>
  );
}
