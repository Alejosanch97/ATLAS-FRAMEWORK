import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/dashboard.css";
import { Formularios } from "./Formularios";
import { ResponderFormularios } from "./ResponderFormularios";
import { Analisis } from "./Analisis";
import { FaseAuditar } from "./FaseAuditar"; // Importante: Asegúrate de que el archivo existe
import { MicromodulosPage } from "./MicromodulosPage";

import { FaseTransformar } from "./FaseTransformar";
import { EjecutarReto } from "./EjecutarReto";

const API_URL = 'https://script.google.com/macros/s/AKfycbxcqIbNhC3H7za-GsBF9iuTU___o8OBCF8URGNxwdQm5q8pUd1vpgthbYyrBRkGXJ5Y8Q/exec';

export const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [activeRetoId, setActiveRetoId] = useState(null);
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
    const [retosTransformar, setRetosTransformar] = useState([]);

    const navigate = useNavigate();

    // Agrega esto junto a tus otros estados (arriba del todo)
    const [isCompassInfoExpanded, setIsCompassInfoExpanded] = useState(false);
    const [infoSeccion, setInfoSeccion] = useState('evalua');
    const [showImprovement, setShowImprovement] = useState(false);

    // 1. Definimos cuál está abierto (empezamos con 'consola')
    const [openMenu, setOpenMenu] = useState('consola');

    // 2. Función que apaga todos y prende solo el que clickeamos
    const toggleMenu = (menuName) => {
        setOpenMenu(prevMenu => prevMenu === menuName ? null : menuName);
    };


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
        console.log("Iniciando carga para:", key);

        try {
            // Ejecutamos las peticiones en paralelo para que sea más rápido
            const [resForms, resRetos, resRetosTrans, resResp] = await Promise.all([
                fetch(`${API_URL}?sheet=Config_Formularios`),
                fetch(`${API_URL}?sheet=Weekly_Challenges&user_key=${key}`),
                fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS&user_key=${key}`),
                fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${key}`)
            ]);

            const dataForms = await resForms.json();
            const dataRetos = await resRetos.json();
            const dataRetosTrans = await resRetosTrans.json();
            const dataResp = await resResp.json();

            // Seteamos estados validando que sean arrays
            if (Array.isArray(dataForms)) setAllFormsInfo(dataForms);

            if (Array.isArray(dataRetos)) {
                setMisRetos(dataRetos);
            } else {
                setMisRetos([]);
            }

            // --- VALIDACIÓN CLAVE PARA RETOS TRANSFORMACIÓN ---
            console.log("Datos Transformar recibidos:", dataRetosTrans);
            if (Array.isArray(dataRetosTrans)) {
                setRetosTransformar(dataRetosTrans);
            } else {
                console.error("Retos Transformar no es un array:", dataRetosTrans);
                setRetosTransformar([]);
            }

            if (Array.isArray(dataResp)) setUserResponses(dataResp);

            if (rol === "ADMIN" || rol === "DIRECTIVO") await fetchAllUsers();

        } catch (e) {
            console.error("Error crítico en carga de datos:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Dentro de tu useEffect en el Dashboard.js
    useEffect(() => {
        const calcularHuella = () => {
            if (isLoading) return;

            // --- 1. AUDITAR (20%) - LÓGICA SIMPLIFICADA ---
            // Definimos los IDs según el rol (igual que en tu tabla e interfaz)
            const ID_DOCENTE = "FORM-1770684713222";
            const ID_DIRECTIVO = "FORM-1770695655576";
            const idBuscado = userData.Rol === "DIRECTIVO" ? ID_DIRECTIVO : ID_DOCENTE;

            // Buscamos en las respuestas del usuario si existe ese formulario
            // Sumamos los puntos igual que haces en el .reduce de la tabla
            const puntosFormulario = userResponses
                .filter(r => r.ID_Form === idBuscado)
                .reduce((sum, curr) => sum + parseFloat(curr.Puntos_Ganados || 0), 0);

            let pAuditar = 0;
            if (puntosFormulario > 0) {
                // Buscamos el máximo configurado para ese formulario específico
                const config = allFormsInfo.find(f => f.ID_Form === idBuscado);
                const maximo = parseFloat(config?.Puntos_Maximos || 100);

                // Regla de tres: (puntos / maximo) * 20
                pAuditar = (puntosFormulario / maximo) * 20;
            }

            // --- 2. LIDERAR (8%) ---
            const semanalCount = misRetos.filter(r =>
                String(r.Status || "").toLowerCase().trim() === 'completed'
            ).length;
            const pLiderar = misRetos.length > 0 ? (semanalCount / misRetos.length) * 8 : 0;

            // --- 3. TRANSFORMACIÓN (30%) ---
            const transCount = retosTransformar.filter(r =>
                String(r.Autoevaluacion_Status || "").toUpperCase().trim() === 'COMPLETADO'
            ).length;
            const pTransformar = Math.min(transCount * 10, 30);

            // --- TOTAL FINAL ---
            const total = Math.round(pAuditar + pLiderar + pTransformar);

            console.log("=== CALCULO HUELLA SIMPLIFICADO ===");
            console.log(`Buscando ID: ${idBuscado} | Puntos hallados: ${puntosFormulario}`);
            console.log(`Auditar: ${pAuditar.toFixed(1)}% | Liderar: ${pLiderar.toFixed(1)}% | Trans: ${pTransformar}%`);

            setHuellaPuntaje(total);
        };

        calcularHuella();
    }, [userResponses, allFormsInfo, misRetos, retosTransformar, userData.Rol, isLoading]);

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

    // --- MANEJADOR DE NAVEGACIÓN MEJORADO ---
    // --- MANEJADOR DE NAVEGACIÓN UNIFICADO ---
    const switchTab = (tab, extra = "") => {
        // 1. Cambiamos la pestaña activa
        setActiveTab(tab);

        // 2. Lógica condicional según el tipo de pestaña
        if (tab === 'ejecutar_reto') {
            // Si vamos a ejecutar un reto, el 'extra' es el número del reto (1, 2, 3)
            setActiveRetoId(extra);
        } else if (tab === 'fase_auditar' || tab === 'fase_transformar') {
            // Secciones directas, no requieren 'filterPhase' obligatorio pero 
            // reseteamos el extra por seguridad
            setFilterPhase("");
        } else {
            // Para 'responder_fase', el 'extra' es la letra de la fase (A, T, L)
            setFilterPhase(extra);
        }

        // 3. Cerramos el menú móvil si está abierto
        setIsMobileMenuOpen(false);

        // 4. Refrescamos datos si volvemos al inicio
        if (tab === "overview") {
            handleManualRefresh();
        }
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

        // CORRECCIÓN CLAVE: Si estamos editando, el ID viene de editingUser 
        // porque el input disabled no envía valor en el FormData.
        const tkey = editingUser ? editingUser.Teacher_Key : fd.get("tkey");
        const passwordInput = fd.get("pass");

        const userObj = {
            Teacher_Key: tkey,
            Nombre_Completo: fd.get("nombre"),
            Rol: fd.get("rol"),
            Email: fd.get("email"),
            // Mantenemos la huella actual si existe
            Huella_IA_Total: editingUser ? editingUser.Huella_IA_Total : 0
        };

        // Actualización local inmediata (Optimistic UI)
        if (editingUser) {
            setAllUsers(prev => prev.map(u => u.Teacher_Key === tkey ? { ...u, ...userObj } : u));
        } else {
            setAllUsers(prev => [...prev, userObj]);
        }

        // Cerramos modal y limpiamos estados
        setShowUserModal(false);
        setEditingUser(null);
        setIsSyncing(true);

        try {
            // Preparamos la data para el servidor
            const dataPayload = { ...userObj };

            // Solo enviamos la contraseña si el usuario escribió una nueva
            if (passwordInput && passwordInput.trim() !== "") {
                dataPayload.Password_Hash = passwordInput;
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: editingUser ? 'update' : 'create',
                    sheet: 'Users_ATLAS',
                    idField: 'Teacher_Key',
                    idValue: tkey,
                    data: dataPayload
                })
            });

            if (!response.ok) throw new Error("Error en la respuesta del servidor");

            // Opcional: Recargar la lista completa desde el servidor para confirmar
            await fetchAllUsers();

        } catch (e) {
            console.error("Error al guardar el talento:", e);
            alert("Hubo un problema al guardar los cambios. Por favor, intenta de nuevo.");
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
            case "talentos": return { title: "Gestión de Talentos", subtitle: "L - Liderar: Administración de Usuarios" };
            case "formularios": return { title: "Arquitecto de Instrumentos", subtitle: "A - Auditar: Gestión de Formularios" };
            case "explorador": return { title: "Explorador de Evidencias", subtitle: "Centro de Respuesta" };
            case "analisis": return { title: "Análisis Estratégico", subtitle: "Data e Insights" };
            case "retos": return { title: "Mis Retos Estratégicos", subtitle: "L - Liderar: Seguimiento de Objetivos" };
            case "fase_transformar": return { title: "Fase: Transformar", subtitle: "Estrategia Pedagógica UNESCO" };
            case "ejecutar_reto": return { title: `Reto ${activeRetoId}`, subtitle: "Consignación de Evidencia Pedagógica" };
            case "fase_auditar": return { title: "Fase: Auditar", subtitle: "Gobernanza y Sentido Crítico de la IA" };
            case "responder_fase": 
                const faseTxt = filterPhase === "A" ? "AUDITAR" : filterPhase === "T" ? "TRANSFORMAR" : "LIDERAR";
                return { title: `Fase ${faseTxt}`, subtitle: `Instrumentos de la Etapa ${filterPhase}` };
            default: return { title: "Bienvenido al Marco ATLAS", subtitle: "Modelo de Madurez y Gobernanza en IA Educativa" };
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
                range: "0–39%",
                title: "Exploración inicial",
                subtitle: "Nivel actual basado en evidencia documentada en la plataforma.",
                body: `Tu COMPASS de IA muestra el nivel de evidencia que has documentado sobre el uso pedagógico de la inteligencia artificial. Actualmente estás en una etapa inicial de exploración, lo que indica que aún no has registrado suficiente evidencia sobre cómo la integras o regulas en el aula. ATLAS no mide entusiasmo ni formación, sino decisiones pedagógicas demostradas. A medida que documentes diagnósticos, planeaciones o reflexiones, tu nivel avanzará.`,
                footer: "El objetivo no es usar más IA. Es usarla con criterio, ética y coherencia pedagógica. ATLAS está aquí para acompañarte paso a paso.",
                howToImprove: [
                    "Completa tu diagnóstico inicial + declara tu postura y criterios de uso responsable de IA. (AUDITAR).",
                    "Realiza retos pedagógicos (TRANSFORMAR).",
                    "Diseña experiencia de aprendizaje con IA responsable (ASEGURAR).",
                    "Comparte evidencias pedagógicas reales (SOSTENER)."
                ],
                extraNote: "Tu compass está alineado con marcos internacionales de uso responsable de IA en educación y evalúa evidencia en las cinco fases del Marco ATLAS."
            },
            {
                range: "40–59%",
                title: "Uso emergente",
                subtitle: "Nivel basado en evidencia pedagógica documentada.",
                body: `Tu COMPASS de IA indica que has comenzado a integrar la inteligencia artificial en tu práctica de manera más consciente. 
            Ya no se trata solo de exploración: has documentado decisiones pedagógicas, planeaciones o evidencias donde la IA cumple un propósito educativo claro. Esto muestra criterio en construcción. 
            En esta etapa, el desafío no es usar más herramientas, sino profundizar en la coherencia pedagógica.`,
                footer: "Tu práctica muestra intención. Ahora el siguiente paso es consolidar consistencia.",
                howToImprove: [
                    "Fortalece la evidencia en evaluación y retroalimentación (ASEGURAR).",
                    "Documenta explícitamente tus criterios éticos y pedagógicos de uso de IA.",
                    "Asegura que tus decisiones estén alineadas con marcos de referencia institucionales.",
                    "Reflexiona sobre riesgos, sesgos y supervisión humana en tus actividades."
                ],
                extraNote: "Estás pasando de un uso ocasional a una práctica con criterio. La madurez no está en la frecuencia de uso, sino en la claridad de tus decisiones."
            },
            {
                range: "60–74%",
                title: "Práctica consciente",
                subtitle: "Nivel basado en evidencia pedagógica validada en el Marco ATLAS.",
                body: `Tu COMPASS de IA muestra que has desarrollado una práctica intencional y documentada en el uso pedagógico de la inteligencia artificial. 
            La IA en tu aula ya no es intuitiva ni ocasional. Has demostrado planeaciones con propósito, criterios explícitos y evidencias de evaluación mediadas con supervisión docente. 
            En esta etapa, la clave es coherencia y profundidad.`,
                footer: "Tu práctica es consistente. El siguiente paso es integrarla de manera transversal y sostenible.",
                howToImprove: [
                    "Asegura evidencia en las cinco fases ATLAS (incluyendo LIDERAR y SOSTENER).",
                    "Documenta cómo tus decisiones se alínean con marcos y lineamientos institucionales.",
                    "Incorpora análisis de riesgos o sesgos cuando la IA interviene en evaluación.",
                    "Demuestra impacto observable en el aprendizaje."
                ],
                extraNote: "Has pasado de experimentar con IA a gobernarla en tu práctica. Ahora el reto es consolidar coherencia sistémica y liderazgo pedagógico."
            },
            {
                range: "75–89%",
                title: "Práctica alineada",
                subtitle: "Nivel avanzado de coherencia pedagógica en el uso de IA.",
                body: `Tu COMPASS de IA indica que has alcanzado un nivel de práctica alineada y consistente. 
            La integración de la inteligencia artificial en tu aula demuestra coherencia entre objetivos, actividades y evaluación bajo supervisión humana explícita. 
            En esta etapa, tu práctica no solo es consciente, sino estructurada. La IA actúa como herramienta mediada por criterio profesional.`,
                footer: "El siguiente paso es integrar de manera transversal las cinco fases ATLAS y consolidar evidencia sólida.",
                howToImprove: [
                    "Evidencia validada en las cinco fases ATLAS.",
                    "Documentación consistente de impacto en aprendizaje.",
                    "Integración de criterios éticos y de privacidad en tus decisiones.",
                    "Claridad institucional o de liderazgo frente al uso de IA."
                ],
                extraNote: "Tu práctica muestra madurez profesional frente a la IA. El reto ahora no es hacer más, sino demostrar consistencia y profundidad."
            },
            {
                range: "90–100%",
                title: "Capacidad ATLAS demostrada",
                subtitle: "Elegible para proceso de certificación ATLAS.",
                body: `Tu COMPASS de IA indica que has alcanzado un nivel de integración pedagógica avanzada y coherente. 
            Has demostrado evidencia sólida en las cinco fases: AUDITAR, TRANSFORMAR, LEDERAR, ASEGURAR y SOSTENER. 
            La inteligencia artificial en tu práctica está mediada por criterio profesional, alineada con estándares de calidad y documentada.`,
                footer: "Eres elegible para solicitar la Auditoría ATLAS en aula, un proceso de validación de coherencia e impacto.",
                howToImprove: [
                    "Evidencia transversal en las cinco fases.",
                    "Coherencia entre práctica declarada y práctica observada.",
                    "Supervisión humana efectiva.",
                    "Impacto pedagógico verificable."
                ],
                extraNote: "La certificación ATLAS reconoce competencia profesional demostrada, no trayectoria recorrida."
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
                {/* SECCIÓN DE LOGO */}
                <div className="sidebar-brand"
                    onClick={() => switchTab("overview")}
                    style={{ cursor: 'pointer' }}
                >
                    <img src="./logo5.png" alt="Logo ATLAS" className="sidebar-logo-main" />
                </div>

                {/* SECCIÓN DE USUARIO */}
                <div className="sidebar-user-top">
                    <div className="user-avatar-initial">{userData.Nombre_Completo?.charAt(0)}</div>
                    <div className="user-text">
                        <h3 className="user-name">{userData.Nombre_Completo}</h3>
                        <p className="user-role-badge">{userData.Rol}</p>
                    </div>
                </div>

                <div className="sidebar-divider"></div>

                <nav className="sidebar-nav">

                    {/* --- GRUPO: CONSOLA ESTRATÉGICA --- */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === 'consola' ? 'active-group' : ''}`}
                            onClick={() => toggleMenu('consola')}
                        >
                            <span>CONSOLA ESTRATÉGICA</span>
                            <span className="menu-arrow">{openMenu === 'consola' ? "▾" : "▸"}</span>
                        </div>

                        {openMenu === 'consola' && (
                            <div className="nav-submenu">
                                <button
                                    className={activeTab === "overview" ? "active" : ""}
                                    onClick={() => switchTab("overview")}
                                >
                                    Compass de IA
                                </button>

                                {/* VISTA COMPARTIDA: ADMIN y DIRECTIVO ven Análisis */}
                                {(userData.Rol === "ADMIN" || userData.Rol === "DIRECTIVO") && (
                                    <button className={activeTab === "analisis" ? "active" : ""} onClick={() => switchTab("analisis")}>
                                        Análisis de Formularios
                                    </button>
                                )}

                                {/* VISTAS EXCLUSIVAS DE ADMIN */}
                                {userData.Rol === "ADMIN" && (
                                    <>
                                        <button className={activeTab === "talentos" ? "active" : ""} onClick={() => switchTab("talentos")}> Gestión de Talentos</button>
                                        <button className={activeTab === "formularios" ? "active" : ""} onClick={() => switchTab("formularios")}>Arquitecto de Instrumentos</button>
                                        <button className={activeTab === "explorador" ? "active" : ""} onClick={() => switchTab("explorador")}> Explorador de Evidencias</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nav-section">MARCO ATLAS</div>

                    {/* --- SECCIÓN A - AUDITAR --- */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === 'auditar' ? 'active-group' : ''}`}
                            onClick={() => toggleMenu('auditar')}
                        >
                            <div><span className="marco-letter">A</span> AUDITAR</div>
                            <span className="menu-arrow">{openMenu === 'auditar' ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === 'auditar' && (
                            <div className="nav-submenu">
                                {/* DOCENTE y DIRECTIVO ven Diagnóstico */}
                                {(userData.Rol === "DOCENTE" || userData.Rol === "DIRECTIVO") && (
                                    <button
                                        className={activeTab === "fase_auditar" ? "active-phase" : "phase-btn"}
                                        onClick={() => switchTab("fase_auditar")}
                                    >
                                        Diagnóstico
                                    </button>
                                )}
                                {userData.Rol === "ADMIN" && (
                                    <button
                                        className={activeTab === "micromodulos_fase" ? "active" : "phase-btn"}
                                        onClick={() => switchTab("micromodulos_fase", "A")}
                                    >
                                        Gestión de Módulos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- SECCIÓN T - TRANSFORMAR --- */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === 'transformar' ? 'active-group' : ''}`}
                            onClick={() => toggleMenu('transformar')}
                        >
                            <div><span className="marco-letter">T</span> TRANSFORMAR</div>
                            <span className="menu-arrow">{openMenu === 'transformar' ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === 'transformar' && (
                            <div className="nav-submenu">
                                {/* NUEVO BOTÓN: Misiones de Transformación (Aparece de primero) */}
                                <button
                                    className={(activeTab === "fase_transformar" || activeTab === "ejecutar_reto") ? "active-phase" : "phase-btn"}
                                    onClick={() => switchTab("fase_transformar")}
                                >
                                    Misiones de Transformación
                                </button>

                                {/* TUS BOTONES EXISTENTES (SE MANTIENEN IGUAL) */}
                                <button
                                    className={activeTab === "retos" ? "active" : "phase-btn"}
                                    onClick={() => switchTab("retos")}
                                >
                                    Mis Retos Estratégicos
                                </button>

                            </div>
                        )}
                    </div>

                    {/* --- SECCIÓN L - LIDERAR --- */}
                    <div className="atlas-nav-group">
                        <div
                            className={`atlas-group-header clickable ${openMenu === 'liderar' ? 'active-group' : ''}`}
                            onClick={() => toggleMenu('liderar')}
                        >
                            <div><span className="marco-letter">L</span> LIDERAR</div>
                            <span className="menu-arrow">{openMenu === 'liderar' ? "▾" : "▸"}</span>
                        </div>
                        {openMenu === 'liderar' && (
                            <div className="nav-submenu">
                                {/* DOCENTE y DIRECTIVO ven Panel de Influencia */}
                                {(userData.Rol === "DOCENTE" || userData.Rol === "DIRECTIVO") && (
                                    <button
                                        className={activeTab === "responder_fase" && filterPhase === "L" ? "active-phase" : "phase-btn"}
                                        onClick={() => switchTab("responder_fase", "L")}
                                    >
                                        Panel de Influencia
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECCIONES PENDIENTES */}
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header" style={{ opacity: 0.5 }}>
                            <span className="marco-letter">A</span> ASEGURAR
                        </div>
                    </div>
                    <div className="atlas-nav-group">
                        <div className="atlas-group-header" style={{ opacity: 0.5 }}>
                            <span className="marco-letter">S</span> SOSTENER
                        </div>
                    </div>

                </nav>

                {/* BOTÓN DE CIERRE DE SESIÓN */}
                <div className="sidebar-bottom">
                    <button className="btn-logout-minimal" onClick={handleLogoutAction}>
                        <span>Cerrar Sesión</span> <i className="icon-exit">🚪</i>
                    </button>
                </div>
            </aside>

            <main className="atlas-main-content">
                <header className="main-header">
                    {/* Grupo de la izquierda: Título y Subtítulo */}
                    <div className="header-title-group">
                        <h1>{headerContent.title}</h1>
                        <p className="header-subtitle">{headerContent.subtitle}</p>
                    </div>

                    {/* El botón ahora es un elemento independiente a la derecha */}
                    <button className="btn-refresh-data" onClick={handleManualRefresh}>
                        🔄 <span>Sincronizar</span>
                    </button>
                </header>

                {activeTab === "overview" && (
                    <section className="dashboard-grid">
                        {/* NUEVA CARD: ¿QUÉ ES EL COMPASS DE IA? */}
                        <div className={`info-card wide-card compass-explainer-card ${!isCompassInfoExpanded ? 'collapsed' : ''}`}>
                            <div
                                className="compass-header-unique"
                                onClick={() => setIsCompassInfoExpanded(!isCompassInfoExpanded)}
                            >
                                <div className="compass-title-group-unique">
                                    <div className="compass-text-stack-unique">
                                        <h2 className="compass-h2-unique">¿Qué es el COMPASS de IA?</h2>
                                        {!isCompassInfoExpanded && <p className="compass-tap-unique">Instrumento de madurez pedagógica ATLAS</p>}
                                    </div>
                                </div>
                                <div className={`compass-toggle-unique ${isCompassInfoExpanded ? 'active' : ''}`}>
                                    {isCompassInfoExpanded ? "▲" : "▼"}
                                </div>
                            </div>

                            {isCompassInfoExpanded && (
                                <div className="compass-body-interactive">
                                    <div className="compass-full-intro">
                                        <p>
                                            El <strong>COMPASS de IA</strong> es el instrumento de madurez pedagógica del Marco ATLAS.
                                            No mide cuánto usas la inteligencia artificial; mide cómo la <strong>integras, la regulas y la documentas</strong> en tu práctica educativa.
                                        </p>
                                        <p>
                                            Funciona como una brújula profesional: te orienta sobre el nivel de coherencia, evidencia y criterio con el que estás tomando decisiones frente a la IA en el aula.
                                            Cada avance se basa en <strong>evidencia demostrada</strong>, no en tiempo invertido ni en cantidad de herramientas utilizadas.
                                        </p>
                                    </div>

                                    {/* BOTONES DE SECCIÓN */}
                                    <div className="compass-nav-pills">
                                        <button
                                            type="button"
                                            className={infoSeccion === 'evalua' ? 'active' : ''}
                                            onClick={(e) => { e.stopPropagation(); setInfoSeccion('evalua'); }}
                                        >
                                            ¿Qué evalúa?
                                        </button>
                                        <button
                                            type="button"
                                            className={infoSeccion === 'no-es' ? 'active' : ''}
                                            onClick={(e) => { e.stopPropagation(); setInfoSeccion('no-es'); }}
                                        >
                                            ¿Qué NO es?
                                        </button>
                                        <button
                                            type="button"
                                            className={infoSeccion === 'sirve' ? 'active' : ''}
                                            onClick={(e) => { e.stopPropagation(); setInfoSeccion('sirve'); }}
                                        >
                                            ¿Para qué sirve?
                                        </button>
                                    </div>

                                    {/* CONTENIDO DINÁMICO COMPLETO */}
                                    <div className="compass-dynamic-content fade-in">
                                        {infoSeccion === 'evalua' && (
                                            <div className="section-content">
                                                <p className="section-intro-text">El COMPASS analiza tu práctica en cinco dimensiones del Marco ATLAS:</p>
                                                <ul className="compass-list-clean">
                                                    <li><strong>• AUDITAR</strong> – Diagnóstico y conciencia crítica.</li>
                                                    <li><strong>• TRANSFORMAR</strong> – Rediseño pedagógico intencional.</li>
                                                    <li><strong>• LIDERAR</strong> – Gobernanza y toma de decisiones explícitas.</li>
                                                    <li><strong>• ASEGURAR</strong> – Evaluación y evidencia de impacto.</li>
                                                    <li><strong>• SOSTENER</strong> – Sostenibilidad, ética y mejora continua.</li>
                                                </ul>
                                                <div className="highlight-note-box">
                                                    Tu porcentaje refleja el nivel de evidencia documentada en estas dimensiones.
                                                </div>
                                            </div>
                                        )}

                                        {infoSeccion === 'no-es' && (
                                            <div className="section-content">
                                                <ul className="compass-list-clean">
                                                    <li>• No es una calificación.</li>
                                                    <li>• No es una evaluación de desempeño laboral.</li>
                                                    <li>• No mide entusiasmo tecnológico.</li>
                                                    <li>• No premia el uso frecuente de herramientas.</li>
                                                </ul>
                                                <div className="highlight-note-box gold">
                                                    El COMPASS reconoce madurez profesional frente a la IA.
                                                </div>
                                            </div>
                                        )}

                                        {infoSeccion === 'sirve' && (
                                            <div className="section-content">
                                                <p className="section-intro-text">El COMPASS te permite:</p>
                                                <ul className="compass-list-clean">
                                                    <li>• Identificar tu punto de partida.</li>
                                                    <li>• Fortalecer tu práctica con criterios claros.</li>
                                                    <li>• Documentar decisiones pedagógicas con respaldo.</li>
                                                    <li>• Prepararte para procesos de validación o auditoría ATLAS.</li>
                                                </ul>
                                                <div className="accompaniment-badge">
                                                    Es una herramienta de acompañamiento, no de control.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
                                <div className="title-group-main">
                                    <h3> COMPASS: {getCompassData().title} ({getCompassData().range})</h3>
                                    <p className="subtitle-compass-mini">{getCompassData().subtitle}</p>
                                </div>
                            </div>

                            <div className="prompt-content-rich">
                                <div className="main-compass-text-body">
                                    <p className="intro-text-dark">{getCompassData().body}</p>
                                    <p className="footer-text-highlight">{getCompassData().footer}</p>
                                </div>

                                {/* BOTÓN DINÁMICO "¿CÓMO SUBIR MI COMPASS?" */}
                                <div className="improvement-action-container">
                                    <button
                                        className={`btn-how-to-improve ${showImprovement ? 'active' : ''}`}
                                        onClick={() => setShowImprovement(!showImprovement)}
                                    >
                                        {compassTab === 4 ? "💎 ¿Qué te acerca a la certificación?" : " ¿Cómo subir mi COMPASS?"}
                                        <span>{showImprovement ? "▲" : "▼"}</span>
                                    </button>

                                    {showImprovement && (
                                        <div className="improvement-dropdown fade-in">
                                            <h4>{compassTab === 4 ? "Requisitos para Certificación:" : "¿Cómo aumentar tu nivel?"}</h4>
                                            <ul className="improvement-list">
                                                {getCompassData().howToImprove.map((step, i) => (
                                                    <li key={i}><span>→</span> {step}</li>
                                                ))}
                                            </ul>
                                            <div className="improvement-note">
                                                {getCompassData().extraNote}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="method-grid">
                                    {["0-39%", "40-59%", "60-74%", "75-89%", "90-100%"].map((label, idx) => (
                                        <div
                                            key={idx}
                                            className={`method-item ${compassTab === idx ? 'active' : ''}`}
                                            onClick={() => {
                                                setCompassTab(idx);
                                                setShowImprovement(false); // Reinicia el desplegable al cambiar de nivel
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <strong>{label.split('-')[0]}</strong><span>{label.split('-')[1]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="info-card wide-card">
                            <h3>MI PROGRESO ATLAS</h3>
                            <div className="user-scroll-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                <table className="atlas-table">
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
                                        <tr><th>Instrumento</th><th>Fecha</th><th>Nivel de madurez</th></tr>
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
                                                    <td>
                                                        <span className="user-key-tag" style={{ background: '#c5a059', color: 'white' }}>
                                                            {/* USAMOS Math.round PARA EVITAR DECIMALES LARGOS */}
                                                            {Math.round(item.puntos)} pts
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No hay registros.</td></tr>;
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
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Buscar docente..."
                                        className="search-input-small"
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                    />
                                    <button className="btn-add-reto" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                                        ➕ Nuevo Talento
                                    </button>
                                </div>
                            </div>
                            <div className="user-scroll-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <table className="atlas-table">
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Nombre</th>
                                            <th>Rol</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
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

                        {/* MODAL DE USUARIO - CORREGIDO E INTEGRADO */}
                        {showUserModal && (
                            <div className="modal-overlay-atlas">
                                <div className="modal-content-glass" style={{ maxWidth: '500px' }}>
                                    <div className="modal-atlas-header">
                                        <div className="header-info">
                                            <h2>{editingUser ? "Editar Talento" : "Nuevo Talento"}</h2>
                                            <p className="modal-subtitle">Gestión de Acceso ATLAS</p>
                                        </div>
                                        <button className="close-btn-circle" onClick={() => setShowUserModal(false)}>✕</button>
                                    </div>

                                    <form onSubmit={handleCreateUser} className="modal-atlas-body">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>TEACHER KEY (ID)</label>
                                                <input
                                                    type="text" name="tkey" className="atlas-textarea" style={{ minHeight: '45px' }}
                                                    defaultValue={editingUser?.Teacher_Key} required disabled={!!editingUser}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>NOMBRE COMPLETO</label>
                                                <input
                                                    type="text" name="nombre" className="atlas-textarea" style={{ minHeight: '45px' }}
                                                    defaultValue={editingUser?.Nombre_Completo} required
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>CORREO ELECTRÓNICO</label>
                                                <input
                                                    type="email" name="email" className="atlas-textarea" style={{ minHeight: '45px' }}
                                                    defaultValue={editingUser?.Email} required
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>ROL DE USUARIO</label>
                                                <select name="rol" className="atlas-textarea" style={{ minHeight: '45px' }} defaultValue={editingUser?.Rol || "DOCENTE"}>
                                                    <option value="DOCENTE">DOCENTE</option>
                                                    <option value="DIRECTIVO">DIRECTIVO</option>
                                                    <option value="ADMIN">ADMINISTRADOR</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>CONTRASEÑA {editingUser && "(Dejar vacío para no cambiar)"}</label>
                                                <input
                                                    type="password" name="pass" className="atlas-textarea" style={{ minHeight: '45px' }}
                                                    required={!editingUser}
                                                />
                                            </div>

                                            <button type="submit" className="btn-submit-atlas" style={{ marginTop: '10px' }}>
                                                {editingUser ? "Actualizar Talento" : "Crear Nuevo Talento"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === "formularios" && <Formularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "explorador" && <ResponderFormularios userData={userData} isSyncing={isSyncing} setIsSyncing={setIsSyncing} API_URL={API_URL} />}
                {activeTab === "analisis" && <Analisis userData={userData} API_URL={API_URL} />}
                
                {/* RENDERIZADO DE LA NUEVA FASE AUDITAR */}
                {activeTab === "fase_auditar" && (
                    <FaseAuditar
                        userData={userData}
                        API_URL={API_URL}
                        onNavigate={switchTab} // Pasamos la función que ya creaste
                    />
                )}
                {/* [AÑADE ESTO AQUÍ] RENDERIZADO DE MICROMÓDULOS */}
                {activeTab === "micromodulos_fase" && (
                    <MicromodulosPage
                        userData={userData}
                        API_URL={API_URL}
                        onNavigate={() => switchTab("fase_auditar")} // Al volver, regresa a la Fase Auditar
                    />
                )}

                {activeTab === "responder_fase" && (
                    <ResponderFormularios
                        userData={userData}
                        isSyncing={isSyncing}
                        setIsSyncing={setIsSyncing}
                        API_URL={API_URL}
                        filterPhase={filterPhase}
                        onNavigate={switchTab}  /* <--- AGREGA ESTA LÍNEA */
                    />
                )}

                {/* Agrega esto después de tus otros tabs en el <main> */}
                {/* --- SECCIÓN TRANSFORMAR --- */}
                {activeTab === "fase_transformar" && (
                    <FaseTransformar
                        userData={userData}
                        API_URL={API_URL}
                        onNavigate={(tab, extra) => {
                            if (tab === "overview") handleManualRefresh(); // Actualiza puntos al volver
                            switchTab(tab, extra);
                        }}
                    />
                )}

                {/* --- SECCIÓN EJECUTAR RETO --- */}
                {activeTab === "ejecutar_reto" && (
                    <EjecutarReto
                        userData={userData}
                        API_URL={API_URL}
                        retoId={activeRetoId}
                        onNavigate={(tab, extra) => {
                            if (tab === "fase_transformar" || tab === "overview") handleManualRefresh();
                            switchTab(tab, extra);
                        }}
                    />
                )}

                {activeTab === "retos" && (
                    <section className="dashboard-grid">
                        <div className="info-card wide-card">
                            {/* CABECERA CON BOTÓN INTEGRADO */}
                            <div className="card-header-flex">
                                <h3>Listado Completo de Retos</h3>
                                <button
                                    className="btn-add-reto"
                                    onClick={() => {
                                        setShowRetoForm(!showRetoForm);
                                        setEditingReto(null);
                                    }}
                                >
                                    {showRetoForm ? "✖ Cancelar" : "➕ Nuevo Reto"}
                                </button>
                            </div>

                            {/* FORMULARIO DESPLEGABLE (Misma lógica que la sección anterior) */}
                            {showRetoForm && (
                                <form className="form-nuevo-reto" onSubmit={handleSubmitReto}>
                                    <input
                                        type="text"
                                        placeholder="Descripción del reto..."
                                        name="Challenge_Description"
                                        defaultValue={editingReto?.Challenge_Description}
                                        required
                                    />
                                    <div className="form-row">
                                        <input
                                            type="date"
                                            name="Start_Date"
                                            defaultValue={editingReto ? editingReto.Start_Date?.split('T')[0] : new Date().toISOString().split('T')[0]}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Días"
                                            name="Days_Active"
                                            defaultValue={editingReto?.Days_Active}
                                            required
                                        />
                                        <button type="submit" className="btn-save-reto">
                                            {editingReto ? "Actualizar" : "Guardar"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* LISTADO DE RETOS */}
                            <div className="challenges-grid-modern">
                                {misRetos.map(reto => (
                                    <div key={reto.ID_Challenge} className={`challenge-card-item ${reto.Status === 'completed' ? 'done' : ''}`}>
                                        <div className="challenge-main-info" onClick={() => handleToggleRetoStatus(reto)} style={{ cursor: 'pointer' }}>
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
        </div>
    );
};