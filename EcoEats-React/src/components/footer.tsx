import { NavLink } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* LEFT: Support / About (slightly inset from left edge) */}
        <div className="footer-left">
          <NavLink to="/support" className="footer-link">
            Support
          </NavLink>
          <NavLink to="/about" className="footer-link">
            About
          </NavLink>
        </div>

        {/* CENTER: copyright (subtle) */}
        <div className="footer-center">
          <span className="footer-copy">
            © {new Date().getFullYear()} EcoEats. All rights reserved.
          </span>
        </div>

        {/* RIGHT: socials (slightly inset from right edge) */}
        <div className="footer-right" aria-label="social links">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="social"
            aria-label="Twitter"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="social-svg"
            >
              <path
                fill="currentColor"
                d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0016.5 2c-2.5 0-4.5 2.2-4.5 4.9 0 .39.04.76.12 1.12C8.1 7.8 4.3 5.8 1.9 2.9c-.43.74-.67 1.6-.67 2.54 0 1.75.84 3.3 2.12 4.2a4.66 4.66 0 01-2.04-.57v.06c0 2.42 1.73 4.44 4.02 4.9-.42.12-.86.18-1.32.18-.32 0-.63-.03-.93-.09.64 1.99 2.5 3.44 4.7 3.48A9.02 9.02 0 010 19.54a12.8 12.8 0 006.92 2.03c8.32 0 12.86-7.1 12.86-13.26 0-.2 0-.39-.02-.58A9.22 9.22 0 0023 3z"
              />
            </svg>
          </a>

          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="social"
            aria-label="Facebook"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="social-svg"
            >
              <path
                fill="currentColor"
                d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.23 0-1.61.77-1.61 1.56v1.88h2.74l-.44 2.89h-2.3V22C18.34 21.12 22 16.99 22 12z"
              />
            </svg>
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="social"
            aria-label="Instagram"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="social-svg"
            >
              <path
                fill="currentColor"
                d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.2A4.8 4.8 0 1016.8 13 4.8 4.8 0 0012 8.2zM18.5 6.1a1.1 1.1 0 11-1.1-1.1 1.1 1.1 0 011.1 1.1z"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
