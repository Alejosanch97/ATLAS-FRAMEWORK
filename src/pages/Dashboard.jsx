import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/dashboard.css";
import { Formularios } from "./Formularios";
import { ResponderFormularios } from "./ResponderFormularios";
import { Analisis } from "./Analisis";

const API_URL = 'https://script.google.com/macros/s/AKfycbxcqIbNhC3H7za-GsBF9iuTU___o8OBCF8URGNxwdQm5q8pUd1vpgthbYyrBRkGXJ5Y8Q/exec';

export const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [huellaPuntaje, setHuellaPuntaje] = useState(0);

    // --- ESTADOS ADICIONALES ---
    const [allFormsInfo, setAllFormsInfo] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [isUserCardExpanded, setIsUserCardExpanded] = useState(true);
    const [compassTab, setCompassTab] = useState(0); // 0: 0-39, 1: 40-59, 2: 60-74, 3: 75-89, 4: 90-100
    
    // --- NUEVO ESTADO PARA FILTRADO POR FASE ---
    const [filterPhase, setFilterPhase] = useState(""); 

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [misRetos, setMisRetos] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [userResponses, setUserResponses] = useState([]);
    const [showRetoForm, setShowRetoForm] = useState(false);
    const [editingReto, setEditingReto] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem("userATLAS");
        if (!savedUser) {
            navigate("/");
        } else {
            const data = JSON.parse(savedUser);
            setUserData(data);
            loadInitialData(data.Teacher_Key, data.Rol);
        }
    }, [navigate]);

    const loadInitialData = async (key, rol) => {
        setIsLoading(true);
        try {
            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const dataForms = await resForms.json();
            if (Array.isArray(dataForms)) setAllFormsInfo(dataForms);

            const resRetos = await fetch(`${API_URL}?sheet=Weekly_Challenges&user_key=${key}`);
            const dataRetos = await resRetos.json();
            if (Array.isArray(dataRetos)) setMisRetos(dataRetos);

            const resResp = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${key}`);
            const dataResp = await resResp.json();
            if (Array.isArray(dataResp)) setUserResponses(dataResp);

            if (rol === "ADMIN") await fetchAllUsers();
        } catch (e) {
            console.error("Error cargando datos iniciales", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const calcularHuella = () => {
            if (allFormsInfo.length === 0) return;
            let maxPuntosConfigurados = 0;
            allFormsInfo.forEach(f => {
                maxPuntosConfigurados += parseFloat(f.Puntos_Maximos || 0);
            });
            if (maxPuntosConfigurados === 0) maxPuntosConfigurados = 100;
            const sumaNotasObtenidas = userResponses.reduce((sum, r) => sum + parseFloat(r.Puntos_Ganados || 0), 0);
            const porcentajeForms = (sumaNotasObtenidas / maxPuntosConfigurados) * 92;
            const totalRetos = misRetos.length;
            const retosCompletados = misRetos.filter(r => r.Status === 'completed').length;
            const porcentajeRetos = totalRetos > 0 ? (retosCompletados / totalRetos) * 8 : 0;
            const total = Math.min(porcentajeForms + porcentajeRetos, 100);
            setHuellaPuntaje(Math.round(total));
        };
        calcularHuella();
    }, [userResponses, misRetos, allFormsInfo]);

    useEffect(() => {
        if (huellaPuntaje >= 90) setCompassTab(4);
        else if (huellaPuntaje >= 75) setCompassTab(3);
        else if (huellaPuntaje >= 60) setCompassTab(2);
        else if (huellaPuntaje >= 40) setCompassTab(1);
        else setCompassTab(0);
    }, [huellaPuntaje]);

    const handleToggleRetoStatus = async (reto) => {
        const nuevoEstado = reto.Status === 'completed' ? 'non completed' : 'completed';
        const retoActualizado = { ...reto, Status: nuevoEstado };
        setMisRetos(prev => prev.map(r => r.ID_Challenge === reto.ID_Challenge ? retoActualizado : r));
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update', sheet: 'Weekly_Challenges', idField: 'ID_Challenge', idValue: reto.ID_Challenge, data: retoActualizado
                })
            });
        } catch (e) { console.error("Error actualizando reto", e); }
    };

    const fetchAllUsers = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_URL}?sheet=Users_ATLAS`);
            const data = await res.json();
            if (Array.isArray(data)) setAllUsers(data);
        } catch (e) { console.error("Error cargando usuarios", e); }
        finally { setIsSyncing(false); }
    };

    const handleManualRefresh = () => {
        loadInitialData(userData.Teacher_Key, userData.Rol);
    };

    const handleDelete = async (sheet, idField, idValue) => {
        if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;
        setIsSyncing(true);
        if (sheet === 'Weekly_Challenges') {
            setMisRetos(prev => prev.filter(r => r[idField] !== idValue));
        } else {
            setAllUsers(prev => prev.filter(u => u[idField] !== idValue));
        }
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', sheet, idField, idValue })
            });
        } finally { setIsSyncing(false); }
    };

    const handleSubmitReto = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const currentId = editingReto ? editingReto.ID_Challenge : `CH-${Date.now()}`;
        const nuevoReto = {
            ID_Challenge: currentId,
            Teacher_Key: userData.Teacher_Key,
            Challenge_Description: formData.get("Challenge_Description"),
            Start_Date: formData.get("Start_Date"),
            Days_Active: formData.get("Days_Active"),
            Status: editingReto ? editingReto.Status : 'non completed'
        };
        if (editingReto) setMisRetos(prev => prev.map(r => r.ID_Challenge === currentId ? nuevoReto : r));
        else setMisRetos(prev => [...prev, nuevoReto]);
        setShowRetoForm(false); setEditingReto(null); setIsSyncing(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: editingReto ? 'update' : 'create', sheet: 'Weekly_Challenges', idField: 'ID_Challenge', idValue: currentId, data: nuevoReto
                })
            });
        } finally { setIsSyncing(false); }
    };

    const handleEditReto = (reto) => { setEditingReto(reto); setShowRetoForm(true); };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tkey = fd.get("tkey");
        const userObj = {
            Teacher_Key: tkey, Nombre_Completo: fd.get("nombre"), Rol: fd.get("rol"), Email: fd.get("email"), Huella_IA_Total: editingUser ? editingUser.Huella_IA_Total : 0
        };
        if (editingUser) setAllUsers(prev => prev.map(u => u.Teacher_Key === tkey ? userObj : u));
        else setAllUsers(prev => [...prev, userObj]);
        setShowUserModal(false); setEditingUser(null); setIsSyncing(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: editingUser ? 'update' : 'create', sheet: 'Users_ATLAS', idField: 'Teacher_Key', idValue: tkey, data: { ...userObj, Password_Hash: fd.get("pass") }
                })
            });
        } finally { setIsSyncing(false); }
    };

    const handleLogoutAction = () => {
        localStorage.removeItem("userATLAS");
        if (onLogout) onLogout();
        navigate("/");
    };

    // --- MODIFICADO: AHORA SOPORTA FASES ---
    const switchTab = (tab, phase = "") => {
        setActiveTab(tab);
        setFilterPhase(phase); // Almacenamos la fase seleccionada (A, T, o L)
        setIsMobileMenuOpen(false);
    };

    const getHeaderContent = () => {
        switch (activeTab) {
            case "talentos": return { title: "Gestión de Talentos", subtitle: "L - Liderar: Administración de Usuarios" };
            case "formularios": return { title: "Arquitecto de Instrumentos", subtitle: "A - Auditar: Gestión de Formularios" };
            case "explorador": return { title: "Explorador de Evidencias", subtitle: "T - Transformar: Centro de Respuesta" };
            case "analisis": return { title: "Análisis Estratégico", subtitle: "T - Transformar: Data e Insights" };
            case "retos": return { title: "Mis Retos Estratégicos", subtitle: "L - Liderar: Seguimiento de Objetivos" };
            case "responder_fase": 
                const faseTxt = filterPhase === "A" ? "AUDITAR" : filterPhase === "T" ? "TRANSFORM" : "LEAD";
                return { title: `Fase ${faseTxt}`, subtitle: `Instrumentos de la Etapa ${filterPhase}` };
            default: return { title: "Bienvenido al Marco ATLAS", subtitle: "Liderazgo y Transformación Digital" };
        }
    };

    const headerContent = getHeaderContent();

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => 
            u.Teacher_Key !== userData?.Teacher_Key && 
            (u.Nombre_Completo?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
             u.Teacher_Key?.toLowerCase().includes(userSearchTerm.toLowerCase()))
        );
    }, [allUsers, userSearchTerm, userData]);

    const getCompassData = () => {
        const info = [
            {
                range: "0-39%",
                title: "Exploración inicial",
                body: "Tu COMPASS indica que estás comenzando a tomar conciencia de cómo la inteligencia artificial puede aparecer en la práctica educativa. Tal vez aún no la usas, o lo haces de forma intuitiva, pero eso es un punto de partida valioso: la reflexión precede a cualquier decisión pedagógica sólida. ATLAS está aquí para acompañarte paso a paso.",
                next: "Iniciar un recorrido guiado que te ayude a leer tu práctica con nuevos lentes."
            },
            {
                range: "40-59%",
                title: "Uso emergente",
                body: "Tu COMPASS muestra que ya has experimentado con la IA de forma ocasional y que estás empezando a desarrollar criterio sobre cuándo y para qué usarla. Aparecen preguntas importantes, ajustes por hacer y decisiones que aún se están afinando. Este perfil refleja curiosidad profesional.",
                next: "Transformar algunas prácticas concretas y asumir pequeños retos que fortalezcan tu intención pedagógica."
            },
            {
                range: "60-74%",
                title: "Práctica consciente",
                body: "Tu COMPASS indica un uso intencional de la IA, con evidencias claras de reflexión pedagógica. No se trata solo de usar tecnología, sino de decidir con sentido, cuidando el aprendizaje y el rol docente. En este punto, la IA empieza a convertirse en una aliada pensada.",
                next: "Consolidar evidencias de impacto y asegurar que lo que haces realmente mejora los procesos formativos."
            },
            {
                range: "75-89%",
                title: "Práctica alineada",
                body: "Tu COMPASS refleja una práctica altamente coherente con marcos pedagógicos y éticos internacionales. Usas la IA con criterio, documentas decisiones y puedes explicar por qué haces lo que haces. Este perfil muestra madurez profesional y capacidad de modelaje.",
                next: "Ejercer liderazgo pedagógico, compartir aprendizajes y pulir los últimos ajustes antes de la certificación."
            },
            {
                range: "90-100%",
                title: "Capacidad ATLAS demostrada",
                body: "Tu COMPASS muestra capacidad profesional demostrada para integrar la IA de forma pedagógica, ética y sostenible. Has generado evidencia en todas las fases ATLAS y mantiene un alto nivel de autorregulación y coherencia. Es un reconocimiento a tu trayectoria.",
                next: "Optar por la certificación ATLAS y contribuir como referente, mentor o diseñador."
            }
        ];
        return info[compassTab] || info[0];
    };

    if (!userData) return <div className="atlas-loader">Iniciando Sesión...</div>;

    return (
        <div className={`atlas-dashboard-layout ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? "✕" : "☰"}
            </button>

            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

            {(isSyncing || isLoading) && (
                <div className="sync-notification">
                    <span className="sync-spinner">🔄</span>
                    {isLoading ? "Sincronizando Sistema..." : "Actualizando nube..."}
                </div>
            )}

            <aside className={`atlas-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-user-top">
                    <div className="user-avatar-initial">{userData.Nombre_Completo?.charAt(0)}</div>
                    <div className="user-text">
                        <h3 className="user-name">{userData.Nombre_Completo}</h3>
                        <p className="user-role-badge">{userData.Rol}</p>
                    </div>
                </div>
                <div className="sidebar-divider"></div>
                <nav className="sidebar-nav">
                    <div className="nav-section">CONSOLA ESTRATÉGICA</div>
                    <button className={activeTab === "overview" ? "active" : ""} onClick={() => switchTab("overview")}>🏠 Panel de Control</button>
                    
                    {userData.Rol === "ADMIN" && (
                        <>
                            <button className={activeTab === "talentos" ? "active" : ""} onClick={() => switchTab("talentos")}>👥 Gestión de Talentos</button>
                            <button className={activeTab === "formularios" ? "active" : ""} onClick={() => switchTab("formularios")}>📐 Arquitecto de Instrumentos</button>
                            <button className={activeTab === "analisis" ? "active" : ""} onClick={() => switchTab("analisis")}>📊 Análisis de Formularios</button>
                            <button className={activeTab === "explorador" ? "active" : ""} onClick={() => switchTab("explorador")}>🔎 Explorador de Evidencias</button>
                        </>
                    )}
                    
                    <button className={activeTab === "retos" ? "active" : ""} onClick={() => switchTab("retos")}>🎯 Mis Retos Estratégicos</button>

                    <div className="nav-section">MARCO ATLAS</div>
                    
                    {/* SECCIÓN A - AUDIT */}
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">🛡️ A — AUDIT</div>
                        {userData.Rol === "DOCENTE" && (
                            <button 
                                className={activeTab === "responder_fase" && filterPhase === "A" ? "active-phase" : "phase-btn"} 
                                onClick={() => switchTab("responder_fase", "A")}>
                                Bitácora de Diagnóstico
                            </button>
                        )}
                    </div>

                    {/* SECCIÓN T - TRANSFORM */}
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">⚙️ T — TRANSFORM</div>
                        {userData.Rol === "DOCENTE" && (
                            <button 
                                className={activeTab === "responder_fase" && filterPhase === "T" ? "active-phase" : "phase-btn"} 
                                onClick={() => switchTab("responder_fase", "T")}>
                                Taller de Co-Creación
                            </button>
                        )}
                    </div>

                    {/* SECCIÓN L - LEAD */}
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">🚀 L — LEAD</div>
                        {userData.Rol === "DOCENTE" && (
                            <button 
                                className={activeTab === "responder_fase" && filterPhase === "L" ? "active-phase" : "phase-btn"} 
                                onClick={() => switchTab("responder_fase", "L")}>
                                Panel de Influencia
                            </button>
                        )}
                    </div>

                    <div className="atlas-nav-group"><div className="atlas-group-header">💎 A — ASSURE</div></div>
                    <div className="atlas-nav-group"><div className="atlas-group-header">🌱 S — SUSTAIN</div></div>
                </nav>
                <div className="sidebar-bottom">
                    <button className="btn-logout-minimal" onClick={handleLogoutAction}>
                        <span>Cerrar Sesión</span> <i className="icon-exit">🚪</i>
                    </button>
                </div>
            </aside>

            <main className="atlas-main-content">
                <header className="main-header">
                    <div className="header-title-group">
                        <div className="header-left-content">
                            <h1>{headerContent.title}</h1>
                            <p className="header-subtitle">{headerContent.subtitle}</p>
                        </div>
                        <button className="btn-refresh-data" onClick={handleManualRefresh}>
                            🔄 <span>Sincronizar</span>
                        </button>
                    </div>
                </header>

                {activeTab === "overview" && (
                    <section className="dashboard-grid">
                        <div className="info-card huella-card">
                            <h3>Compass de IA</h3>
                            <div className="atlas-a-container">
                                <svg viewBox="0 0 100 100" className="atlas-svg-shape">
                                    <defs>
                                        <mask id="maskA"><path d="M50 0 L100 100 H80 L70 75 H30 L20 100 H0 Z" fill="white" /></mask>
                                        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#c5a059" /><stop offset="100%" stopColor="#8a6d3b" />
                                        </linearGradient>
                                    </defs>
                                    <g mask="url(#maskA)">
                                        <rect x="0" y="0" width="100" height="100" fill="#f1f5f9" />
                                        <g className="liquid-group" style={{ transform: `translateY(${100 - huellaPuntaje}%)`, transition: 'transform 1s ease' }}>
                                            <path className="wave" d="M0,0 C30,-5 70,5 100,0 L100,100 L0,100 Z" />
                                            <rect x="0" y="0" width="100" height="100" className="liquid-body" fill="url(#goldGradient)" />
                                        </g>
                                    </g>
                                </svg>
                                <div className="huella-data">
                                    <span className="huella-number">{huellaPuntaje}%</span>
                                    <span className="huella-label">NIVEL ATLAS</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card prompt-card professional-upgrade">
                            <div className="card-header-flex">
                                <h3>🧭 COMPASS: {getCompassData().title} ({getCompassData().range})</h3>
                            </div>
                            <div className="prompt-content-rich">
                                <p className="intro-text-dark">{getCompassData().body}</p>
                                <span className="next-step-text-on-dark"><strong>Siguiente paso:</strong> {getCompassData().next}</span>
                                <div className="method-grid">
                                    {["0-39%", "40-59%", "60-74%", "75-89%", "90-100%"].map((label, idx) => (
                                        <div key={idx} className={`method-item ${compassTab === idx ? 'active' : ''}`} onClick={() => setCompassTab(idx)} style={{ cursor: 'pointer' }}>
                                            <strong>{label.split('-')[0]}</strong><span>{label.split('-')[1]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="info-card wide-card">
                            <div className="card-header-flex">
                                <h3>Retos Estratégicos Mensuales</h3>
                                <button className="btn-add-reto" onClick={() => { setShowRetoForm(!showRetoForm); setEditingReto(null); }}>
                                    {showRetoForm ? "✖ Cancelar" : "➕ Nuevo Reto"}
                                </button>
                            </div>
                            {showRetoForm && (
                                <form className="form-nuevo-reto" onSubmit={handleSubmitReto}>
                                    <input type="text" placeholder="Descripción del reto..." name="Challenge_Description" defaultValue={editingReto?.Challenge_Description} required />
                                    <div className="form-row">
                                        <input type="date" name="Start_Date" defaultValue={editingReto ? editingReto.Start_Date?.split('T')[0] : new Date().toISOString().split('T')[0]} />
                                        <input type="number" placeholder="Días" name="Days_Active" defaultValue={editingReto?.Days_Active} required />
                                        <button type="submit" className="btn-save-reto">{editingReto ? "Actualizar" : "Guardar"}</button>
                                    </div>
                                </form>
                            )}
                            <div className="challenges-grid-modern">
                                {misRetos.map(reto => (
                                    <div key={reto.ID_Challenge} className={`challenge-card-item ${reto.Status === 'completed' ? 'done' : ''}`}>
                                        <div className="challenge-main-info" onClick={() => handleToggleRetoStatus(reto)} style={{cursor:'pointer'}}>
                                            <input type="checkbox" checked={reto.Status === 'completed'} readOnly />
                                            <label>{reto.Challenge_Description}</label>
                                        </div>
                                        <div className="challenge-meta">
                                            <span className="reto-tag">{reto.Status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AQUÍ ESTÁ TU CARD DE CALIFICACIONES INTACTA */}
                        <div className="info-card wide-card">
                            <h3>📊 Mis Calificaciones Consolidadas</h3>
                            <div className="user-scroll-list" style={{maxHeight:'320px', overflowY:'auto'}}>
                                <table className="atlas-table">
                                    <thead style={{position:'sticky', top:0, backgroundColor:'#f8fafc', zIndex:5}}>
                                        <tr><th>Instrumento</th><th>Fecha</th><th>Tu Nota</th></tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const consolidado = userResponses.reduce((acc, curr) => {
                                                const id = curr.ID_Form;
                                                if (!acc[id]) {
                                                    const formRef = allFormsInfo.find(f => f.ID_Form === id);
                                                    acc[id] = { id, titulo: formRef ? formRef.Titulo_Form : id, puntos: 0, fecha: curr.Fecha_Respuesta };
                                                }
                                                acc[id].puntos += parseFloat(curr.Puntos_Ganados || 0);
                                                return acc;
                                            }, {});
                                            const lista = Object.values(consolidado);
                                            return lista.length > 0 ? lista.reverse().map((item, i) => (
                                                <tr key={i}>
                                                    <td><strong>{item.titulo}</strong></td>
                                                    <td>{new Date(item.fecha).toLocaleDateString()}</td>
                                                    <td><span className="user-key-tag" style={{ background: '#c5a059', color: 'white' }}>{item.puntos} pts</span></td>
                                                </tr>
                                            )) : <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>No hay registros.</td></tr>;
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "talentos" && userData.Rol === "ADMIN" && (
                    <section className="dashboard-grid">
                        <div className="info-card wide-card">
                            <div className="card-header-flex">
                                <h3>Base de Talentos ATLAS</h3>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <input type="text" placeholder="Buscar docente..." className="search-input-small" onChange={(e)=>setUserSearchTerm(e.target.value)} />
                                    <button className="btn-add-reto" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>➕ Nuevo Talento</button>
                                </div>
                            </div>
                            <div className="user-scroll-list" style={{maxHeight:'500px', overflowY:'auto'}}>
                                <table className="atlas-table">
                                    <thead><tr><th>Key</th><th>Nombre</th><th>Rol</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <tr key={u.Teacher_Key}>
                                                <td><span className="user-key-tag">{u.Teacher_Key}</span></td>
                                                <td>{u.Nombre_Completo}</td>
                                                <td><span className={`role-pill ${u.Rol}`}>{u.Rol}</span></td>
                                                <td className="actions-cell">
                                                    <button className="btn-action-icon edit" onClick={() => { setEditingUser(u); setShowUserModal(true); }}>✏️</button>
                                                    <button className="btn-action-icon delete" onClick={() => handleDelete('Users_ATLAS', 'Teacher_Key', u.Teacher_Key)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "formularios" && <Formularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "explorador" && <ResponderFormularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "analisis" && <Analisis userData={userData} API_URL={API_URL} />}
                
                {/* NUEVO RENDERIZADO FILTRADO POR FASE */}
                {activeTab === "responder_fase" && (
                    <ResponderFormularios 
                        userData={userData} 
                        isSyncing={isSyncing} 
                        setIsSyncing={setIsSyncing} 
                        API_URL={API_URL} 
                        filterPhase={filterPhase} 
                    />
                )}

                {activeTab === "retos" && (
                    <section className="dashboard-grid">
                        <div className="info-card wide-card">
                            <h3>Listado Completo de Retos</h3>
                            <div className="challenges-grid-modern">
                                {misRetos.map(reto => (
                                    <div key={reto.ID_Challenge} className={`challenge-card-item ${reto.Status === 'completed' ? 'done' : ''}`}>
                                        <div className="challenge-main-info" onClick={() => handleToggleRetoStatus(reto)} style={{cursor:'pointer'}}>
                                            <input type="checkbox" checked={reto.Status === 'completed'} readOnly />
                                            <label>{reto.Challenge_Description}</label>
                                        </div>
                                        <div className="challenge-meta">
                                            <span className="reto-tag">{reto.Status}</span>
                                            <div className="actions-cell">
                                                <button className="btn-action-icon edit-small" onClick={(e) => { e.stopPropagation(); handleEditReto(reto); }}>✏️</button>
                                                <button className="btn-action-icon delete-small" onClick={(e) => { e.stopPropagation(); handleDelete('Weekly_Challenges', 'ID_Challenge', reto.ID_Challenge); }}>🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {showUserModal && (
                <div className="atlas-modal-overlay">
                    <div className="atlas-modal">
                        <h2>{editingUser ? "Editar Talento" : "Nuevo Talento"}</h2>
                        <form onSubmit={handleCreateUser} className="modal-form">
                            <input name="tkey" placeholder="Teacher Key" defaultValue={editingUser?.Teacher_Key} readOnly={!!editingUser} required />
                            <input name="nombre" placeholder="Nombre Completo" defaultValue={editingUser?.Nombre_Completo} required />
                            <input name="email" type="email" placeholder="Correo" defaultValue={editingUser?.Email} required />
                            <input name="pass" type="password" placeholder="Contraseña" required={!editingUser} />
                            <select name="rol" defaultValue={editingUser?.Rol || "DOCENTE"}>
                                <option value="DOCENTE">DOCENTE</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <div className="modal-btns">
                                <button type="submit" className="btn-save-reto">Guardar</button>
                                <button type="button" onClick={() => setShowUserModal(false)} className="btn-exit">Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};