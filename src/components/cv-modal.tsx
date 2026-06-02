import { X, Download, FileText } from "react-feather";
import { useState } from "react";
import "../styles/cv-modal.scss";

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CVModal({ isOpen, onClose }: CVModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="cv-modal__overlay" onClick={onClose} />
      <div className="cv-modal">
        <div className="cv-modal__header">
          <div className="cv-modal__header__title">
            <FileText size={24} />
            <span>Curriculum Vitae</span>
          </div>
          <div className="cv-modal__header__actions">
            <button
              className="cv-modal__header__action-btn"
              onClick={handlePrint}
              title="Print CV"
            >
              <Download size={20} />
              <span>Print</span>
            </button>
            <button
              className="cv-modal__header__action-btn cv-modal__header__action-btn--close"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="cv-modal__content">
          <div className="cv-page">
            {/* Header */}
            <div className="cv-section cv-header">
              <div className="cv-header__name">Mehfooz-ur-Rehman</div>
              <div className="cv-header__title">Full Stack Web Developer</div>
              <div className="cv-header__contact">
                <span>📧 mehfoozijaz786@gmail.com</span>
                <span>📱 +92 313 7178074</span>
                <span>📍 Samundri, Faisalabad, Pakistan</span>
                <span>🔗 github.com/MehfoozurRehman</span>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="cv-section">
              <h2 className="cv-section__title">Professional Summary</h2>
              <p className="cv-section__content">
                Passionate full-stack web developer with 5+ years of experience
                building scalable, user-friendly web applications. I specialize
                in turning complex problems into simple, beautiful, and
                intuitive solutions. Currently working at Devscot, creating
                innovative digital products with modern technologies.
              </p>
            </div>

            {/* Experience */}
            <div className="cv-section">
              <h2 className="cv-section__title">Professional Experience</h2>

              <div className="cv-experience">
                <div className="cv-experience__header">
                  <div className="cv-experience__title">
                    Senior Web Developer
                  </div>
                  <div className="cv-experience__date">2024 - Present</div>
                </div>
                <div className="cv-experience__company">Devscot</div>
                <ul className="cv-experience__list">
                  <li>
                    Lead frontend development on critical client projects using
                    React and TypeScript
                  </li>
                  <li>
                    Architect scalable full-stack solutions with modern
                    frameworks
                  </li>
                  <li>
                    Mentor junior developers and establish coding best practices
                  </li>
                </ul>
              </div>

              <div className="cv-experience">
                <div className="cv-experience__header">
                  <div className="cv-experience__title">Web Developer</div>
                  <div className="cv-experience__date">2020 - 2024</div>
                </div>
                <div className="cv-experience__company">
                  Freelance & Various Studios
                </div>
                <ul className="cv-experience__list">
                  <li>
                    Developed 50+ web applications and digital products for
                    clients globally
                  </li>
                  <li>
                    Built responsive, accessible user interfaces with React,
                    Next.js, and modern CSS
                  </li>
                  <li>
                    Implemented backend services using Node.js, Express, and
                    databases
                  </li>
                </ul>
              </div>
            </div>

            {/* Skills */}
            <div className="cv-section">
              <h2 className="cv-section__title">Core Skills</h2>

              <div className="cv-skills">
                <div className="cv-skill-group">
                  <h3>Frontend</h3>
                  <p>
                    React, Next.js, TypeScript, JavaScript, Remix, React
                    Native, Electron, Sass, Tailwind CSS
                  </p>
                </div>
                <div className="cv-skill-group">
                  <h3>Backend</h3>
                  <p>
                    Node.js, Express, GraphQL, REST APIs, MongoDB, PostgreSQL,
                    Firebase
                  </p>
                </div>
                <div className="cv-skill-group">
                  <h3>Tools & Platforms</h3>
                  <p>
                    Git, Vercel, Netlify, AWS, Firebase, Docker, Figma, Adobe
                    XD
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Projects */}
            <div className="cv-section">
              <h2 className="cv-section__title">Featured Projects</h2>

              <div className="cv-project">
                <div className="cv-project__header">
                  <span className="cv-project__name">Codepen Clone</span>
                  <span className="cv-project__tech">React, JavaScript</span>
                </div>
                <p>
                  Interactive code editor platform allowing users to write,
                  preview, and share code snippets in real-time.
                </p>
              </div>

              <div className="cv-project">
                <div className="cv-project__header">
                  <span className="cv-project__name">
                    E-commerce Dashboard
                  </span>
                  <span className="cv-project__tech">
                    React, TypeScript, Firebase
                  </span>
                </div>
                <p>
                  Full-featured admin dashboard for managing products,
                  inventory, and orders with real-time analytics.
                </p>
              </div>

              <div className="cv-project">
                <div className="cv-project__header">
                  <span className="cv-project__name">Order Management System</span>
                  <span className="cv-project__tech">
                    TypeScript, React, Node.js
                  </span>
                </div>
                <p>
                  End-to-end order fulfillment system with inventory tracking
                  and automated notifications.
                </p>
              </div>
            </div>

            {/* Education */}
            <div className="cv-section">
              <h2 className="cv-section__title">Education</h2>

              <div className="cv-education">
                <div className="cv-education__header">
                  <div className="cv-education__degree">
                    Self-Taught Developer
                  </div>
                  <div className="cv-education__date">2020 - Present</div>
                </div>
                <p className="cv-education__details">
                  Continuous learner with deep focus on modern web technologies,
                  best practices, and industry standards. Active contributor to
                  open-source projects with 100+ public repositories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
