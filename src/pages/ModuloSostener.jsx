import React, { useState, useEffect } from "react";
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css"; 

const ModuloSostener = ({ userData, API_URL, onNavigate, dataSostener }) => {
    const [view, setView] = useState("menu"); 
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(dataSostener || []);
    
    // Estados para la integración de Retos y Prompts
    const [retos, setRetos] = useState([]);
    const [promptData, setPromptData] = useState(null);
    const [viewModeModal, setViewModeModal] = useState('stats'); // 'stats' o 'survey'
    const [showModal, setShowModal] = useState(false);

    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [viewModeReal, setViewModeReal] = useState('stats'); // 'stats' o 'survey'

    const [showModalReal, setShowModalReal] = useState(false);

    
    const [balanceGlobal, setBalanceGlobal] = useState({
        antes: { nivel: "Cargando...", dimensionBaja: "...", puntaje: 0 },
        ahora: { nivel: "...", dimensionAlta: "...", puntaje: 0 },
        evidencias: { retos: 0, notasLiderar: null },
        crecimiento: 0
    });

    const dimensiones = [
        { id: "D1", nombre: "Uso Pedagógico Estratégico", preguntas: [
            { id: 1, text: "Utilizo IA con un propósito pedagógico claramente definido." },
            { id: 2, text: "La IA apoya objetivos de aprendizaje explícitos, no solo tareas administrativas." },
            { id: 3, text: "Reviso críticamente los resultados generados por la IA antes de usarlos." },
            { id: 4, text: "Ajusto el uso de IA según el perfil y necesidades de mis estudiantes." },
            { id: 5, text: "Integro la IA como complemento, no como reemplazo de mi criterio profesional." },
            { id: 6, text: "Evalúo si el uso de IA realmente mejora la experiencia de aprendizaje." }
        ]},
        { id: "D2", nombre: "Ética y Protección de Datos", preguntas: [
            { id: 7, text: "Verifico que las herramientas de IA respeten principios de privacidad." },
            { id: 8, text: "Evito compartir datos sensibles de estudiantes en plataformas externas." },
            { id: 9, text: "Informo a mis estudiantes cuando utilizo IA en procesos pedagógicos." },
            { id: 10, text: "Identifico posibles sesgos en los resultados generados por IA." },
            { id: 11, text: "Intervengo cuando detecto contenido potencialmente inadecuado." },
            { id: 12, text: "Conozco las políticas institucionales sobre uso de IA." }
        ]},
        { id: "D3", nombre: "Impacto en el Aprendizaje", preguntas: [
            { id: 13, text: "La IA me permite ofrecer retroalimentación más personalizada." },
            { id: 14, text: "He observado mejoras en autonomía estudiantil gracias al uso de IA." },
            { id: 15, text: "Uso IA para diferenciar actividades según niveles." },
            { id: 16, text: "La IA reduce carga operativa sin afectar calidad pedagógica." },
            { id: 17, text: "Evalúo periódicamente si el uso de IA está generando resultados positivos." },
            { id: 18, text: "Ajusto mi práctica cuando la IA no aporta valor real." }
        ]},
        { id: "D4", nombre: "Desarrollo Profesional", preguntas: [
            { id: 19, text: "Me actualizo sobre nuevas aplicaciones educativas de IA." },
            { id: 20, text: "Participo en conversaciones o comunidades sobre uso responsable de IA." },
            { id: 21, text: "Reflexiono sobre mi dependencia o equilibrio frente a la tecnología." },
            { id: 22, text: "Comparto buenas prácticas con otros docentes." },
            { id: 23, text: "Documento experiencias significativas de uso." },
            { id: 24, text: "Busco formación adicional cuando identifico vacíos en mi competencia." }
        ]}
    ];

    // Asegúrate de tener este estado declarado arriba de tus funciones
    const [respuestasAuditarReal, setRespuestasAuditarReal] = useState([]);

    useEffect(() => {
        const integrarFases = async () => {
            const tKey = userData?.Teacher_Key;
            if(!tKey) return;

            try {
                // Llamamos a la data filtrada por tu Teacher_Key para asegurar que vemos TUS respuestas
                const [resAuditar, resRetos, resLiderar] = await Promise.all([
                    fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${tKey}`), 
                    fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS&Teacher_Key=${tKey}`),
                    fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes&Teacher_Key=${tKey}`)
                ]);

                const dAuditar = await resAuditar.json();
                const dRetos = await resRetos.json();
                const dLiderar = await resLiderar.json();

                // --- LÓGICA DE EXTRACCIÓN DE TU AUDITAR REAL (FORM-1770684713222) ---
                // Filtramos por el ID de formulario que contiene tus textos y niveles
                const idAuditarCorrecto = "FORM-1770684713222"; 
                const misDatosReales = dAuditar.filter(r => r.ID_Form === idAuditarCorrecto);
                
                // Guardamos los datos literales (Textos, Niveles, etc.)
                setRespuestasAuditarReal(misDatosReales);

                // Calculamos métricas para el mini-panel de adopción si hay datos
                if (misDatosReales.length > 0) {
                    const puntajes = misDatosReales
                        .map(r => Number(r.Puntos_Ganados || 0))
                        .filter(p => p > 0); // Solo los que sumen puntos

                    const promedio = puntajes.length > 0 
                        ? (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(2)
                        : "0.00";

                    setSelectedFormReal({
                        promedio: (promedio * 20).toFixed(1), // Ajuste a escala 100%
                        analisis: { 
                            nivel: "Datos de Auditoría Cargados", 
                            color: "#1a237e" 
                        }
                    });
                }
                // --- FIN PROCESAMIENTO AUDITAR ---

                if (Array.isArray(dRetos)) setRetos(dRetos);
                
                if (Array.isArray(dLiderar)) {
                    setPromptData(dLiderar.find(p => p.Status === 'completed') || dLiderar[0]);
                }

                // Lógica de Balance (Antes vs Después)
                const scoreIni = misDatosReales.length > 0 
                    ? (misDatosReales.reduce((acc, r) => acc + Number(r.Puntos_Ganados || 0), 0) / misDatosReales.length)
                    : 0;

                const ultimoSostener = historial[0];
                const scoreActual = ultimoSostener ? Number(ultimoSostener.Promedio_Global) * 20 : scoreIni;

                setBalanceGlobal({
                    antes: { nivel: scoreIni > 4 ? "Estratégico" : "Exploratorio", puntaje: (scoreIni * 20).toFixed(1) },
                    ahora: { nivel: ultimoSostener?.Nivel_Calculado || "En Proceso", puntaje: scoreActual.toFixed(1) },
                    evidencias: { 
                        retos: Array.isArray(dRetos) ? dRetos.filter(r => r.Status_Reto === 'COMPLETADO').length : 0, 
                        notasLiderar: dLiderar[0] || null 
                    },
                    crecimiento: (scoreActual - (scoreIni * 20)).toFixed(1)
                });

            } catch (e) { 
                console.error("Error integrando balance:", e); 
            }
        };
        integrarFases();
    }, [API_URL, userData, historial]);

    // --- LÓGICA HEURÍSTICA PROMPTING INDIVIDUAL ---
    const analizarPromptIndiv = (p) => {
        if (!p) return null;
        const etica = parseFloat(p.Puntaje_Etica || 0);
        const priv = parseFloat(p.Puntaje_Privacidad || 0);
        const agen = parseFloat(p.Puntaje_Agencia || 0);
        const cogn = parseFloat(p.Puntaje_Dependencia || 0);
        const promedio = (etica + priv + agen + cogn) / 4;
        let diagnostico = promedio >= 4 ? "Excelente equilibrio ético." : "Se sugiere mayor supervisión humana.";
        let color = promedio >= 4 ? "#22c55e" : "#f59e0b";
        return { etica, priv, agen, cogn, promedio, diagnostico, color };
    };
    const statsPrompt = analizarPromptIndiv(promptData);

    const calcularResultados = () => {
        const valores = Object.values(respuestas);
        if (valores.length < 24) return null;
        const sumaTotal = valores.reduce((a, b) => a + b, 0);
        const promedioGlobal = sumaTotal / 24;
        const promediosD = dimensiones.map(d => {
            const sumaD = d.preguntas.reduce((acc, p) => acc + (respuestas[p.id] || 0), 0);
            return { id: d.id, nombre: d.nombre, promedio: (sumaD / 6).toFixed(2) };
        });

        let nivel = "";
        if (promedioGlobal >= 4.3) nivel = "Nivel 4: Referente Institucional";
        else if (promedioGlobal >= 3.5) nivel = "Nivel 3: Docente Estratégico";
        else if (promedioGlobal >= 2.5) nivel = "Nivel 2: Integrador Inicial";
        else nivel = "Nivel 1: Uso Instrumental";

        const alertas = [];
        if (respuestas[3] <= 2 && respuestas[5] <= 2) alertas.push("Automatización sin supervisión");
        if (respuestas[7] <= 2 || respuestas[8] <= 2) alertas.push("Riesgo de protección de datos");
        if (parseFloat(promediosD[2].promedio) < 2.5) alertas.push("Bajo impacto pedagógico");

        return { promedioGlobal, promediosD, nivel, alertas };
    };

    const handleSave = async () => {
        const res = calcularResultados();
        if (!res) return Swal.fire("Incompleto", "Responde todas las preguntas.", "warning");
        setLoading(true);
        const tKey = userData?.Teacher_Key || "KEY-NOT-FOUND";
        const instKey = userData?.Institucion_Key || "INST-GENERAL";
        const idUnico = `SOS-${tKey}-${Date.now()}`;
        const respuestasMapeadas = {};
        for (let i = 1; i <= 24; i++) {
            let dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
            respuestasMapeadas[`${dimPrefix}${i}`] = respuestas[i] || 0;
        }

        const excelData = {
            ID_Sostener: idUnico, Teacher_Key: tKey, Fecha_Evaluacion: new Date().toLocaleDateString('es-ES'),
            Periodo: "2026-1", Institucion_Key: instKey, ...respuestasMapeadas,
            Promedio_Global: res.promedioGlobal.toFixed(2), Nivel_Calculado: res.nivel,
            "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4": `${res.promediosD[0].promedio}, ${res.promediosD[1].promedio}, ${res.promediosD[2].promedio}, ${res.promediosD[3].promedio}`,
            Alertas_Activas: res.alertas.join(" | ") || "Sin Alertas", Reflexion_Antes: "", Reflexion_Despues: "", Aprendizaje_Clave: "",
            Porcentaje_Crecimiento: `${balanceGlobal.crecimiento}%`, Prioridad_Sostener: "Media", Compromiso_Accion: "", Evidencia_Mejora: "", Fecha_Revision_Plan: ""
        };

        try {
            await fetch(API_URL, { method: "POST", mode: 'no-cors', headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "create", sheet: "SOSTENER_Docentes", data: excelData }) });
            setHistorial([excelData, ...historial]);
            setView("dashboard");
            Swal.fire("Éxito", "Evaluación guardada.", "success");
        } catch (e) { Swal.fire("Error", "Error de conexión.", "error"); } finally { setLoading(false); }
    };

    const toPct = (val) => ((val / 5) * 100).toFixed(1);
    const pD = historial[0]?.["Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4"]?.split(',').map(v => parseFloat(v)) || [0,0,0,0];

    return (
        <div className="sostener-page-wrapper">
            {view === "menu" && (
                <div className="sostener-menu animate-fade-in">
                    <div className="sostener-header">
                        <button className="btn-back-atlas" onClick={() => onNavigate('overview')}>⬅ Mapa ATLAS</button>
                        <h2>Misiones de Sostenibilidad</h2>
                    </div>
                    <div className="balance-global-mini-card">
                        <div className="mini-stat"><span>Crecimiento Total</span><strong>{balanceGlobal.crecimiento}%</strong></div>
                        <div className="mini-stat"><span>Retos Transformar</span><strong>{balanceGlobal.evidencias.retos} Logrados</strong></div>
                    </div>
                    <div className="sostener-grid-menu">
                        <div className={`sos-card-main ${historial.length > 0 ? 'is-done' : ''}`}>
                            <div className="sos-icon">📊</div>
                            <h3>Radar de Autoevaluación</h3>
                            <p>Análisis de dimensiones pedagógicas y éticas 2026.</p>
                            <div className="sos-actions">
                                <button onClick={() => setView("cuestionario")} className="btn-sos-primary">{historial.length > 0 ? "Nueva Evaluación" : "Iniciar"}</button>
                                {historial.length > 0 && <button onClick={() => setView("dashboard")} className="btn-sos-secondary">Ver Balance</button>}
                            </div>
                        </div>
                        <div className={`sos-card-main ${historial.length > 0 ? '' : 'is-locked'}`}>
                            <div className="sos-icon">🔄</div>
                            <h3>Cierre de Ciclo</h3>
                            <p>Compara tu evolución Antes vs Después.</p>
                            <button disabled={historial.length === 0} className="btn-sos-primary">Acceder</button>
                        </div>
                    </div>
                </div>
            )}

            {view === "cuestionario" && (
                <div className="sostener-cuestionario animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Volver</button>
                    <div className="sos-form-container">
                        <h2>Autoevaluación Docente IA</h2>
                        {dimensiones.map(dim => (
                            <div key={dim.id} className="sos-dim-group">
                                <h3>{dim.nombre}</h3>
                                {dim.preguntas.map(p => (
                                    <div key={p.id} className="sos-q-item">
                                        <span>{p.text}</span>
                                        <div className="sos-likert">
                                            {[1,2,3,4,5].map(v => (
                                                <button key={v} className={respuestas[p.id] === v ? 'active' : ''} onClick={() => setRespuestas({...respuestas, [p.id]: v})}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <button className="btn-sos-submit" onClick={handleSave} disabled={loading}>{loading ? "Sincronizando..." : "Finalizar Evaluación"}</button>
                    </div>
                </div>
            )}

            {view === "dashboard" && historial.length > 0 && (
                <div className="sostener-dashboard animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Menú Principal</button>
                    <div className="sos-dash-layout">
                        {/* PANEL 1: AUDITORÍA INDIVIDUAL */}
                        <div className="sos-dash-top">
                            <div className="sos-stat-card gold">
                                <span className="dash-lider-2026-panel-id">Panel 1</span>
                                <h4>Nivel Alcanzado</h4>
                                <div className="sos-big-val">{toPct(historial[0].Promedio_Global)}%</div>
                                <div className="sos-level-badge">{historial[0].Nivel_Calculado}</div>
                                <div className="sos-dims-grid">
                                    <div className="dim-item"><span>Uso:</span> <strong>{toPct(pD[0])}%</strong></div>
                                    <div className="dim-item"><span>Ética:</span> <strong>{toPct(pD[1])}%</strong></div>
                                    <div className="dim-item"><span>Imp:</span> <strong>{toPct(pD[2])}%</strong></div>
                                    <div className="dim-item"><span>Des:</span> <strong>{toPct(pD[3])}%</strong></div>
                                </div>
                                <button className="atl-an-btn-main" style={{marginTop: '10px'}} onClick={() => setShowModal(true)}>Diagnóstico Detallado</button>
                            </div>
                            <div className="sos-stat-card radar-cont">
                                <h4>Radar de Sostenibilidad</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={[{ s: 'Uso', A: pD[0] },{ s: 'Ética', A: pD[1] },{ s: 'Imp', A: pD[2] },{ s: 'Des', A: pD[3] }]}>
                                        <PolarGrid /><PolarAngleAxis dataKey="s" /><Radar dataKey="A" stroke="#c5a059" fill="#c5a059" fillOpacity={0.5} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* PANEL 1.2: EVIDENCIA INSTITUCIONAL REAL (CARD BOTÓN) */}
                        <div className="sos-stat-card real-evidence" style={{ background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => setShowModalReal(true)}>
                            <span className="dash-lider-2026-panel-id">Fase: AUDITAR</span>
                            <h4 style={{ color: '#1e293b', marginTop: '10px' }}>Diagnóstico Pedagógico Institucional</h4>

                            <div className="atl-an-metrics-grid" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <div className="atl-an-mini-box" style={{ flex: 1, textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 'bold', color: '#1a202c' }}>
                                        {respuestasAuditarReal.length}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase' }}>Muestras (N)</span>
                                </div>
                                <div className="atl-an-mini-box" style={{ flex: 1, textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 'bold', color: '#1a202c' }}>
                                        {selectedFormReal?.promedio || 0}%
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase' }}>Media (M)</span>
                                </div>
                            </div>

                            <button className="atl-an-btn-main" style={{ width: '100%', marginTop: '20px', background: '#4c51bf' }}>
                                Ver Diagnóstico Grupal
                            </button>
                        </div>

                        {/* MODAL ESPECÍFICO PARA AUDITORÍA REAL */}
                        {showModalReal && (
                            <div className="atl-an-overlay" style={{ zIndex: 9999 }}>
                                <div className="atl-an-modal wide animate-fade-in">
                                    <div className="atl-an-modal-head">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>Reporte ATLAS: Diagnóstico Pedagógico</h3>
                                            <button className="atl-an-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="modal-tabs">
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Interpretación Grupal</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Evidencias por Pregunta</button>
                                        </div>
                                    </div>

                                    <div className="atl-an-modal-body">
                                        {viewModeReal === 'stats' ? (
                                            <div className="stats-view">
                                                <div className="atl-an-metrics-grid">
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val blue">{selectedFormReal?.promedio}%</span>
                                                        <span className="atl-an-lbl">MEDIA (M)</span>
                                                    </div>
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val green">{selectedFormReal?.modaValue || selectedFormReal?.promedio}%</span>
                                                        <span className="atl-an-lbl">MODA (MO)</span>
                                                    </div>
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val gold">{selectedFormReal?.desviacion || '1.88'}</span>
                                                        <span className="atl-an-lbl">DESV. (Σ)</span>
                                                    </div>
                                                </div>

                                                <div className="atl-an-progress-section" style={{ margin: '25px 0' }}>
                                                    <div className="atl-an-bar-label-row">
                                                        <span className="atl-an-lbl">POSICIONAMIENTO EN CURVA</span>
                                                        <span className="atl-an-lbl">{selectedFormReal?.promedio}%</span>
                                                    </div>
                                                    <div className="atl-an-bar-bg">
                                                        <div className="atl-an-bar-fill" style={{ width: `${selectedFormReal?.promedio}%` }}></div>
                                                    </div>
                                                </div>

                                                <div className="atl-an-insight-card" style={{ borderLeft: '5px solid #d69e2e' }}>
                                                    <p className="atl-an-nivel" style={{ color: '#d69e2e', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>
                                                        Capacidad ATLAS demostrada
                                                    </p>
                                                    <p className="atl-an-desc">
                                                        Tu nivel de práctica se ubica mayoritariamente alineada y consciente. Este resultado evidencia un uso intencional de la IA, acompañado de reflexión pedagógica y criterios éticos claros.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="survey-view" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                {respuestasAuditarReal.map((q, idx) => (
                                                    <div key={idx} className="pregunta-detalle-card" style={{ padding: '15px', borderBottom: '1px solid #edf2f7' }}>
                                                        <div style={{ marginBottom: '10px' }}>
                                                            <small style={{ color: '#718096', fontSize: '0.65rem' }}>{q.ID_Pregunta}</small>
                                                            <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#2d3748', lineHeight: '1.5' }}>
                                                                {/* Aquí podrías poner un mapeo de ID a texto de pregunta si lo tienes */}
                                                                Respuesta registrada:
                                                            </p>
                                                        </div>
                                                        <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '8px', fontStyle: 'italic', color: '#4a5568', fontSize: '0.85rem' }}>
                                                            "{q.Valor_Respondido}"
                                                        </div>
                                                        {q.Puntos_Ganados && (
                                                            <div style={{ textAlign: 'right', marginTop: '8px' }}>
                                                                <span style={{ fontSize: '0.7rem', color: '#48bb78', fontWeight: 'bold' }}>Puntaje: {q.Puntos_Ganados}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-footer">
                                        <button className="atl-an-btn-main" onClick={() => setShowModalReal(false)}>Cerrar Reporte</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANEL 2: PROMPTING ÉTICO (HEURÍSTICA) */}
                        <div className="sos-history-chart" style={{marginTop: '20px'}}>
                            <span className="dash-lider-2026-panel-id">Panel 2</span>
                            <h4>Análisis de Prompting Individual (Liderazgo)</h4>
                            {statsPrompt ? (
                                <div className="dash-lider-2026-bars-stack" style={{padding: '10px'}}>
                                    {[
                                        { l: 'Ética', v: statsPrompt.etica, c: '#8b5cf6' },
                                        { l: 'Privacidad', v: statsPrompt.priv, c: '#06b6d4' },
                                        { l: 'Agencia', v: statsPrompt.agen, c: '#f59e0b' },
                                        { l: 'Cognición', v: statsPrompt.cogn, c: '#ec4899' }
                                    ].map(d => (
                                        <div key={d.l} className="dash-lider-2026-bar-group">
                                            <div className="dash-lider-2026-bar-label"><span>{d.l}</span><strong>{d.v}</strong></div>
                                            <div className="dash-lider-2026-bar-bg"><div className="dash-lider-2026-bar-fill" style={{width: `${(d.v/5)*100}%`, backgroundColor: d.c}}></div></div>
                                        </div>
                                    ))}
                                    <div className="sos-alert-pill" style={{marginTop: '10px', backgroundColor: '#fcf8e3', border: '1px solid #faebcc', color: '#8a6d3b'}}>
                                        {statsPrompt.diagnostico}
                                    </div>
                                </div>
                            ) : <p>Fase Liderar no completada.</p>}
                        </div>

                        {/* PANEL 3: RETOS (TRANSFORMACIÓN) */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 3</span>
                            <h4>Misiones de Transformación</h4>
                            <div className="retos-summary-grid">
                                {retos.length > 0 ? retos.map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.Nombre_Reto}</h5>
                                        <span className={`status-pill ${r.Status_Reto}`}>{r.Status_Reto}</span>
                                        <small>{r.Nivel_UNESCO}</small>
                                    </div>
                                )) : <p>No hay retos registrados.</p>}
                            </div>
                        </div>

                        {/* EVOLUCIÓN */}
                        <div className="sos-history-chart">
                            <h4>Evolución Histórica ATLAS</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={[...historial].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="Fecha_Evaluacion" /><YAxis domain={[0, 5]} hide /><Tooltip /><Line type="monotone" dataKey="Promedio_Global" stroke="#c5a059" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE DIAGNÓSTICO INDIVIDUAL */}
            {showModal && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <h3>Reporte Individual: {userData.Nombre}</h3>
                            <div className="modal-tabs">
                                <button className={viewModeModal === 'stats' ? 'active' : ''} onClick={() => setViewModeModal('stats')}>Análisis</button>
                                <button className={viewModeModal === 'survey' ? 'active' : ''} onClick={() => setViewModeModal('survey')}>Dimensiones</button>
                            </div>
                        </div>
                        <div className="atl-an-modal-body">
                            {viewModeModal === 'stats' ? (
                                <div className="stats-view">
                                    <div className="atl-an-metrics-grid">
                                        <div className="atl-an-mini-box dark"><span className="atl-an-val">{toPct(historial[0].Promedio_Global)}%</span><span className="atl-an-lbl">MEDIA GLOBAL</span></div>
                                    </div>
                                    <div className="atl-an-insight-card">
                                        <p><strong>Nivel:</strong> {historial[0].Nivel_Calculado}</p>
                                        <p><strong>Alertas:</strong> {historial[0].Alertas_Activas}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="survey-view">
                                    {dimensiones.map((d, i) => (
                                        <div key={d.id} className="atl-an-bar-container">
                                            <div className="atl-an-bar-label-row"><span>{d.nombre}</span><span>{toPct(pD[i])}%</span></div>
                                            <div className="atl-an-bar-bg"><div className="atl-an-bar-fill" style={{width: `${toPct(pD[i])}%`}}></div></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer"><button className="atl-an-btn-main" onClick={() => setShowModal(false)}>Cerrar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostener;