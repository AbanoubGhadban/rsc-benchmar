// Server Component - no 'use client' directive

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">
          Build faster.<br />
          Scale effortlessly.
        </h1>
        <p className="hero-subtitle">
          The modern platform for building and deploying applications at any scale.
          Start free, grow with us.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary">Get Started Free</button>
          <button className="btn btn-secondary">View Demo</button>
        </div>
      </div>
    </section>
  );
}
