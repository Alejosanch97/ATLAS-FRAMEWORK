import React, { useState, useEffect } from "react";
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css"; 

const ModuloSostener = ({ userData, API_URL, onNavigate, datosExistentes }) => {
    const [view, setView] = useState("menu"); 
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(datosExistentes || []);
    
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

    const generarDiagnostico = (puntaje) => {
        const p = parseFloat(puntaje);

        if (p >= 90) return {
            nivel: "Referente Institucional de Vanguardia",
            texto: `
Tu perfil refleja una integración madura, ética y estratégicamente documentada de la inteligencia artificial.

No solo utilizas IA con intención pedagógica clara, sino que ejerces supervisión humana explícita, evalúas impacto en aprendizaje y contribuyes activamente a la gobernanza institucional.

Tu práctica ya no es instrumental: es sistémica. Existe coherencia entre propósito curricular, protección de datos, evaluación crítica y desarrollo profesional continuo.

Este nivel indica que tu uso de IA es sostenible en el tiempo y puede convertirse en modelo replicable dentro de tu institución.
        `,
            implicacion: `
La institución puede apoyarse en tu experiencia para fortalecer lineamientos, acompañar a otros docentes y consolidar procesos de certificación o validación externa.
        `,
            accion: `
• Liderar comunidades de práctica.
• Documentar casos de impacto medible.
• Diseñar microformaciones internas.
• Participar en construcción de política institucional de IA.
        `
        };

        if (p >= 80) return {
            nivel: "Docente Estratégico Consolidado",
            texto: `
Tu integración de IA es sólida y coherente con objetivos de aprendizaje. 

Existe intención pedagógica clara, revisión crítica de resultados generados y conciencia ética en el manejo de datos y posibles sesgos.

Estás operando en un nivel donde la IA deja de ser herramienta aislada y se convierte en recurso estratégico dentro de tu diseño didáctico.
        `,
            implicacion: `
El siguiente paso no es usar más tecnología, sino medir con mayor precisión el impacto en autonomía, pensamiento crítico y diferenciación pedagógica.
        `,
            accion: `
• Implementar métricas comparativas antes/después.
• Profundizar en personalización avanzada.
• Sistematizar evidencias de mejora.
        `
        };

        if (p >= 60) return {
            nivel: "Integrador en Evolución",
            texto: `
Has superado la fase meramente instrumental. La IA ya forma parte de tu práctica con intención pedagógica identificable.

Sin embargo, aún existen oportunidades para fortalecer la dimensión ética, la documentación de impacto y la sistematicidad del proceso.

Tu integración es funcional, pero puede volverse más estratégica y medible.
        `,
            implicacion: `
El crecimiento en este nivel depende de consolidar supervisión humana explícita, fortalecer protección de datos y evaluar resultados de aprendizaje más allá de la eficiencia operativa.
        `,
            accion: `
• Diseñar secuencias didácticas donde la IA tenga rol definido y evaluable.
• Revisar políticas institucionales de protección de datos.
• Iniciar registro estructurado de experiencias.
        `
        };

        if (p >= 40) return {
            nivel: "Explorador Inicial",
            texto: `
Te encuentras en una fase de aproximación activa a la inteligencia artificial.

El uso actual muestra interés y apertura, pero aún predomina un enfoque funcional u ocasional. La integración no es completamente sistemática ni alineada con objetivos curriculares explícitos.

Existe riesgo de automatización sin evaluación profunda del impacto pedagógico.
        `,
            implicacion: `
El desafío en esta etapa no es incorporar más herramientas, sino comprender mejor cuándo, cómo y para qué usarlas dentro de un marco ético y estratégico.
        `,
            accion: `
• Formular objetivos de aprendizaje antes de usar IA.
• Practicar revisión crítica sistemática de resultados generados.
• Participar en formación específica sobre ética y sesgos.
        `
        };

        return {
            nivel: "Fase de Alfabetización Instrumental",
            texto: `
Actualmente el uso de IA en tu práctica es limitado o principalmente operativo.

No se evidencia aún una integración pedagógica estructurada ni una conciencia consolidada sobre riesgos de privacidad, sesgos o dependencia automatizada.

Este resultado no representa una debilidad, sino un punto de partida claro para iniciar un proceso formativo consciente.
        `,
            implicacion: `
El progreso dependerá de fortalecer comprensión conceptual antes de escalar el uso con estudiantes.
        `,
            accion: `
• Comprender principios básicos de protección de datos.
• Explorar casos de uso pedagógico con acompañamiento.
• Reflexionar sobre el rol insustituible del criterio docente.
        `
        };
    };

    useEffect(() => {
        if (datosExistentes) {
            setHistorial([datosExistentes]);
            const mapaRespuestas = {};
            for (let i = 1; i <= 24; i++) {
                const dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
                const valor = datosExistentes[`${dimPrefix}${i}`];
                if (valor) mapaRespuestas[i] = Number(valor);
            }
            setRespuestas(mapaRespuestas);
        }
    }, [datosExistentes]);

    useEffect(() => {
        const integrarFases = async () => {
            const tKey = userData?.Teacher_Key;
            if(!tKey) return;

            try {
                const [resAuditar, resRetos, resLiderar] = await Promise.all([
                    fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${tKey}`), 
                    fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS&Teacher_Key=${tKey}`),
                    fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes&Teacher_Key=${tKey}`)
                ]);

                const dAuditar = await resAuditar.json();
                const dRetos = await resRetos.json();
                const dLiderar = await resLiderar.json();

                // Auditoría Real (Filtro por el ID de formulario específico)
                const idAuditarCorrecto = "FORM-1770684713222"; 
                const misDatosReales = Array.isArray(dAuditar) ? dAuditar.filter(r => r.ID_Form === idAuditarCorrecto) : [];
                setRespuestasAuditarReal(misDatosReales);

                if (misDatosReales.length > 0) {
                    const puntajes = misDatosReales.map(r => Number(r.Puntos_Ganados || 0));
                    const n = puntajes.length;

                    // 1. MEDIA REAL
                    const media = puntajes.reduce((a, b) => a + b, 0) / n;

                    // 2. MODA REAL (El valor que más se repite)
                    const frecuencias = {};
                    puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
                    const moda = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);

                    // 3. DESVIACIÓN ESTÁNDAR REAL
                    const varianza = puntajes.reduce((acc, p) => acc + Math.pow(p - media, 2), 0) / n;
                    const desviacion = Math.sqrt(varianza);

                    setSelectedFormReal({
                        promedio: (media * 20).toFixed(1),      // Escala 0-100
                        modaValue: (Number(moda) * 20).toFixed(1), // Escala 0-100
                        desviacion: desviacion.toFixed(2),       // Dispersión real
                        analisis: { nivel: "Evidencia de Auditoría", color: "#4c51bf" }
                    });
                }

                if (Array.isArray(dRetos)) {
                    const misRetosFiltrados = dRetos.filter(r => r.Teacher_Key === tKey);
                    setRetos(misRetosFiltrados);
                }
                if (Array.isArray(dLiderar)) {
                    setPromptData(dLiderar.find(p => p.Status === 'completed') || dLiderar[0]);
                }

                // Cálculo de Balance Global
                const scoreIni = misDatosReales.length > 0 
                    ? (misDatosReales.reduce((acc, r) => acc + Number(r.Puntos_Ganados || 0), 0) / misDatosReales.length)
                    : 0;

                const ultimoSostener = historial[0];
                const scoreActual = ultimoSostener ? Number(ultimoSostener.Promedio_Global) : (scoreIni * 1); // Mantener en escala 1-5

                setBalanceGlobal({
                    antes: { nivel: scoreIni > 4 ? "Estratégico" : "Exploratorio", puntaje: (scoreIni * 20).toFixed(1) },
                    ahora: { nivel: ultimoSostener?.Nivel_Calculado || "En Proceso", puntaje: (scoreActual * 20).toFixed(1) },
                    evidencias: { 
                        retos: Array.isArray(dRetos) ? dRetos.filter(r => r.Status_Reto === 'COMPLETADO').length : 0, 
                        notasLiderar: dLiderar[0] || null 
                    },
                    crecimiento: ((scoreActual * 20) - (scoreIni * 20)).toFixed(1)
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
        
        // Si ya hay un historial, usamos ese ID para que la base de datos sepa que es una actualización
        const esUpdate = historial.length > 0;
        const idAUsar = esUpdate ? historial[0].ID_Sostener : `SOS-${tKey}-${Date.now()}`;

        const respuestasMapeadas = {};
        for (let i = 1; i <= 24; i++) {
            let dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
            respuestasMapeadas[`${dimPrefix}${i}`] = respuestas[i] || 0;
        }

        const excelData = {
            ID_Sostener: idAUsar, 
            Teacher_Key: tKey, 
            Fecha_Evaluacion: new Date().toLocaleDateString('es-ES'),
            Periodo: "2026-1", 
            Institucion_Key: userData?.Institucion_Key || "INST-GENERAL", 
            ...respuestasMapeadas,
            Promedio_Global: res.promedioGlobal.toFixed(2), 
            Nivel_Calculado: res.nivel,
            "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4": `${res.promediosD[0].promedio}, ${res.promediosD[1].promedio}, ${res.promediosD[2].promedio}, ${res.promediosD[3].promedio}`,
            Alertas_Activas: res.alertas.join(" | ") || "Sin Alertas",
            Porcentaje_Crecimiento: `${balanceGlobal.crecimiento}%`, 
            Reflexion_Antes: "", Reflexion_Despues: "", Aprendizaje_Clave: "", 
            Prioridad_Sostener: "Media", Compromiso_Accion: "", Evidencia_Mejora: "", Fecha_Revision_Plan: ""
        };

        try {
            await fetch(API_URL, { 
                method: "POST", 
                headers: { "Content-Type": "text/plain;charset=utf-8" }, 
                body: JSON.stringify({ 
                    action: esUpdate ? "update" : "create", 
                    sheet: "SOSTENER_Docentes", 
                    idField: "ID_Sostener",
                    idValue: idAUsar,
                    data: excelData 
                }) 
            });
            
            setHistorial([excelData]); // Actualizamos el historial local
            setView("dashboard");
            Swal.fire("Éxito", "Evaluación sincronizada.", "success");
        } catch (e) { 
            Swal.fire("Error", "Error al guardar en la nube.", "error"); 
        } finally { 
            setLoading(false); 
        }
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
                                {/* Si ya hay historial, el botón principal es ver el Balance */}
                                {historial.length > 0 ? (
                                    <>
                                        <button onClick={() => setView("dashboard")} className="btn-sos-primary">
                                            Ver Mi Análisis
                                        </button>
                                        <button onClick={() => setView("cuestionario")} className="btn-sos-secondary">
                                            Revisar Autoevaluación
                                        </button>
                                    </>
                                ) : (
                                    /* Si no hay datos, el botón es Iniciar */
                                    <button onClick={() => setView("cuestionario")} className="btn-sos-primary">
                                        Iniciar Autoevaluación
                                    </button>
                                )}
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
                                <h4>Índice de Sostenibilidad</h4>
                                <div className="sos-big-val" style={{ fontSize: '3rem', margin: '20px 0' }}>
                                    {toPct(historial[0].Promedio_Global)}%
                                </div>

                                <button
                                    className="atl-an-btn-main"
                                    style={{ marginTop: '10px', width: '100%', background: 'var(--primary)', color: '#000' }}
                                    onClick={() => setShowModal(true)}
                                >
                                    Ver Análisis Maestro
                                </button>
                            </div>

                            <div className="sos-stat-card radar-cont">
                                <h4>Radar de Sostenibilidad</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Uso', A: pD[0] },
                                        { s: 'Ética', A: pD[1] },
                                        { s: 'Impacto', A: pD[2] },
                                        { s: 'Desarrollo', A: pD[3] }
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Radar
                                            name="Nivel Actual"
                                            dataKey="A"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.5}
                                        />
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
                                    <span style={{ fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase' }}>Preguntas</span>
                                </div>
                                <div className="atl-an-mini-box" style={{ flex: 1, textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 'bold', color: '#1a202c' }}>
                                        {selectedFormReal?.promedio || 0}%
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase' }}>Media (M)</span>
                                </div>
                            </div>

                            <button className="atl-an-btn-main" style={{ width: '100%', marginTop: '20px', background: '#4c51bf' }}>
                                Ver Diagnóstico
                            </button>
                        </div>

                        {/* MODAL ESPECÍFICO PARA AUDITORÍA REAL */}
                        {showModalReal && (
                            <div className="atl-an-overlay" style={{ zIndex: 9999 }}>
                                <div className="atl-an-modal wide animate-fade-in" style={{ maxWidth: '850px' }}>
                                    <div className="atl-an-modal-head">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div>
                                                <h3 style={{ margin: 0 }}>Reporte ATLAS: Diagnóstico Real</h3>
                                                <p style={{ fontSize: '0.8rem', color: 'gray', margin: 0 }}>Datos sincronizados desde Fase de Auditoría</p>
                                            </div>
                                            <button className="atl-an-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="modal-tabs" style={{ marginTop: '20px' }}>
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Resumen Estadístico</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Análisis por Indicador</button>
                                        </div>
                                    </div>

                                    <div className="atl-an-modal-body" style={{ padding: '25px' }}>
                                        {viewModeReal === 'stats' ? (
                                            <div className="stats-view">
                                                <div className="atl-an-metrics-grid" style={{ marginBottom: '30px' }}>
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val" style={{ color: '#63b3ed' }}>{selectedFormReal?.promedio}%</span>
                                                        <span className="atl-an-lbl">MEDIA (M)</span>
                                                    </div>
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val" style={{ color: '#68d391' }}>{selectedFormReal?.modaValue || selectedFormReal?.promedio}%</span>
                                                        <span className="atl-an-lbl">MODA (MO)</span>
                                                    </div>
                                                    <div className="atl-an-mini-box dark">
                                                        <span className="atl-an-val" style={{ color: '#f6ad55' }}>{selectedFormReal?.desviacion || '1.88'}</span>
                                                        <span className="atl-an-lbl">DESVIACIÓN (Σ)</span>
                                                    </div>
                                                </div>

                                                <div className="atl-an-insight-card" style={{ borderLeft: '5px solid #4c51bf', background: '#f8fafc', padding: '20px' }}>
                                                    <h4 style={{ color: '#4c51bf', marginBottom: '10px', fontSize: '1rem' }}>Capacidad ATLAS Demostrada</h4>
                                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#4a5568' }}>
                                                        Basado en las <strong>{respuestasAuditarReal.length}</strong> evidencias recolectadas, su práctica se ubica mayoritariamente alineada. Este resultado refleja un uso intencional de la IA, con criterios éticos aplicados en tiempo real.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="survey-view" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                                                <h4 style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#718096' }}>DESGLOSE DE PUNTUACIONES POR ITEM</h4>
                                                {respuestasAuditarReal.map((q, idx) => {
                                                    // Calculamos el porcentaje por pregunta (asumiendo base 5)
                                                    const valorPregunta = (Number(q.Puntos_Ganados || 0) * 20);
                                                    return (
                                                        <div key={idx} className="atl-an-bar-container" style={{ marginBottom: '18px' }}>
                                                            <div className="atl-an-bar-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2d3748' }}>
                                                                    {q.Valor_Respondido || `Indicador ${idx + 1}`}
                                                                </span>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4c51bf' }}>{valorPregunta}%</span>
                                                            </div>
                                                            <div className="atl-an-bar-bg" style={{ height: '10px', background: '#edf2f7', borderRadius: '10px' }}>
                                                                <div className="atl-an-bar-fill" style={{
                                                                    width: `${valorPregunta}%`,
                                                                    height: '100%',
                                                                    borderRadius: '10px',
                                                                    backgroundColor: valorPregunta > 75 ? '#48bb78' : valorPregunta > 45 ? '#ecc94b' : '#f56565',
                                                                    transition: 'width 1s ease-in-out'
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-footer" style={{ borderTop: '1px solid #edf2f7', padding: '15px' }}>
                                        <button className="atl-an-btn-main" onClick={() => setShowModalReal(false)} style={{ background: '#1e293b', width: '200px' }}>
                                            Cerrar Reporte
                                        </button>
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
                    <div className="atl-an-modal wide animate-fade-in" style={{ maxWidth: '900px' }}>
                        <div className="atl-an-modal-head">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div>
                                    <h3>Reporte Individual: {userData.Nombre}</h3>
                                    <p style={{ color: 'gray', fontSize: '0.8rem', margin: 0 }}>Marco COMPASS - Ciclo Sostener 2026</p>
                                </div>
                                <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <div className="modal-tabs" style={{ marginTop: '15px' }}>
                                <button className={viewModeModal === 'stats' ? 'active' : ''} onClick={() => setViewModeModal('stats')}>Análisis</button>
                                <button className={viewModeModal === 'survey' ? 'active' : ''} onClick={() => setViewModeModal('survey')}>Dimensiones</button>
                            </div>
                        </div>
                        <div className="atl-an-modal-body">
                            {viewModeModal === 'stats' ? (
                                <div className="stats-view">
                                    <div className="atl-an-metrics-grid">
                                        <div className="atl-an-mini-box dark">
                                            <span className="atl-an-val" style={{ color: 'var(--primary)' }}>{toPct(historial[0].Promedio_Global)}%</span>
                                            <span className="atl-an-lbl">MEDIA GLOBAL</span>
                                        </div>
                                        <div className="atl-an-mini-box dark">
                                            <span className="atl-an-val" style={{ fontSize: '1.1rem' }}>{generarDiagnostico(toPct(historial[0].Promedio_Global)).nivel}</span>
                                            <span className="atl-an-lbl">NIVEL ACTUAL</span>
                                        </div>
                                    </div>

                                    {/* BLOQUE DE ANÁLISIS DINÁMICO */}
                                    <div className="atl-an-insight-card" style={{ marginTop: '20px', textAlign: 'left', borderLeft: '4px solid var(--primary)', padding: '20px', background: '#f8fafc' }}>
                                        <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>💡 Diagnóstico Pedagógico</h4>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-line' }}>
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).texto}
                                        </p>

                                        <h4 style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--primary-dark)', fontSize: '0.9rem' }}>🔍 Implicación</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).implicacion}
                                        </p>
                                    </div>

                                    <div style={{ marginTop: '15px' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'gray' }}><strong>Alertas Activas:</strong> {historial[0].Alertas_Activas}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="survey-view">
                                    {dimensiones.map((d, i) => (
                                        <div key={d.id} className="atl-an-bar-container" style={{ marginBottom: '15px' }}>
                                            <div className="atl-an-bar-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontWeight: '600' }}>{d.nombre}</span>
                                                <span>{toPct(pD[i])}%</span>
                                            </div>
                                            <div className="atl-an-bar-bg" style={{ background: '#f1f5f9', borderRadius: '5px', height: '10px' }}>
                                                <div className="atl-an-bar-fill" style={{ width: `${toPct(pD[i])}%`, background: 'var(--primary)', height: '100%', borderRadius: '5px', transition: 'width 1s ease' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="atl-an-btn-main" onClick={() => setShowModal(false)} style={{ width: '100%' }}>Cerrar Reporte de Sostenibilidad</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostener;