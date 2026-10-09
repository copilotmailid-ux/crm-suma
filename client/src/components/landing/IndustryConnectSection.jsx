import React from 'react';
import { TOP_PARTNERS, BOTTOM_PARTNERS } from '../../data/industryConnectData';

export const IndustryConnectSection = () => {
  // Triplicate array for smooth, infinite CSS marquee scrolling
  const topLogos = [...TOP_PARTNERS, ...TOP_PARTNERS, ...TOP_PARTNERS];
  const bottomLogos = [...BOTTOM_PARTNERS, ...BOTTOM_PARTNERS, ...BOTTOM_PARTNERS];

  return (
    <section className="campus-partners-section" aria-label="Our Industry Connect - Global Corporate Partners">
      {/* Background dark blue-black gradient overlay */}
      <div className="campus-partners-overlay" />

      {/* Top Marquee Row (Scrolling Left) */}
      <div className="partners-marquee-row top-row">
        <div className="partners-marquee-inner scroll-left">
          {topLogos.map((partner, index) => (
            <div
              key={`top-${partner.name}-${index}`}
              className="partner-logo-wrap"
              title={partner.name}
              style={{ '--item-scale': partner.scale || 1 }}
            >
              <img
                src={partner.logoWhite || partner.logo}
                alt={partner.name}
                referrerPolicy="no-referrer"
                className="partner-vector-logo logo-white"
                loading="eager"
                onError={(e) => {
                  e.target.style.opacity = '0';
                }}
              />
              <img
                src={partner.logo}
                alt={partner.name}
                referrerPolicy="no-referrer"
                className="partner-vector-logo logo-color"
                loading="lazy"
                onError={(e) => {
                  e.target.style.opacity = '0';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Center Branding Content with Exact Title & Golden Petal Divider */}
      <div className="partners-center-content">
        <h2 className="partners-main-title">
          <span className="title-white">OUR </span>
          <span className="title-gold">INDUSTRY CONNECT</span>
        </h2>

        {/* Exact Golden Petal Divider from nscet.org */}
        <div className="partners-gold-divider" aria-hidden="true">
          <span className="divider-line left" />
          <span className="divider-icon">
            <svg width="32" height="24" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 1C18 1 13 7 13 13.5C13 17 15.2 20 18 21.5C20.8 20 23 17 23 13.5C23 7 18 1 18 1Z"
                fill="url(#goldPetalGrad)"
              />
              <path
                d="M11 7.5C11 7.5 5.5 12 5.5 17C5.5 20.2 8 22.5 11.2 23C13 19.8 14 16.5 14 13.5C14 10.5 11 7.5 11 7.5Z"
                fill="url(#goldPetalGrad)"
                opacity="0.9"
              />
              <path
                d="M25 7.5C25 7.5 30.5 12 30.5 17C30.5 20.2 28 22.5 24.8 23C23 19.8 22 16.5 22 13.5C22 10.5 25 7.5 25 7.5Z"
                fill="url(#goldPetalGrad)"
                opacity="0.9"
              />
              <circle cx="18" cy="24.2" r="1.6" fill="#fde68a" />
              <defs>
                <linearGradient id="goldPetalGrad" x1="6" y1="1" x2="30" y2="25" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fff1a8" />
                  <stop offset="45%" stopColor="#e5be68" />
                  <stop offset="100%" stopColor="#b88628" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="divider-line right" />
        </div>

        <p className="partners-description">
          A strong network of organizations shaping our students’ careers.
        </p>
      </div>

      {/* Bottom Marquee Row (Scrolling Right) */}
      <div className="partners-marquee-row bottom-row">
        <div className="partners-marquee-inner scroll-right">
          {bottomLogos.map((partner, index) => (
            <div
              key={`bottom-${partner.name}-${index}`}
              className="partner-logo-wrap"
              title={partner.name}
              style={{ '--item-scale': partner.scale || 1 }}
            >
              <img
                src={partner.logoWhite || partner.logo}
                alt={partner.name}
                referrerPolicy="no-referrer"
                className="partner-vector-logo logo-white"
                loading="eager"
                onError={(e) => {
                  e.target.style.opacity = '0';
                }}
              />
              <img
                src={partner.logo}
                alt={partner.name}
                referrerPolicy="no-referrer"
                className="partner-vector-logo logo-color"
                loading="lazy"
                onError={(e) => {
                  e.target.style.opacity = '0';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
