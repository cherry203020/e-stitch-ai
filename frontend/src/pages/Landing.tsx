import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import './Landing.css';

// Indian traditional only – Pexels (verified: saree, Indian attire; no nature/fruit)
// Hero: Woman wearing sari dress (Pexels 2723623)
const HERO_IMG = 'https://images.pexels.com/photos/2723623/pexels-photo-2723623.jpeg?auto=compress&cs=tinysrgb&w=1200';
// Story: Woman in ethnic wear / saree (Pexels 8387170 - green saree)
const FABRIC_IMG = 'https://images.pexels.com/photos/8387170/pexels-photo-8387170.jpeg?auto=compress&cs=tinysrgb&w=800';
// Tailor card: Indian woman in red traditional dress, Varanasi (Pexels 5816594)
const TAILOR_IMG = 'https://images.pexels.com/photos/5816594/pexels-photo-5816594.jpeg?auto=compress&cs=tinysrgb&w=800';
// Customer: Woman in traditional attire (Pexels 35212993 - elegant saree)
const DESIGN_IMG = 'https://images.pexels.com/photos/35212993/pexels-photo-35212993.jpeg?auto=compress&cs=tinysrgb&w=800';
// Gallery: Indian women in saree / traditional wear only
const GALLERY_IMG_1 = 'https://images.pexels.com/photos/2723623/pexels-photo-2723623.jpeg?auto=compress&cs=tinysrgb&w=600';
const GALLERY_IMG_2 = 'https://images.pexels.com/photos/8387170/pexels-photo-8387170.jpeg?auto=compress&cs=tinysrgb&w=600';
const GALLERY_IMG_3 = 'https://images.pexels.com/photos/5816594/pexels-photo-5816594.jpeg?auto=compress&cs=tinysrgb&w=600';
const GALLERY_IMG_4 = 'https://images.pexels.com/photos/7686292/pexels-photo-7686292.jpeg?auto=compress&cs=tinysrgb&w=600';

export default function Landing() {
  const { theme, toggle, isDark } = useTheme();
  const heroRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div
      className="landing"
      data-theme={theme}
      onMouseMove={handleMouseMove}
    >
      <div className="landing-noise" aria-hidden />
      <div className="landing-glow landing-glow-1" aria-hidden />
      <div className="landing-glow landing-glow-2" aria-hidden />

      <header className="landing-header">
        <div className="landing-header-inner">
          <span className="landing-logo">E-Stitch</span>
          <nav className="landing-nav">
            <button
              type="button"
              className="landing-theme-toggle"
              onClick={toggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="landing-theme-icon landing-theme-sun" aria-hidden>☀️</span>
              <span className="landing-theme-icon landing-theme-moon" aria-hidden>🌙</span>
            </button>
            <Link to="/login" className="landing-nav-link">Login</Link>
            <Link to="/register" className="landing-nav-btn">Get started</Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero-bg" aria-hidden />
        <div
          className="landing-hero-parallax"
          style={{
            transform: `translate(${(mouse.x - 0.5) * 12}px, ${(mouse.y - 0.5) * 12}px)`,
          }}
        />
        <div className="landing-hero-image-wrap">
          <img src={HERO_IMG} alt="Indian woman in traditional saree and blouse" className="landing-hero-image" />
          <div className="landing-hero-image-overlay" />
        </div>
        <div className="landing-hero-content">
          <span className="landing-hero-badge">Indian tailors & you, connected</span>
          <h1 className="landing-hero-title">
            Saree blouses & ethnic wear, <em>digitized</em>
          </h1>
          <p className="landing-hero-subtitle">
            Browse blouse designs, find verified Indian tailors, and track orders from fabric to delivery—all in one place.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="btn btn-primary landing-cta-primary">Create account</Link>
            <Link to="/login" className="btn btn-outline landing-cta-secondary">Sign in</Link>
          </div>
        </div>
        <div className="landing-hero-scroll-hint">
          <span>Scroll to explore</span>
          <div className="landing-hero-scroll-line" />
        </div>
      </section>

      <section
        className="landing-section landing-story"
        ref={(el) => { sectionRefs.current[0] = el; }}
      >
        <div className="landing-section-inner landing-section-split">
          <div className="landing-story-content">
            <span className="landing-section-label">The story</span>
            <h2 className="landing-section-title">From fabric to your door</h2>
            <p className="landing-story-p">
              We connect you with verified local tailors for saree blouses and Indian ethnic wear. Pick a design, compare prices and reviews, and place your order—with real-time tracking from the first stitch to delivery.
            </p>
            <Link to="/register" className="landing-card-link">Get started →</Link>
          </div>
          <div className="landing-story-visual landing-3d-wrap">
            <img src={FABRIC_IMG} alt="Indian woman in ethnic wear and traditional blouse" className="landing-story-img" />
          </div>
        </div>
      </section>

      <section
        className="landing-section landing-for"
        ref={(el) => { sectionRefs.current[1] = el; }}
      >
        <div className="landing-section-inner">
          <span className="landing-section-label">For everyone</span>
          <h2 className="landing-section-title">Built for customers and tailors</h2>
          <div className="landing-cards">
            <article className="landing-card landing-card-3d">
              <div className="landing-card-image-wrap">
                <img src={DESIGN_IMG} alt="Indian woman wearing traditional blouse" className="landing-card-image" />
                <div className="landing-card-icon" aria-hidden>✂️</div>
              </div>
              <h3>Customers</h3>
              <p>Explore saree blouse and ethnic wear designs, compare tailors by price and ratings, place orders with pickup or delivery, and leave reviews.</p>
              <Link to="/register" className="landing-card-link">Join as customer →</Link>
            </article>
            <article className="landing-card landing-card-3d">
              <div className="landing-card-image-wrap">
                <img src={TAILOR_IMG} alt="Indian tailor with traditional clothing" className="landing-card-image" />
                <div className="landing-card-icon" aria-hidden>🧵</div>
              </div>
              <h3>Tailors</h3>
              <p>Get verified, set your prices, accept orders, and update status from fabric picked to delivery—all from one dashboard.</p>
              <Link to="/register" className="landing-card-link">Join as tailor →</Link>
            </article>
          </div>
        </div>
      </section>

      <section
        className="landing-section landing-gallery"
        ref={(el) => { sectionRefs.current[2] = el; }}
      >
        <div className="landing-section-inner">
          <span className="landing-section-label">Our designs</span>
          <h2 className="landing-section-title">Indian blouses & ethnic wear, crafted with care</h2>
          <p className="landing-gallery-intro">
            Explore saree blouses and Indian ethnic wear—from simple everyday blouses to bridal and heavy work designs.
          </p>
          <div className="landing-gallery-grid">
            <div className="landing-gallery-item landing-3d-wrap">
              <img src={GALLERY_IMG_1} alt="Indian woman in traditional saree" className="landing-gallery-img" />
            </div>
            <div className="landing-gallery-item landing-3d-wrap">
              <img src={GALLERY_IMG_2} alt="Indian ethnic blouse design" className="landing-gallery-img" />
            </div>
            <div className="landing-gallery-item landing-3d-wrap">
              <img src={GALLERY_IMG_3} alt="Indian woman in ethnic wear" className="landing-gallery-img" />
            </div>
            <div className="landing-gallery-item landing-3d-wrap">
              <img src={GALLERY_IMG_4} alt="Traditional Indian blouse and saree" className="landing-gallery-img" />
            </div>
          </div>
          <div className="landing-gallery-cta">
            <Link to="/register" className="btn btn-primary">Browse all designs</Link>
          </div>
        </div>
      </section>

      <section
        className="landing-section landing-flow"
        ref={(el) => { sectionRefs.current[3] = el; }}
      >
        <div className="landing-section-inner">
          <span className="landing-section-label">How it works</span>
          <h2 className="landing-section-title">Three simple steps</h2>
          <ol className="landing-steps">
            <li className="landing-step-item"><strong>Choose</strong> a design and find a tailor that fits your budget and location.</li>
            <li className="landing-step-item"><strong>Place</strong> your order and schedule pickup or delivery.</li>
            <li className="landing-step-item"><strong>Track</strong> status in real time—from stitching to quality check to delivery.</li>
          </ol>
        </div>
      </section>

      <section
        className="landing-section landing-cta-block"
        ref={(el) => { sectionRefs.current[4] = el; }}
      >
        <div className="landing-section-inner">
          <div className="landing-cta-card">
            <h2 className="landing-cta-title">Ready to get started?</h2>
            <p className="landing-cta-text">Join E-Stitch and connect with Indian tailors for saree blouses and ethnic wear in your area.</p>
            <div className="landing-cta-buttons">
              <Link to="/register" className="btn btn-primary">Create free account</Link>
              <Link to="/login" className="btn btn-outline">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-logo">E-Stitch</span>
          <p className="landing-footer-tagline">Connecting you with verified Indian tailors for saree blouses & ethnic wear.</p>
          <div className="landing-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
