import React, { useState, useEffect } from "react";
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

    // --- CÁLCULO DE MADUREZ INSTITUCIONAL ---
    useEffect(() => {
        const calcularMadurez = () => {
            if (userResponses.length === 0 && misRetos.length === 0) return 0;
            const notasPorForm = {};
            userResponses.forEach(resp => {
                if (!notasPorForm[resp.ID_Form]) notasPorForm[resp.ID_Form] = 0;
                notasPorForm[resp.ID_Form] += parseFloat(resp.Puntos_Ganados || 0);
            });
            const promedios = Object.values(notasPorForm);
            const promedioFormularios = promedios.length > 0 ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
            const tieneRetosCompletos = misRetos.some(r => r.Status === 'completed');
            const bonoRetos = tieneRetosCompletos ? 8 : 0;
            const total = Math.min(promedioFormularios + bonoRetos, 100);
            setHuellaPuntaje(Math.round(total));
        };
        calcularMadurez();
    }, [userResponses, misRetos]);

    const fetchRetos = async (key) => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_URL}?sheet=Weekly_Challenges&user_key=${key}`);
            const data = await res.json();
            if (Array.isArray(data)) setMisRetos(data);
        } finally { setIsSyncing(false); }
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

    const fetchAnalisisData = async () => {
        setIsSyncing(true);
        try {
            const resResp = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`);
            const dataResp = await resResp.json();
            if (Array.isArray(dataResp)) setUserResponses(dataResp);
        } finally { setIsSyncing(false); }
    };

    // FUNCIÓN DE ACTUALIZACIÓN MANUAL CONTEXTUAL
    const handleManualRefresh = () => {
        if (activeTab === "overview") loadInitialData(userData.Teacher_Key, userData.Rol);
        if (activeTab === "retos") fetchRetos(userData.Teacher_Key);
        if (activeTab === "formularios" && userData.Rol === "ADMIN") fetchAllUsers(); // O la lógica de formularios
        if (activeTab === "analisis") fetchAnalisisData();
        if (activeTab === "explorador") fetchAnalisisData();
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
        } catch (e) {
            console.error("Error al eliminar", e);
            sheet === 'Weekly_Challenges' ? fetchRetos(userData.Teacher_Key) : fetchAllUsers();
        } finally {
            setIsSyncing(false);
        }
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

        if (editingReto) {
            setMisRetos(prev => prev.map(r => r.ID_Challenge === currentId ? nuevoReto : r));
        } else {
            setMisRetos(prev => [...prev, nuevoReto]); 
        }

        setShowRetoForm(false);
        setEditingReto(null);
        setIsSyncing(true);

        try {
            await fetch(API_URL, { 
                method: 'POST', 
                body: JSON.stringify({
                    action: editingReto ? 'update' : 'create',
                    sheet: 'Weekly_Challenges',
                    idField: 'ID_Challenge',
                    idValue: currentId,
                    data: nuevoReto
                }) 
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEditReto = (reto) => {
        setEditingReto(reto);
        setShowRetoForm(true);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tkey = fd.get("tkey");
        const userObj = {
            Teacher_Key: tkey,
            Nombre_Completo: fd.get("nombre"),
            Rol: fd.get("rol"),
            Email: fd.get("email"),
            Huella_IA_Total: editingUser ? editingUser.Huella_IA_Total : 0
        };
        if (editingUser) {
            setAllUsers(prev => prev.map(u => u.Teacher_Key === tkey ? userObj : u));
        } else {
            setAllUsers(prev => [...prev, userObj]);
        }
        setShowUserModal(false);
        setEditingUser(null);
        setIsSyncing(true);
        try {
            await fetch(API_URL, { 
                method: 'POST', 
                body: JSON.stringify({
                    action: editingUser ? 'update' : 'create',
                    sheet: 'Users_ATLAS',
                    idField: 'Teacher_Key',
                    idValue: tkey,
                    data: { ...userObj, Password_Hash: fd.get("pass") }
                }) 
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogoutAction = () => {
        localStorage.removeItem("userATLAS");
        if (onLogout) onLogout();
        navigate("/");
    };

    const getHeaderContent = () => {
        switch (activeTab) {
            case "formularios": return { title: "Arquitecto de Instrumentos", subtitle: "A - Auditar: Gestión de Formularios" };
            case "explorador": return { title: "Explorador de Evidencias", subtitle: "T - Transformar: Centro de Respuesta" };
            case "analisis": return { title: "Análisis Estratégico", subtitle: "T - Transformar: Data e Insights" };
            case "retos": return { title: "Mis Retos Estratégicos", subtitle: "L - Liderar: Seguimiento de Objetivos" };
            default: return { title: "Bienvenido al Marco ATLAS", subtitle: "Liderazgo y Transformación Digital" };
        }
    };

    const headerContent = getHeaderContent();

    if (!userData) return <div className="atlas-loader">Iniciando Sesión...</div>;

    return (
        <div className="atlas-dashboard-layout">
            {(isSyncing || isLoading) && (
                <div className="sync-notification">
                    <span className="sync-spinner">🔄</span> 
                    {isLoading ? "Sincronizando Sistema..." : "Actualizando nube..."}
                </div>
            )}

            <aside className="atlas-sidebar">
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
                    <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>🏠 Panel de Control</button>
                    
                    <div className="nav-section">MARCO ATLAS</div>
                    
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">🛡️ A - AUDITAR</div>
                        {userData.Rol === "ADMIN" && (
                            <>
                                <button className="sub-btn" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>👥 Gestión de Talentos</button>
                                <button className={activeTab === "formularios" ? "active" : ""} onClick={() => setActiveTab("formularios")}>📐 Arquitecto de Instrumentos</button>
                            </>
                        )}
                    </div>

                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">⚙️ T - TRANSFORMAR</div>
                        <button className={activeTab === "explorador" ? "active" : ""} onClick={() => setActiveTab("explorador")}>🔎 Explorador de Evidencias</button>
                        {userData.Rol === "ADMIN" && (
                            <button className={activeTab === "analisis" ? "active" : ""} onClick={() => setActiveTab("analisis")}>📊 Análisis de Formularios</button>
                        )}
                    </div>

                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">🚀 L - LIDERAR</div>
                        <button className={activeTab === "retos" ? "active" : ""} onClick={() => setActiveTab("retos")}>🎯 Mis Retos Estratégicos</button>
                    </div>

                    <div className="atlas-nav-group">
                        <div className="atlas-group-header">📊 A / 🌱 S</div>
                        <button disabled className="btn-disabled">🔒 Módulos en Desarrollo</button>
                    </div>
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

                        <button className="btn-refresh-data" onClick={handleManualRefresh} title="Actualizar Información">
                            🔄 <span>Sincronizar</span>
                        </button>
                    </div>
                </header>

                {activeTab === "overview" && (
                    <section className="dashboard-grid">
                        <div className="info-card huella-card">
                            <h3>Huella Digital de IA</h3>
                            <div className="atlas-a-container">
                                <svg viewBox="0 0 100 100" className="atlas-svg-shape">
                                    <defs>
                                        <mask id="maskA">
                                            <path d="M50 0 L100 100 H80 L70 75 H30 L20 100 H0 Z" fill="white" />
                                        </mask>
                                    </defs>
                                    <g mask="url(#maskA)">
                                        <rect x="0" y="0" width="100" height="100" fill="#f1f5f9" />
                                        <g className="liquid-group" style={{ transform: `translateY(${100 - huellaPuntaje}%)` }}>
                                            <path className="wave" d="M0,0 C30,-5 70,5 100,0 L100,100 L0,100 Z" />
                                            <rect x="0" y="0" width="100" height="100" className="liquid-body" />
                                        </g>
                                    </g>
                                </svg>
                                <div className="huella-data">
                                    <span className="huella-number" style={{ color: '#1a202c', textShadow: '0 0 8px #ffffff' }}>{huellaPuntaje}%</span>
                                    <span className="huella-label" style={{ color: '#2d3748', fontWeight: '800' }}>NIVEL ATLAS</span>
                                </div>
                            </div>
                            <p style={{textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '15px', fontWeight: '500'}}>
                                Promedio Formularios + Bono Retos
                            </p>
                        </div>

                        <div className="info-card prompt-card professional-upgrade">
                            <div className="card-header-flex">
                                <h3>🚀 El Arte del Prompt: Método ATLAS</h3>
                                <span className="badge-pro">PRO</span>
                            </div>
                            <div className="prompt-content-rich">
                                <p className="intro-text">Para obtener resultados excepcionales de la IA, utiliza la estructura <strong>Rol + Contexto + Tarea + Formato</strong>:</p>
                                
                                <div className="method-grid">
                                    <div className="method-item"><strong>R</strong><span>ol</span></div>
                                    <div className="method-item"><strong>C</strong><span>ontexto</span></div>
                                    <div className="method-item"><strong>T</strong><span>area</span></div>
                                    <div className="method-item"><strong>F</strong><span>ormato</span></div>
                                </div>

                                <div className="example-box">
                                    <span className="example-label">Ejemplo para Docentes:</span>
                                    <code>
                                        "Actúa como un <strong>experto en pedagogía universitaria</strong> (R).
                                        Estoy diseñando una clase para <strong>estudiantes universitarios</strong> sobre <strong>pensamiento crítico y uso ético de la IA</strong> (C).
                                        Diseña <strong>3 actividades académicas activas</strong> que fomenten análisis y discusión, sin software especializado (T).
                                        Presenta el resultado en una <strong>tabla comparativa</strong> con objetivos y evidencias de aprendizaje (F)."
                                    </code>
                                </div>
                            </div>
                        </div>

                        {userData.Rol === "ADMIN" && (
                            <div className="info-card wide-card">
                                <div className="card-header-flex">
                                    <h3>Gestión de Usuarios (Admin)</h3>
                                    <button className="btn-add-reto" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>➕ Nuevo Talento</button>
                                </div>
                                <div className="user-scroll-list">
                                    <table className="atlas-table">
                                        <thead>
                                            <tr><th>Key</th><th>Nombre</th><th>Rol</th><th>Acciones</th></tr>
                                        </thead>
                                        <tbody>
                                            {allUsers.filter(u => u.Teacher_Key !== userData.Teacher_Key).map(u => (
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
                        )}

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
                                        <div className="challenge-main-info">
                                            <input type="checkbox" checked={reto.Status === 'completed'} readOnly />
                                            <label>{reto.Challenge_Description}</label>
                                        </div>
                                        <div className="challenge-meta">
                                            <span className="reto-tag">{reto.Status}</span>
                                            <div className="actions-cell">
                                                <button className="btn-action-icon edit-small" onClick={() => handleEditReto(reto)}>✏️</button>
                                                <button className="btn-action-icon delete-small" onClick={() => handleDelete('Weekly_Challenges', 'ID_Challenge', reto.ID_Challenge)}>🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "formularios" && userData.Rol === "ADMIN" && <Formularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "explorador" && <ResponderFormularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "analisis" && userData.Rol === "ADMIN" && <Analisis userData={userData} API_URL={API_URL} />}
                
                {activeTab === "retos" && (
                    <section className="dashboard-grid">
                        <div className="info-card wide-card">
                            <h3>Listado Completo de Retos</h3>
                            <div className="challenges-grid-modern">
                                {misRetos.map(reto => (
                                    <div key={reto.ID_Challenge} className={`challenge-card-item ${reto.Status === 'completed' ? 'done' : ''}`}>
                                        <div className="challenge-main-info">
                                            <input type="checkbox" checked={reto.Status === 'completed'} readOnly />
                                            <label>{reto.Challenge_Description}</label>
                                        </div>
                                        <div className="challenge-meta">
                                            <span className="reto-tag">{reto.Status}</span>
                                            <div className="actions-cell">
                                                <button className="btn-action-icon edit-small" onClick={() => handleEditReto(reto)}>✏️</button>
                                                <button className="btn-action-icon delete-small" onClick={() => handleDelete('Weekly_Challenges', 'ID_Challenge', reto.ID_Challenge)}>🗑️</button>
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
                        <h2>{editingUser ? "Editar Talento" : "Registrar Nuevo Talento"}</h2>
                        <form onSubmit={handleCreateUser} className="modal-form">
                            <input name="tkey" placeholder="Teacher Key" defaultValue={editingUser?.Teacher_Key} readOnly={!!editingUser} required />
                            <input name="nombre" placeholder="Nombre Completo" defaultValue={editingUser?.Nombre_Completo} required />
                            <input name="email" type="email" placeholder="Correo" defaultValue={editingUser?.Email} required />
                            <input name="pass" type="password" placeholder={editingUser ? "Nueva clave (opcional)" : "Contraseña"} required={!editingUser} />
                            <select name="rol" defaultValue={editingUser?.Rol || "DOCENTE"}>
                                <option value="DOCENTE">DOCENTE</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <div className="modal-btns">
                                <button type="submit" className="btn-save-reto">{editingUser ? "Actualizar" : "Crear Usuario"}</button>
                                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="btn-exit">Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};