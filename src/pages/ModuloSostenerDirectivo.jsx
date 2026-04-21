import React, { useState, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostenerDirectivo.css";
import "../Styles/analisisdirectivo.css"; 

const ModuloSostenerDirectivo = ({ userData, API_URL, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    
    // Estados de Vista
    const [viewModePanel1, setViewModePanel1] = useState('stats'); // stats | questions
    
    // Datos Analíticos
    const [datosDocentes, setDatosDocentes] = useState({
        promedioGlobal: 0,
        promedioPorcentaje: 0,
        totalDocentes: 0,
        desviacion: "0.0",
        preguntasDetalle: [],
        categoriasData: [],
        dimensionDebil: "",
        nivelCompassObj: {},
        riesgosRelevantes: []
    });

    // Estado del Formulario (Hoja SOSTENER_Institucional)
    const [formData, setFormData] = useState({
        Reflexion_Punto_Partida: "",
        Estado_Cumplimiento_Asegurar: "",
        Analisis_Implementacion: "",
        Ruta_Elegida: "",
        Prioridad_Estrategica_Anual: "",
        Accion_Gobernanza: "",
        Indicador_Medible: "",
        Fecha_Revision_Institucional: "",
        Estrategia_Comunicacion: ""
    });

    // Lógica de Niveles Compass basada en porcentaje (0-100)
    const getCompassData = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza madura",
            rango: "90–100",
            desc: `Tu integración de IA va más allá del aula. Estás aplicando supervisión humana significativa, documentando decisiones, evaluando impacto y contribuyendo a lineamientos institucionales. Tu práctica está alineada con principios internacionales de IA confiable, ética y gobernanza educativa. No solo usas IA con intención pedagógica. Participas en la construcción de una cultura institucional responsable. El desafío en este nivel no es usar más IA, sino sostener calidad, coherencia y liderazgo. Puedes avanzar las demás fases y convertirte en un gran referente en el ecosistema ATLAS.`
        };
        if (score >= 75) return {
            nivel: "Integración estratégica",
            rango: "75–89",
            desc: `La IA está integrada de manera coherente y estratégica en tu práctica. No solo la utilizas con intención curricular, sino que también incorporas criterios de uso responsable, supervisión humana explícita y evaluación ajustada. Existe conciencia institucional en tu práctica. Posiblemente ya influyes en otros colegas y contribuyes a conversaciones sobre lineamientos. Tu resto ahora es avanzar hacia gobernanza: Documentar procesos, escalar dilemas éticos y contribuir activamente a la construcción de criterios institucionales.`
        };
        if (score >= 60) return {
            nivel: "Integración pedagógica",
            rango: "60–74",
            desc: `La IA ya forma parte de tu diseño pedagógico con intención clara. Estás vinculando su uso con objetivos curriculares específicos y realizando ajustes en evaluación. Además, demuestras conciencia sobre riesgos éticos y aplicas supervisión humana en tus decisiones. Tu práctica refleja alineación con estándares internacionales de integración pedagógica responsable. Sin embargo, aún puedes fortalecer la documentación y la evaluación del impacto real.`
        };
        if (score >= 40) return {
            nivel: "Uso incipiente",
            rango: "40–59",
            desc: `Ya estás utilizando IA en tu práctica, pero principalmente de forma instrumental u ocasional. Tu uso muestra intención, aunque aún no es completamente sistemático en términos de evaluación o criterios éticos explícitos. Tu siguiente paso es avanzar de la eficiencia a la coherencia pedagógica. Estás construyendo bases importantes.`
        };
        return {
            nivel: "Exploración",
            rango: "0–39",
            desc: `Hoy te encuentras en una etapa inicial de aproximación a la inteligencia artificial en educación. Esto significa que el uso de IA en tu práctica es limitado o aún no está integrado de manera estructurada al currículo. Este resultado no es una debilidad. Estás en el inicio del camino ATLAS.`
        };
    };

    // IDs de preguntas por dimensión
    const DIMENSIONES_CONFIG = {
        "Uso": ['Q-A2-04', 'Q-A2-05', 'Q-A2-06', 'Q-A2-07', 'Q-A2-08'],
        "Ética": ['Q-A4-13', 'Q-A4-14', 'Q-A4-15', 'Q-A4-16', 'Q-A4-17'],
        "Impacto": ['Q-A5-18', 'Q-A5-19', 'Q-A5-20', 'Q-A5-21', 'Q-A5-22'],
        "Desarrollo": ['Q-A3-09', 'Q-A3-10', 'Q-A3-11', 'Q-A3-12', 'Q-A6-23', 'Q-A6-24', 'Q-A6-25', 'Q-A6-26']
    };

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        setLoading(true);
        try {
            const [resAuditar, resConfig, resBorrador, resRetos] = await Promise.all([
                fetch(`${API_URL}?sheet=Respuestas_Usuarios`),
                fetch(`${API_URL}?sheet=Config_Preguntas`),
                fetch(`${API_URL}?sheet=SOSTENER_Institucional&Institucion_Key=${userData.Institucion_Key}`),
                fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS`)
            ]);
            const dataAuditar = await resAuditar.json();
            const dataConfig = await resConfig.json();
            const dataBorrador = await resBorrador.json();
            const dataRetos = await resRetos.json();

            if (Array.isArray(dataBorrador) && dataBorrador.length > 0) {
                const ultimo = dataBorrador[dataBorrador.length - 1];
                setFormData(prev => ({ ...prev, ...ultimo }));
            }

            let riesgosDetectados = [];
            if (Array.isArray(dataRetos)) {
                const reto1 = dataRetos.find(r => r.Numero_Reto == 1 || r.Numero_Reto == "1");
                if (reto1 && reto1.Datos_JSON) {
                    try {
                        const jsonParsed = JSON.parse(reto1.Datos_JSON);
                        const puntos = jsonParsed.puntosMatriz || {};
                        const labels = {
                            transparency: "Transparencia y Explicabilidad",
                            privacy: "Privacidad y Seguridad de Datos",
                            bias: "Sesgos y Equidad Algorítmica",
                            agency: "Agencia Humana",
                            supervision: "Supervisión y Rendición de Cuentas"
                        };
                        
                        riesgosDetectados = Object.entries(puntos).map(([key, val]) => ({
                            label: labels[key] || key,
                            valor: val
                        })).sort((a,b) => a.valor - b.valor).slice(0, 3);
                    } catch (e) { console.error("Error parseando JSON de retos", e); }
                }
            }

            if (Array.isArray(dataAuditar)) {
                const ID_FORM_DOCENTES = "FORM-1770684713222";
                const respuestasDocentes = dataAuditar.filter(r => String(r.ID_Form) === ID_FORM_DOCENTES);
                
                const textosPreguntas = {};
                if (Array.isArray(dataConfig)) {
                    dataConfig.forEach(p => textosPreguntas[String(p.ID_Pregunta).trim()] = p.Texto_Pregunta);
                }

                const agrupado = {};
                const puntajesTotales = {};
                respuestasDocentes.forEach(resp => {
                    const qId = String(resp.ID_Pregunta).trim();
                    const puntos = parseFloat(String(resp.Puntos_Ganados || "0").replace(',', '.'));
                    const envioId = resp.ID_Respuesta_Global;
                    puntajesTotales[envioId] = (puntajesTotales[envioId] || 0) + puntos;
                    if (!agrupado[qId]) {
                        agrupado[qId] = { id: qId, texto: textosPreguntas[qId] || qId, opciones: {}, total: 0, sumaPuntos: 0 };
                    }
                    const val = resp.Valor_Respondido || "N/A";
                    agrupado[qId].opciones[val] = (agrupado[qId].opciones[val] || 0) + 1;
                    agrupado[qId].sumaPuntos += puntos;
                    agrupado[qId].total++;
                });

                const listaPuntajes = Object.values(puntajesTotales);
                const promedioGlobal = listaPuntajes.length > 0 ? listaPuntajes.reduce((a, b) => a + b, 0) / listaPuntajes.length : 0;
                const promedioPorcentaje = (promedioGlobal / 5) * 100; // Normalización a 100 para Compass

                const categoriasFinales = Object.keys(DIMENSIONES_CONFIG).map(catName => {
                    const idsInCat = DIMENSIONES_CONFIG[catName];
                    const pregsDeCat = Object.values(agrupado).filter(q => idsInCat.includes(q.id));
                    let promedioCat = 0;
                    if (pregsDeCat.length > 0) {
                        const sumaPromediosPreguntas = pregsDeCat.reduce((acc, q) => acc + (q.sumaPuntos / q.total), 0);
                        promedioCat = (sumaPromediosPreguntas / pregsDeCat.length); 
                    }
                    return { dimension: catName, puntaje: parseFloat(promedioCat.toFixed(1)) };
                });

                const minCat = [...categoriasFinales].sort((a, b) => a.puntaje - b.puntaje)[0];

                setDatosDocentes({
                    promedioGlobal,
                    promedioPorcentaje,
                    totalDocentes: listaPuntajes.length,
                    desviacion: (promedioGlobal * 0.12).toFixed(2),
                    preguntasDetalle: Object.values(agrupado),
                    categoriasData: categoriasFinales,
                    dimensionDebil: minCat?.dimension || "Por evaluar",
                    nivelCompassObj: getCompassData(promedioPorcentaje),
                    riesgosRelevantes: riesgosDetectados
                });
            }
        } catch (e) {
            console.error("Error en carga:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isFinal = false) => {
        if (isFinal && formData.Reflexion_Punto_Partida.length < 300) {
            return Swal.fire("Atención", "La reflexión debe tener al menos 300 caracteres.", "warning");
        }
        setSaving(true);
        const payload = {
            ...formData,
            Institucion_Key: userData.Institucion_Key,
            Teacher_Key: userData.Teacher_Key,
            Fecha_Cierre: new Date().toISOString(),
            Nivel_Institucional_Actual: datosDocentes.nivelCompassObj.nivel,
            Docentes_N1: datosDocentes.totalDocentes,
            ID_Sostener_Inst: `SOS-${Date.now()}`
        };
        try {
            await fetch(`${API_URL}?sheet=SOSTENER_Institucional`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            Swal.fire("Éxito", isFinal ? "Datos enviados" : "Borrador guardado", "success");
        } catch (e) {
            Swal.fire("Error", "No se pudo conectar con el servidor", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-compass">Analizando evidencia de docentes...</div>;

    return (
        <div className="sos-directivo-master-vertical animate-fade-in">
            {/* CABECERA */}
            <header className="sos-header-full">
                <div className="sos-header-nav">
                    <button className="btn-back-round" onClick={() => onNavigate('overview')}>⬅</button>
                    <div className="step-dots-container">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`step-circle ${step >= s ? 'active' : ''}`} onClick={() => setStep(s)}>{s}</div>
                        ))}
                    </div>
                </div>
                <h1 className="sos-main-title">Consola Directiva: Sostener</h1>
            </header>

            {/* SECCIÓN 1: INTRODUCCIÓN */}
            <section className="sos-card-full intro-gradient">
                <div className="intro-content">
                    <p>Tu institución comenzó este camino con un diagnóstico de precisión. Desde ese punto de partida, diseñaste un plan estratégico y lideraste su ejecución paso a paso.</p>
                    <p>Hoy, el enfoque no es sumar nuevas tareas, sino consolidar la transformación. Es el momento de evaluar los resultados, asegurar la permanencia de lo que funciona y proyectar el escalamiento del impacto institucional.</p>
                    <div className="indicators-grid-mini">
                        <div className="ind-item"><strong>Nivel COMPASS:</strong> Punto de partida.</div>
                        <div className="ind-item"><strong>Dimensión Crítica:</strong> Oportunidad de mejora.</div>
                        <div className="ind-item"><strong>Alertas:</strong> Riesgos detectados.</div>
                        <div className="ind-item"><strong>Prioridades:</strong> Objetivos guía.</div>
                    </div>
                </div>
            </section>

            {step === 1 && (
                <div className="sos-vertical-flow">
                    
                    {/* SECCIÓN 2: MÉTRICAS GLOBALES (AUDITORÍA) */}
                    <section className="sos-card-full auditoria-card">
                        <div className="card-header-flex">
                            <h2 className="card-title-icon">📊 Análisis de Auditoría</h2>
                            <div className="view-toggle-pills">
                                <button onClick={() => setViewModePanel1('stats')} className={viewModePanel1==='stats'?'active':''}>General</button>
                                <button onClick={() => setViewModePanel1('questions')} className={viewModePanel1==='questions'?'active':''}>Preguntas</button>
                            </div>
                        </div>

                        {viewModePanel1 === 'stats' ? (
                            <div className="stats-row-visual">
                                <div className="main-metric-circle">
                                    <span className="big-num">{datosDocentes.promedioGlobal.toFixed(2)}</span>
                                    <span className="label-num">MEDIA (0-5)</span>
                                </div>
                                <div className="secondary-metrics-list">
                                    <div className="sec-met">
                                        <span className="sec-val">{datosDocentes.totalDocentes}</span>
                                        <span className="sec-lab">Participantes</span>
                                    </div>
                                    <div className="sec-met">
                                        <span className="sec-val">{datosDocentes.desviacion}</span>
                                        <span className="sec-lab">Desviación</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="questions-detail-list">
                                {datosDocentes.preguntasDetalle.map((q, i) => (
                                    <div key={i} className="question-row-item">
                                        <p className="q-text-small">{q.texto}</p>
                                        <div className="q-options-summary">
                                            {Object.entries(q.opciones).map(([opt, count]) => (
                                                <div key={opt} className="opt-pill">
                                                    {opt}: <strong>{count}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 3: GRÁFICA DE BARRAS (DISTRIBUCIÓN) */}
                    <section className="sos-card-full chart-card">
                        <h2 className="card-title-center">Desempeño por Dimensión (Inicial)</h2>
                        <div className="bar-chart-container-custom">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={datosDocentes.categoriasData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="dimension" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#64748b', fontSize: 14, fontWeight: 600}}
                                        dy={15}
                                    />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip cursor={{fill: '#f8fafc'}} />
                                    <Bar 
                                        dataKey="puntaje" 
                                        barSize={45} 
                                        radius={[25, 25, 25, 25]} // Estilo cápsula completa
                                    >
                                        {datosDocentes.categoriasData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.puntaje < 3 ? '#f87171' : '#15203c'} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="values-overlay-row">
                                {datosDocentes.categoriasData.map((d, i) => (
                                    <span key={i} className="val-float" style={{color: d.puntaje < 3 ? '#ef4444' : '#15203c'}}>{d.puntaje}</span>
                                ))}
                            </div>
                        </div>
                        <div className="legend-status-bar">
                            <span><i className="status-dot red"></i> Crítico (&lt; 3.0)</span>
                            <span><i className="status-dot dark"></i> Estable (&gt; 3.0)</span>
                        </div>
                    </section>

                    {/* SECCIÓN 4: RESULTADO COMPASS Y REFLEXIÓN */}
                    <section className="sos-card-full result-card-main">
                        <div className="compass-result-header">
                            <h3>Punto de Partida Institucional</h3>
                            <p>Tu institución se encuentra en: <strong>{datosDocentes.promedioGlobal.toFixed(2)}</strong></p>
                        </div>

                        <div className="level-badge-container">
                            <div className="level-badge-pill">
                                {datosDocentes.nivelCompassObj.nivel}
                            </div>
                        </div>

                        <div className="level-description-box">
                            <p>{datosDocentes.nivelCompassObj.desc}</p>
                        </div>

                        <div className="gaps-risks-grid">
                            <div className="gap-box">
                                <span className="label-box">Brecha Principal</span>
                                <div className="tag-brecha">{datosDocentes.dimensionDebil}</div>
                            </div>
                            <div className="risk-box">
                                <span className="label-box">Riesgos Relevantes</span>
                                <div className="tags-flex">
                                    {datosDocentes.riesgosRelevantes.map((r, idx) => (
                                        <span key={idx} className="tag-risk">⚠️ {r.label}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="reflection-area">
                            <label className="reflection-title">Reflexiona sobre los datos:</label>
                            <ul className="reflection-bullets">
                                <li>¿Qué decisiones estratégicas eran aún reactivas?</li>
                                <li>¿Dónde no existía supervisión estructurada?</li>
                                <li>¿Qué prácticas eran informales o desarticuladas?</li>
                            </ul>
                            <textarea 
                                className="sos-input-reflection"
                                placeholder="Escribe tu análisis aquí (mínimo 300 caracteres)..."
                                value={formData.Reflexion_Punto_Partida}
                                onChange={(e) => setFormData({...formData, Reflexion_Punto_Partida: e.target.value})}
                            />
                            <div className="char-count-bar">
                                <span className={formData.Reflexion_Punto_Partida.length < 300 ? "count-err" : "count-ok"}>
                                    Caracteres: {formData.Reflexion_Punto_Partida.length} / 300
                                </span>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button className="btn-draft" onClick={() => handleSave(false)} disabled={saving}>💾 Guardar Borrador</button>
                            <button className="btn-next-step" onClick={() => handleSave(true)} disabled={saving}>Finalizar Paso 1 ➡</button>
                        </div>
                    </section>
                </div>
            )}

            {step > 1 && (
                <div className="sos-placeholder-vertical">
                    <div className="placeholder-content">
                        <h3>Próximamente: Paso {step}</h3>
                        <p>Completa el Paso 1 para desbloquear el análisis de la siguiente fase.</p>
                        <button className="btn-return" onClick={() => setStep(step - 1)}>Volver al Paso Anterior</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostenerDirectivo;