import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  LogIn,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  X,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { IndustryConnectSection } from '../components/landing/IndustryConnectSection';
import { Footer } from '../components/landing/Footer';
import '../styles/landing.css';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [partnerCompany, setPartnerCompany] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRole, setPartnerRole] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // At or near top: always visible and transparent
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        // Scrolling down: hide header (move up)
        if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up: reveal header
          setIsHeaderVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePartnerSubmit = (e) => {
    e.preventDefault();
    if (!partnerCompany.trim() || !partnerEmail.trim()) return;
    setInquirySubmitted(true);
  };

  const onNavigateToLogin = () => {
    navigate('/login');
  };

  const onNavigateToStudentLogin = () => {
    navigate('/student/login');
  };

  return (
    <div className="landing-page-root min-h-screen bg-[#fbfcfd] text-slate-800 antialiased reference-bg-glow flex flex-col relative">
      {/* ========================================================================= */}
      {/* EDITORIAL HEADER */}
      {/* ========================================================================= */}
      <header className="landing-header">
        <div className="landing-header-inner">
          
          {/* Left: MENU Button */}
          <div className="flex items-center shrink-0 w-32 sm:w-48">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#e5be68] hover:text-white transition-colors uppercase cursor-pointer"
            >
              MENU
            </button>
          </div>

          {/* Center: Large Elegant Serif Title */}
          <div className="text-center flex-1">
            <h2 className="landing-header-title select-none whitespace-nowrap">
              NSCET
            </h2>
          </div>

          {/* Right: STUDENT | LOGIN */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 shrink-0 w-32 sm:w-48 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
            <button
              type="button"
              onClick={onNavigateToStudentLogin}
              className="text-[#e5be68] hover:text-white transition-colors hidden sm:inline-block cursor-pointer"
            >
              STUDENT
            </button>
            <span className="text-[#e5be68]/40 font-light select-none hidden sm:inline-block">|</span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[#e5be68] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              LOGIN
            </button>
          </div>

        </div>
      </header>

      {/* Slide-over Drawer for MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="menu-drawer-panel">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-amber-400/20">
                <div>
                  <span className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-white block">
                    Nadar Saraswathi
                  </span>
                  <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-semibold">
                    College of Engg & Tech
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-8 space-y-3">
                <a
                  href="#overview"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-link"
                >
                  <span>Home</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </a>
                <a
                  href="#partners"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-link"
                >
                  <span>Industry Partners</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </a>
                <a
                  href="#programs"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-link"
                >
                  <span>Training Framework</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </a>
                <a
                  href="#contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-link"
                >
                  <span>Contact Placement Cell</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </a>
                <a
                  href="https://www.nscet.org/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-link"
                >
                  <span>Main College Website</span>
                  <ExternalLink className="w-4 h-4 opacity-60 text-amber-400" />
                </a>
              </nav>
            </div>

            <div className="pt-6 border-t border-amber-400/20 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateToStudentLogin();
                }}
                className="w-full btn-reference-gradient py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] font-bold text-white text-center cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full hero-btn-secondary py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] font-bold text-white text-center cursor-pointer justify-center flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Admin CRM Login</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center tracking-normal pt-2">
                Nadar Saraswathi CET · Theni - 625 531
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO SECTION (Sticky background and content) */}
      {/* ========================================================================= */}
      <section id="overview" className="hero-nscet-bg text-white">
        {/* Soft Scrim Overlay */}
        <div className="hero-overlay-scrim" aria-hidden="true" />

        <div className="hero-content-wrapper">
          <div className="hero-text-block">
            
            {/* Eyebrow with line matching reference layout */}
            <div className="hero-eyebrow-container">
              <span className="hero-eyebrow">Training & Placement Cell</span>
              <div className="hero-eyebrow-line" />
            </div>

            {/* Title */}
            <h1 className="hero-main-title">
              Nadar Saraswathi
              <span className="hero-title-highlight">
                College of Engineering & Technology
              </span>
            </h1>

            {/* Description */}
            <p className="hero-description">
              Bridging engineering talent with premier corporate recruiters, product innovators, and rewarding global industry careers.
            </p>

            {/* Action Buttons (Matches reference white pill style) */}
            <div className="hero-buttons-row">
              <button
                type="button"
                onClick={onNavigateToStudentLogin}
                className="hero-pill-btn-white"
              >
                <span>Student Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-800" />
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="hero-pill-btn-glass"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* Accreditation Badges */}
            <div className="hero-accreditation-capsules">
              <span className="hero-pill">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                AICTE Approved
              </span>
              <span className="hero-pill">
                Anna University Affiliated
              </span>
              <span className="hero-pill gold-highlight">
                NAAC 'A' Grade Accredited
              </span>
              <span className="hero-pill">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Theni, Tamil Nadu
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CURTAIN OVERLAP CONTENT FLOW */}
      {/* ========================================================================= */}
      <div className="landing-content-flow">
        {/* ========================================================================= */}
        {/* INDUSTRY CONNECT MARQUEE */}
        {/* ========================================================================= */}
        <div id="partners">
          <IndustryConnectSection />
        </div>

      {/* ========================================================================= */}
      {/* STUDENT SUCCESS PROOF SPOTLIGHT */}
      {/* ========================================================================= */}
      <section className="landing-section bg-white border-b border-slate-200/60">
        <div className="landing-container">
          <div className="spotlight-card">
            <div className="spotlight-image-wrap">
              <img
                src="/src/assets/images/students_placement_success_1791271636212.jpg"
                alt="NSCET Students Placement Success"
                referrerPolicy="no-referrer"
                className="spotlight-image"
                onError={(e) => {
                  e.target.src = '/login-bg.png';
                }}
              />
            </div>
            <div>
              <span className="spotlight-badge">
                Student Achievement Spotlight
              </span>
              <h3 className="spotlight-title">
                Empowering Students with Industry Readiness from Year One
              </h3>
              <p className="spotlight-desc">
                Through continuous industry training, competitive coding bootcamps, and Anna University syllabus integration, our students clear rigorous multi-stage technical evaluations at top enterprises.
              </p>
              <div className="spotlight-stats-grid">
                <div className="spotlight-stat-box">
                  <div className="spotlight-stat-title">100% Pre-Placement Training</div>
                  <div className="spotlight-stat-sub">Aptitude, Verbal, Soft Skills & Coding</div>
                </div>
                <div className="spotlight-stat-box">
                  <div className="spotlight-stat-title">Dedicated Assessment Labs</div>
                  <div className="spotlight-stat-sub">180+ High-Performance Computer Terminals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TRAINING & PLACEMENT FRAMEWORK (Bento Grid) */}
      {/* ========================================================================= */}
      <section id="programs" className="landing-section bg-[#fbfcfd] border-b border-slate-200/60">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-badge">
              Structured Methodology
            </span>
            <h2 className="section-title">
              Holistic Placement Training Framework
            </h2>
            <p className="section-subtitle">
              Tailored preparation tracks starting from the 3rd semester through final year on-campus drives
            </p>
          </div>

          <div className="framework-grid">
            <div className="framework-card">
              <div>
                <span className="framework-tag">01</span>
                <h3 className="framework-card-title">
                  Full-Stack & Competitive Coding
                </h3>
                <p className="framework-card-desc">
                  Intensive practice across Data Structures, Algorithms, Java, Python, and SQL with weekly hackathons and automated evaluation benchmarks.
                </p>
              </div>
              <div className="framework-card-footer">
                Target: Product & Dream Firms
              </div>
            </div>

            <div className="framework-card">
              <div>
                <span className="framework-tag">02</span>
                <h3 className="framework-card-title">
                  Core Engineering & IoT Labs
                </h3>
                <p className="framework-card-desc">
                  Specialized domain hands-on sessions for Mechanical, ECE, EEE, and Civil branches in PLC, Embedded C, AutoCAD, and Structural Analysis.
                </p>
              </div>
              <div className="framework-card-footer">
                Target: Automotive, Manufacturing & Core EPC
              </div>
            </div>

            <div className="framework-card">
              <div>
                <span className="framework-tag">03</span>
                <h3 className="framework-card-title">
                  Corporate Mock Panels & HR Fitment
                </h3>
                <p className="framework-card-desc">
                  Group discussions, resume auditing, technical panel simulations, and behavioral interview coaching led by visiting industry HR managers.
                </p>
              </div>
              <div className="framework-card-footer">
                Target: 100% Interview Conversion
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CORPORATE PARTNERSHIP INVITATION */}
      {/* ========================================================================= */}
      <section id="contact" className="landing-section bg-white">
        <div className="landing-container-narrow">
          <div className="contact-card">
            <div className="section-header-center" style={{ marginBottom: '32px' }}>
              <span className="section-badge">
                Corporate Partnerships
              </span>
              <h2 className="section-title">
                Invite NSCET for Campus Recruitment
              </h2>
              <p className="section-subtitle">
                Connect directly with our Training & Placement Officer to schedule on-campus or virtual hiring drives.
              </p>
            </div>

            {inquirySubmitted ? (
              <div style={{ padding: '24px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <CheckCircle2 style={{ width: '40px', height: '40px', color: '#059669', margin: '0 auto 12px' }} />
                <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem', margin: '0 0 6px' }}>Inquiry Successfully Transmitted</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '440px', margin: '0 auto 12px', lineHeight: 1.6 }}>
                  Thank you for your interest in partnering with Nadar Saraswathi CET. Our Placement Director will connect with your HR team at <strong style={{ color: '#0f172a' }}>{partnerEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setInquirySubmitted(false)}
                  style={{ background: 'none', border: 'none', color: '#059669', textDecoration: 'underline', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handlePartnerSubmit} className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-label">Company / Organization *</label>
                    <input
                      type="text"
                      required
                      value={partnerCompany}
                      onChange={(e) => setPartnerCompany(e.target.value)}
                      placeholder="e.g. Zoho Corp / Infosys / Tech Mahindra"
                      className="contact-input"
                    />
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-label">Official HR / Talent Email *</label>
                    <input
                      type="email"
                      required
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="talent@company.com"
                      className="contact-input"
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label className="contact-label">Hiring Role / Profile Description</label>
                  <input
                    type="text"
                    value={partnerRole}
                    onChange={(e) => setPartnerRole(e.target.value)}
                    placeholder="e.g. Graduate Engineer Trainee / Software Engineer (2026 Batch)"
                    className="contact-input"
                  />
                </div>

                <div className="contact-actions-row">
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Direct confirmation sent to registered corporate mailbox
                  </span>
                  <button
                    type="submit"
                    className="btn-reference-gradient"
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Send Campus Drive Proposal
                  </button>
                </div>
              </form>
            )}

            {/* Quick Contact Line */}
            <div className="contact-footer-info">
              <div className="contact-footer-item">
                <Mail style={{ width: '16px', height: '16px', color: '#c59e51', flexShrink: 0 }} />
                <span>placement@nscet.org</span>
              </div>
              <div className="contact-footer-item">
                <Phone style={{ width: '16px', height: '16px', color: '#c59e51', flexShrink: 0 }} />
                <span>+91 94421 88200</span>
              </div>
              <div className="contact-footer-item">
                <MapPin style={{ width: '16px', height: '16px', color: '#c59e51', flexShrink: 0 }} />
                <span>Theni - 625 531, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <Footer onNavigateToLogin={onNavigateToLogin} onNavigateToStudentLogin={onNavigateToStudentLogin} />
      </div>
    </div>
  );
};

export default LandingPage;
