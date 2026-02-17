import React, { useState, useEffect } from "react";
import "../Styles/home.css"; 
import { useNavigate } from "react-router-dom";


const API_URL = 'https://script.google.com/macros/s/AKfycbxcqIbNhC3H7za-GsBF9iuTU___o8OBCF8URGNxwdQm5q8pUd1vpgthbYyrBRkGXJ5Y8Q/exec';

export const Home = ({ onLoginSuccess }) => {
    const [view, setView] = useState("landing"); 
    const [credentials, setCredentials] = useState({ user_key: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeFaq, setActiveFaq] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

    useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
}, []);

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError("");
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); 

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'login',
                    user_key: credentials.user_key,
                    password: credentials.pass,
                    sheet: "Users_ATLAS"
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                localStorage.setItem("userATLAS", JSON.stringify(result));
                if (onLoginSuccess) onLoginSuccess(result);
                navigate("/dashboard"); 
            } else {
                setError(result.message || "Credenciales inválidas.");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Error de conexión con el servidor ATLAS.");
        } finally {
            setLoading(false);
        }
    };

    const faqData = [
        {
            q: "¿ATLAS es una plataforma o software?",
            a: "No. ATLAS es un marco estratégico, no una herramienta tecnológica. Proporciona un proceso estructurado para guiar la adopción responsable de la IA, sin depender de software específico."
        },
        {
            q: "¿Se puede adaptar a mi institución?",
            a: "Sí. ATLAS está diseñado para adaptarse a diferentes contextos: colegios, universidades, instituciones públicas o privadas, de distintos tamaños y niveles de madurez tecnológica."
        },
        {
            q: "¿Necesitamos expertos en IA?",
            a: "No. ATLAS no requiere expertise técnico previo. El marco está pensado para líderes educativos y equipos pedagógicos, proporcionando orientación accesible y práctica."
        },
        {
            q: "¿Reemplaza políticas existentes?",
            a: "No necesariamente. ATLAS puede integrarse con políticas y procesos existentes, fortaleciéndolos con un enfoque específico para la adopción responsable de la IA."
        },
        {
            q: "¿Cuánto dura un proceso ATLAS?",
            a: "ATLAS está diseñado para desarrollarse a lo largo de ciclos institucionales, generalmente alineados con el año académico. Un primer ciclo de implementación suele abarcar entre 9 y 12 meses, lo que permite diagnosticar, formar, integrar lineamientos y acompañar la adopción de la inteligencia artificial de manera coherente y sostenible."
        },
        {
            q: "¿ATLAS apoya los procesos de acreditación y calidad institucional?",
            a: "Sí. ATLAS contribuye a los procesos de calidad y acreditación al ofrecer un marco estructurado para la adopción responsable de la IA, alineado con la gobernanza institucional, la formación docente y la mejora continua."
        }
    ];

    if (view === "login") {
        return (
            <div className="atlas-main-container">
                <button className="btn-back-landing" onClick={() => setView("landing")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Volver al Inicio</span>
                </button>
                <div className="atlas-card-glass">
                    <div className="atlas-side-visual">
                        <div className="visual-overlay"></div>
                        <div className="branding-content">
                            <h1 className="logo-typography">ATLAS</h1>
                            <div className="accent-line"></div>
                            <p className="tagline">IA RESPONSABLE EN EDUCACIÓN</p>
                        </div>
                        <div className="phase-footer">
                            <span>Auditar • Transformar • Liderar • Asegurar • Sostener</span>
                        </div>
                    </div>
                    <div className="atlas-auth-panel">
                        <div className="form-wrapper">
                            <div className="brand-header">
                                <img
                                    src="https://i.pinimg.com/736x/f1/d7/b9/f1d7b925820b3e01749d2a567ba9cedc.jpg"
                                    alt="Logo ATLAS"
                                    className="institute-logo"
                                />
                                <h2>Iniciar Sesión</h2>
                                <p>Gestión Estratégica Institucional</p>
                            </div>
                            <form onSubmit={handleSubmit} className="atlas-form">
                                <div className="input-field">
                                    <label>Teacher Key</label>
                                    <input type="text" name="user_key" placeholder="Ingresa tu clave" value={credentials.user_key} onChange={handleInputChange} required />
                                </div>
                                <div className="input-field">
                                    <label>Contraseña</label>
                                    <input type="password" name="pass" placeholder="••••••••" value={credentials.pass} onChange={handleInputChange} required />
                                </div>
                                {error && (
                                    <div className="error-badge">
                                        <span className="error-icon">⚠️</span> {error}
                                    </div>
                                )}
                                <button type="submit" className={`btn-atlas-grad ${loading ? 'loading' : ''}`} disabled={loading}>
                                    {loading ? "Verificando..." : "Acceder al Portal"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-wrapper">
            {/* NAVBAR CON LÓGICA DE TRANSPARENCIA */}
            <nav className={`atlas-navbar landing-nav ${isScrolled ? 'scrolled' : 'transparent'}`}>
                <div className="nav-container">
                    <div className="nav-logo-large">
                        {/* El src cambia dinámicamente aquí */}
                        <img
                            src={isScrolled ? "./logo1.png" : "./logo.png"}
                            alt="Logo ATLAS"
                        />
                    </div>
                    <div className="nav-links-centered">
                        <a href="#porque">¿Por qué ATLAS?</a>
                        <a href="#que-es">El Marco</a>
                        <a href="#quienes">¿Para quién?</a>
                        <a href="#certificacion">Certificación</a>
                    </div>
                    <div className="nav-auth-trigger">
                        <button className="btn-nav-login" onClick={() => setView("login")}>Login</button>
                    </div>
                </div>
            </nav>

            {/* HERO CON VIDEO DE FONDO */}
            <header className="hero-section hero-original-dark">
                <video autoPlay muted loop playsInline className="hero-video-bg">
                    <source src="https://res.cloudinary.com/deafueoco/video/upload/v1/12336965-hd_1920_1028_60fps_pxhxm0" type="video/mp4" />
                    Tu navegador no soporta videos.
                </video>

                <div className="hero-overlay-dark"></div>

                {/* Contenedor central (Dueño del centro de la pantalla) */}
                <div className="hero-content">
                    <h1 className="hero-title">ATLAS</h1>
                    <p className="hero-subtitle">
                        Acompañamos a instituciones educativas y equipos directivos en la adopción de la IA con claridad, ética y visión de largo plazo.
                    </p>

                    <div className="hero-actions-layout">
                        <button className="btn-primary-large" onClick={() => document.getElementById('que-es').scrollIntoView({ behavior: 'smooth' })}>
                            Explorar ATLAS
                        </button>
                        <button className="btn-secondary-large" onClick={() => document.getElementById('porque').scrollIntoView({ behavior: 'smooth' })}>
                            Conocer el marco
                        </button>
                    </div>
                </div>

                {/* Capa independiente (No afecta el centrado del texto) */}
                <div
                    className="hero-discover-more-fixed"
                    onClick={() => document.getElementById('porque')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <p>Descubre más</p>
                    <span className="arrow-down-anim">↓</span>
                </div>
            </header>

            <section className="section-white section-spacious" id="porque">
                <div className="container">
                    <div className="section-header-content">
                        <p className="section-tag-gold">¿Por qué ATLAS?</p>
                        <h2 className="section-title-large">La educación necesita un marco que asegure la innovación</h2>

                        <div className="section-intro-group">
                            <div className="intro-text-column">
                                <p>La inteligencia artificial no puede adoptarse sin criterios institucionales claros. Sin alineación con procesos de calidad y aseguramiento, su uso pierde coherencia y aumenta los riesgos.</p>
                            </div>
                            <div className="intro-text-column">
                                <p>ATLAS articula la adopción de la IA con los sistemas de calidad, fortaleciendo la gobernanza, la ética y la sostenibilidad institucional.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid-features-animated">
                        {/* CARD 1 */}
                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Cambio acelerado</h3>
                                <p>La IA transforma la educación más rápido de lo que las instituciones pueden responder.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        {/* CARD 2 */}
                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Uso fragmentado</h3>
                                <p>Decisiones dispersas sin lineamientos claros ni estrategia institucional.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        {/* CARD 3 */}
                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zm14 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Incertidumbre docente</h3>
                                <p>Profesores y directivos sienten presión sin orientación clara.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>

                        {/* CARD 4 */}
                        <div className="feature-card-premium">
                            <div className="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="feature-card-content">
                                <h3>Riesgos crecientes</h3>
                                <p>Amenazas éticas, pedagógicas y legales sin protocolos definidos.</p>
                            </div>
                            <div className="card-corner-accent"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN DIFERENCIAL REESTRUCTURADA */}
            <section className="atlas-diff-section">
                <div className="diff-background-overlay"></div>
                <div className="container diff-container">

                    <div className="diff-flex-layout">
                        {/* Bloque Izquierdo: Texto Principal */}
                        <div className="diff-text-content">
                            <span className="diff-tag">Propósito</span>
                            <h2 className="diff-main-title">ATLAS surge para aportar coherencia, responsabilidad y propósito</h2>
                            <div className="diff-accent-line"></div>
                            <p className="diff-description">
                                ATLAS no es una plataforma tecnológica ni un programa de capacitación. Es un modelo de gobernanza institucional diseñado para asegurar que la adopción de la IA responda a criterios pedagógicos, éticos y estratégicos consistentes con estándares internacionales.</p>
                        </div>

                        {/* Bloque Derecho: Tarjeta Flotante (Glassmorphism) */}
                        <div className="diff-highlight-card">
                            <div className="diff-card-inner">
                                <h3>¿Qué hace diferente a ATLAS?</h3>
                                <p className="diff-card-subtitle">De lo reactivo a lo estratégico</p>
                                <p className="diff-card-text">Pasamos de la improvisación a una estrategia institucional clara y compartida fundamentada en los lineamientos internacionales que han establecido principios claros en materia de:</p>

                                <div className="diff-pills-container">
                                    <div className="diff-pill">Innovación <span>↔</span> Ética</div>
                                    <div className="diff-pill">Tecnología <span>↔</span> Pedagogía</div>
                                    <div className="diff-pill">Experimentación <span>↔</span> Gobernanza</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de Pilares: Ahora con clases únicas */}
                    <div className="diff-pillars-grid">
                        {[
                            { t: "Marco estratégico", d: "Proceso de transformación institucional." },
                            { t: "Centrado en personas", d: "Empodera y acompaña a los docentes." },
                            { t: "Visión institucional", d: "Decisiones colectivas estratégicas." },
                            { t: "Base pedagógica", d: "Fundamentado en ética y gobernanza." },
                            { t: "Contextual", d: "Diseñado para realidades diversas." },
                            { t: "Calidad", d: "Alineación con procesos de acreditación." }
                        ].map((pillar, idx) => (
                            <div className="diff-pillar-card" key={idx}>
                                <h4>{pillar.t}</h4>
                                <p>{pillar.d}</p>
                                <div className="pillar-hover-line"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* EL MARCO (DISEÑO TERCER PANEL REFINADO) */}
            <section className="atlas-framework-section" id="que-es">
                <div className="container framework-container">
                    <div className="framework-grid">

                        {/* LADO IZQUIERDO: Información fija (Sticky) */}
                        <div className="framework-sticky-info">
                            <span className="diff-tag">El Modelo</span>
                            <h2 className="framework-title">Un marco estructurado y adaptable</h2>
                            <div className="diff-accent-line"></div>
                            <p className="framework-description">
                                ATLAS se estructura en cinco fases interdependientes que conforman un ciclo continuo de madurez institucional:
                            </p>
                            <div className="framework-badge">
                                Estas fases no constituyen servicios independientes, sino dimensiones articuladas de un mismo sistema de gobernanza.
                            </div>
                        </div>

                        {/* LADO DERECHO: Flujo de Pasos (Scrollable) */}
                        <div className="framework-steps-scroll">
                            {[
                                { l: 'A', t: 'Auditar', d: 'Evaluación estructurada del estado actual, prácticas existentes y riesgos asociados al uso de la IA, en coherencia con estándares internacionales.' },
                                { l: 'T', t: 'Transformar', d: 'Rediseño intencional de prácticas pedagógicas y procesos académicos para integrar la IA de manera alineada con el proyecto educativo institucional.' },
                                { l: 'L', t: 'Liderar', d: 'Fortalecimiento del liderazgo académico y definición de responsabilidades institucionales para la toma de decisiones informadas y éticamente fundamentadas.' },
                                { l: 'A', t: 'Asegurar', d: 'Establecimiento de criterios, estándares y mecanismos de evaluación que permitan verificar impacto, calidad y cumplimiento de principios éticos.' },
                                { l: 'S', t: 'Sostener', d: 'Integración del modelo como práctica institucional permanente mediante monitoreo, evidencia y mejora continua.' }
                            ].map((step, i) => (
                                <div className="atlas-step-card" key={i}>
                                    <div className="step-letter-container">
                                        <span className="letter-bg">{step.l}</span>
                                        <span className="step-number">0{i + 1}</span>
                                    </div>
                                    <div className="step-content">
                                        <h3>{step.t}</h3>
                                        <p>{step.d}</p>
                                    </div>
                                    <div className="step-connector"></div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* SECCIÓN AUDIENCIA OBJETIVO (PARA QUIÉN) */}
            <section className="atlas-audience-section" id="quienes">
                <div className="container">
                    <div className="audience-wrapper">

                        <div className="audience-header">
                            <span className="diff-tag">Perfiles</span>
                            <h2 className="audience-main-title">Diseñado para comunidades educativas</h2>
                            <div className="audience-tags-cloud">
                                <span className="tag-item">Directivos Escolares</span>
                                <span className="tag-item">Rectores Universitarios.</span>
                                <span className="tag-item">Equipos de Calidad</span>
                                <span className="tag-item">Consultores</span>
                            </div>
                        </div>

                        <div className="audience-grid-layout">
                            {/* 1. Instituciones que inician */}
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Instituciones que inician</h4>
                                    <p>Colegios y universidades dando sus primeros pasos con IA y buscando orientación clara.</p>
                                </div>
                            </div>

                            {/* 2. Universidades escalando */}
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Centros Educativos escalando</h4>
                                    <p>Instituciones que buscan escalar prácticas responsables a nivel organizacional con estándares globales.</p>
                                </div>
                            </div>

                            {/* 3. Equipos de innovación */}
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Equipos de innovación</h4>
                                    <p>Equipos que necesitan orden, visión estratégica y gobernanza para sus iniciativas tecnológicas.</p>
                                </div>
                            </div>

                            {/* 4. Líderes estratégicos */}
                            <div className="audience-card">
                                <div className="audience-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="audience-info">
                                    <h4>Educadores estratégicos</h4>
                                    <p>Directivos y docentes que prefieren la estrategia antes que las herramientas, y la visión antes que las modas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN IMPLEMENTACIÓN (TRAYECTORIA ESTRATÉGICA) */}
            <section className="atlas-impl-section">
                <div className="container">
                    <div className="impl-header">
                        <span className="diff-tag">Metodología</span>
                        <h2 className="impl-main-title">¿Cómo se implementa ATLAS?</h2>
                    </div>

                    <div className="impl-timeline-wrapper">
                        {[
                            { n: '01', t: 'Diagnóstico', d: 'Evaluación integral del estado actual y nivel de preparación institucional.' },
                            { n: '02', t: 'Formación', d: 'Rutas de capacitación estratégica para docentes y equipos directivos.' },
                            { n: '03', t: 'Lineamientos', d: 'Creación de criterios institucionales para el uso ético y responsable.' },
                            { n: '04', t: 'Acompañamiento', d: 'Asesoría profesional continua para asegurar la sostenibilidad.' }
                        ].map((item, i) => (
                            <div className="impl-step-card" key={i}>
                                <div className="impl-number-badge">{item.n}</div>
                                <div className="impl-content">
                                    <h3>{item.t}</h3>
                                    <p>{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECCIÓN CERTIFICACIÓN (NIVELES DE MADUREZ) */}
            <section className="atlas-cert-section" id="certificacion">
                <div className="container">
                    <div className="cert-grid-layout">
                        <div className="cert-intro">
                            <span className="diff-tag">Acreditación</span>
                            <h2 className="cert-title">Certificación ATLAS por niveles</h2>
                            <p className="cert-lead">Reconocemos el nivel de madurez alcanzado en la adopción responsable de la IA bajo estándares institucionales.</p>
                            <div className="cert-badge-note">
                                <strong>Nota:</strong> Evalúa procesos, no herramientas.
                            </div>
                        </div>

                        <div className="cert-cards-container">
                            {[
                                { lvl: '1', name: 'Foundation', desc: 'Bases para la adopción responsable.', points: ['Diagnóstico inicial', 'Principios éticos', 'Sensibilización'] },
                                { lvl: '2', name: 'Pro', desc: 'Integración en procesos académicos.', points: ['Enfoque pedagógico', 'Gobernanza IA', 'Rutas docentes'] },
                                { lvl: '3', name: 'Advanced', desc: 'Consolidación y sostenibilidad.', points: ['Planeación estratégica', 'Mejora continua', 'Gestión de riesgos'] }
                            ].map((cert, i) => (
                                <div className={`cert-card-tier tier-${cert.lvl}`} key={i}>
                                    <div className="cert-tier-header">
                                        <span className="lvl-tag">Nivel {cert.lvl}</span>
                                        <h3>{cert.name}</h3>
                                    </div>
                                    <p className="cert-tier-desc">{cert.desc}</p>
                                    <ul className="cert-points-list">
                                        {cert.points.map((point, j) => (
                                            <li key={j}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="cert-tier-footer">ATLAS Certified</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN FAQ (PREGUNTAS FRECUENTES REFINADAS) */}
            <section className="atlas-faq-section">
                <div className="container narrow-container">

                    <div className="faq-header">
                        <span className="diff-tag">Soporte</span>
                        <h2 className="faq-title">Resolviendo tus dudas sobre ATLAS</h2>
                        <div className="faq-accent-line"></div>
                    </div>

                    <div className="faq-accordion-group">
                        {faqData.map((item, index) => (
                            <div
                                className={`faq-item-premium ${activeFaq === index ? 'faq-open' : ''}`}
                                key={index}
                            >
                                <button
                                    className="faq-trigger"
                                    onClick={() => toggleFaq(index)}
                                    aria-expanded={activeFaq === index}
                                >
                                    <span className="faq-question-text">{item.q}</span>
                                    <div className="faq-icon-status">
                                        <span className="line-h"></span>
                                        <span className={`line-v ${activeFaq === index ? 'rotated' : ''}`}></span>
                                    </div>
                                </button>

                                <div className="faq-response-wrapper">
                                    <div className="faq-response-content">
                                        <p>{item.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="faq-footer-help">
                        <p>¿Tienes más preguntas? <a href="mailto:atlasframework.ai@gmail.com">Contáctanos directamente</a></p>
                    </div>
                </div>
            </section>

            {/* SECCIÓN CONTACTO (FINAL CONVERSION) */}
            <section className="atlas-contact-section">
                <div className="contact-bg-decoration"></div>
                <div className="container">
                    <div className="contact-flex-layout">

                        {/* Info Panel */}
                        <div className="contact-text-panel">
                            <span className="diff-tag">Contacto</span>
                            <h2 className="contact-main-title">Comienza tu camino con ATLAS</h2>
                            <p className="contact-subtitle">
                                Tanto si das tus primeros pasos como si buscas ordenar prácticas existentes,
                                nuestro equipo te ayudará a avanzar con visión de largo plazo.
                            </p>

                            <div className="contact-cards-info">
                                <div className="contact-mini-card">
                                    <div className="mini-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span>Escríbenos</span>
                                        <p>atlasframework.ai@gmail.com</p>
                                    </div>
                                </div>

                                <div className="contact-mini-card">
                                    <div className="mini-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span>Enfoque</span>
                                        <p>Estrategia institucional global</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Panel (Glassmorphism) */}
                        <div className="contact-form-container">
                            <form className="atlas-premium-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <input type="text" placeholder="Nombre completo" required />
                                    </div>
                                    <div className="input-group">
                                        <input type="email" placeholder="Email corporativo" required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <input type="text" placeholder="Institución Educativa" required />
                                </div>
                                <div className="input-group">
                                    <textarea placeholder="¿En qué fase de adopción de IA se encuentran?" rows="4"></textarea>
                                </div>
                                <button type="submit" className="btn-form-submit">
                                    Solicitar Consultoría Inicial
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};