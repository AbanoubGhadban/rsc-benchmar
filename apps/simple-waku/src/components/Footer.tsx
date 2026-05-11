// Server Component - no 'use client' directive

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">RSC Benchmark</div>
            <p className="footer-description">
              The modern platform for building and deploying applications at any scale.
            </p>
          </div>
          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} RSC Benchmark. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
