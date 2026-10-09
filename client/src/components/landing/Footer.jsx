import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  LogIn,
  ShieldCheck,
  Award,
  GraduationCap,
  FileText,
} from 'lucide-react';

export const Footer = ({ onNavigateToLogin, onNavigateToStudentLogin }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative w-full mt-auto">
      {/* Top Wave Transition SVG - seamlessly flowing from the white section above into the deep navy footer */}
      <div className="w-full overflow-hidden leading-none bg-white -mb-px" aria-hidden="true">
        <svg
          viewBox="0 0 1440 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-12 sm:h-16 lg:h-20 block text-[#0b1b33]"
        >
          {/* Subtle translucent royal blue accent crest wave */}
          <path
            d="M0,32 C280,68 560,10 840,48 C1120,86 1320,38 1440,54 L1440,96 L0,96 Z"
            fill="#1e40af"
            fillOpacity="0.25"
          />
          {/* Deep Royal Midnight solid wave joining the footer */}
          <path
            d="M0,48 C240,16 480,76 720,44 C960,12 1200,64 1440,36 L1440,96 L0,96 Z"
            fill="#0b1b33"
          />
        </svg>
      </div>

      {/* Main Global Footer with NSCET Deep Royal Midnight Palette */}
      <footer className="global-footer" aria-label="Institutional Footer">
        {/* Background Animated Geometric Shapes from nscet.org */}
        <div className="footer-bg-animation" aria-hidden="true">
          <div className="geo-shape shape-1" />
          <div className="geo-shape shape-2" />
          <div className="geo-shape shape-3" />
        </div>

        {/* Main Footer Container */}
        <div className="footer-container">
          <div className="footer-grid">
            
            {/* Column 1: Institutional Branding, About & Social Media Links */}
            <div className="footer-col">
              <div className="footer-logo">
                <img
                  src="https://www.nscet.org/assets/nscet-logo-Bq3x62BG.png"
                  alt="NSCET Logo"
                  className="footer-logo-img"
                  onError={(e) => {
                    e.target.src = '/logo.png';
                  }}
                />
                <div className="footer-logo-text">
                  <h3>NSCET</h3>
                  <p>Training & Placement Cell</p>
                </div>
              </div>

              <p className="footer-about">
                Nadar Saraswathi College of Engineering and Technology is a premier institution dedicated to empowering young engineering minds through innovation, technical excellence, robust industry partnerships, and rewarding career opportunities.
              </p>

              {/* Social Media Links with Exact nscet.org Styling */}
              <div className="social-links" aria-label="College Social Channels">
                <a
                  href="https://www.facebook.com/nscetofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon facebook"
                  aria-label="Facebook"
                  title="Follow NSCET on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <a
                  href="https://x.com/NscetT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon twitter"
                  aria-label="X (Twitter)"
                  title="Follow NSCET on X (Twitter)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/nscettmhnu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon instagram"
                  aria-label="Instagram"
                  title="Follow NSCET on Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                <a
                  href="https://in.linkedin.com/company/nscet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon linkedin"
                  aria-label="LinkedIn"
                  title="Connect with NSCET on LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                <a
                  href="https://www.youtube.com/@NSCETeConnect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon youtube"
                  aria-label="YouTube"
                  title="Watch NSCET on YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links (Tailored for Training & Placement Page) */}
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <a href="#overview">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#partners">
                    Industry Connect
                  </a>
                </li>
                <li>
                  <a href="#programs">
                    Training Framework
                  </a>
                </li>
                <li>
                  <a href="#contact">
                    Recruiter Connect
                  </a>
                </li>
                {onNavigateToStudentLogin && (
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateToStudentLogin}
                      className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition-colors"
                    >
                      <span>Student Portal Login</span>
                      <LogIn className="w-3.5 h-3.5 inline" />
                    </button>
                  </li>
                )}
                {onNavigateToLogin && (
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition-colors"
                    >
                      <span>Admin Portal Login</span>
                      <LogIn className="w-3.5 h-3.5 inline" />
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Useful Links (Institutional & Placements) */}
            <div className="footer-col">
              <h4>Useful Links</h4>
              <ul className="footer-links">
                <li>
                  <a href="#overview" className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Placement Brochure 2026</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nscet.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>College Main Portal</span>
                  </a>
                </li>
                <li>
                  <a href="#overview" className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>AICTE Approval</span>
                  </a>
                </li>
                <li>
                  <a href="#overview" className="inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Anna University Affiliation</span>
                  </a>
                </li>
                <li>
                  <a href="#overview" className="inline-flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>NAAC 'A' Grade Status</span>
                  </a>
                </li>
                <li>
                  <a href="#contact">
                    <span>Hiring MOU & Drive Guidelines</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info (Exact NSCET Address & Map Button) */}
            <div className="footer-col">
              <h4>Contact Info</h4>
              <ul className="contact-info">
                <li>
                  <MapPin className="contact-icon" />
                  <span>
                    Training & Placement Cell, NSCET, Postbox No: 60, Annanji (P.O), Vadapudupatti, Theni - 625 531, Tamil Nadu
                  </span>
                </li>
                <li>
                  <Phone className="contact-icon" />
                  <span>
                    04546-263900 / +91 94421 88200
                  </span>
                </li>
                <li>
                  <a
                    href="mailto:placement@nscet.org"
                    className="inline-flex items-center gap-2 text-white hover:text-amber-400 transition-colors w-full"
                  >
                    <Mail className="contact-icon" />
                    <span className="text-amber-400 underline underline-offset-2">
                      placement@nscet.org
                    </span>
                  </a>
                </li>
              </ul>

              {/* View on Google Maps Button */}
              <a
                href="https://www.google.com/maps/search/Nadar+Saraswathi+College+of+Engineering+and+Technology,+Theni"
                target="_blank"
                rel="noopener noreferrer"
                className="map-btn"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>View on Google Maps</span>
              </a>
            </div>

          </div>

          {/* Footer Bottom Bar */}
          <div className="footer-bottom">
            <div className="copyright">
              © {currentYear} Nadar Saraswathi College of Engineering and Technology · Training & Placement Cell. All Rights Reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
