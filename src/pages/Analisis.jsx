import React, { useState, useEffect } from "react";
import "../Styles/analisis.css"; 

export const Analisis = ({ userData, API_URL }) => {
    const [formulariosAgrupados, setFormulariosAgrupados] = useState({});
    const [selectedForm, setSelectedForm] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchRespuestas();
    }, []);

    const fetchRespuestas = async () => {
        try {
            // Traemos todos los datos asociados a tu llave de profesor
            const res = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&Teacher_Key=${userData.Teacher_Key}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                procesarDatos(data);
            }
        } catch (e) {
            console.error("Error al cargar respuestas", e);
        }
    };

    const procesarDatos = (data) => {
        const agrupado = data.reduce((acc, resp) => {
            const formId = resp.ID_Form;
            
            /* CORRECCIÓN CLAVE: 
               Identificamos un envío único combinando el ID del formulario, 
               el ID del usuario que responde (Teacher_Key del alumno) y el ID global de respuesta.
            */
            const envioId = `${resp.ID_Form}_${resp.Teacher_Key}_${resp.ID_Respuesta_Global}`;

            if (!acc[formId]) {
                acc[formId] = {
                    id: formId,
                    nombre: resp.Nombre_Formulario || "Instrumento ATLAS",
                    envios: {} 
                };
            }

            // Si el envío no existe en este formulario, lo inicializamos en 0
            if (!acc[formId].envios[envioId]) {
                acc[formId].envios[envioId] = 0;
            }
            
            // Sumamos los puntos de cada una de las 9 preguntas para ese usuario específico
            acc[formId].envios[envioId] += parseFloat(resp.Puntos_Ganados || 0);

            return acc;
        }, {});

        const finalData = {};
        Object.keys(agrupado).forEach(key => {
            // Object.values(agrupado[key].envios) ahora devuelve un array de TOTALES por persona
            // Ejemplo: [80, 75] (Felipe sacó 80, Ale sacó 75) -> Longitud = 2 usuarios
            const puntajesFinalesPorAlumno = Object.values(agrupado[key].envios);
            
            finalData[key] = {
                id: agrupado[key].id,
                nombre: agrupado[key].nombre,
                puntajes: puntajesFinalesPorAlumno
            };
        });

        setFormulariosAgrupados(finalData);
    };

    const calcularEstadisticas = (puntajes) => {
        if (!puntajes || puntajes.length === 0) return { promedio: 0, n: 0, moda: 0, desviacion: 0 };

        const n = puntajes.length; // Ahora sí contará correctamente (2 en tu caso)
        const suma = puntajes.reduce((a, b) => a + b, 0);
        const promedio = (suma / n).toFixed(2);
        
        const frecuencias = {};
        puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
        const moda = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);

        const varianza = puntajes.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / n;
        const desviacion = Math.sqrt(varianza).toFixed(2);

        return { promedio, n, moda, desviacion };
    };

    const abrirAnalisis = (formId) => {
        const formulario = formulariosAgrupados[formId];
        const stats = calcularEstadisticas(formulario.puntajes);
        const conclusiones = generarConclusiones(stats.promedio, stats.desviacion);

        setSelectedForm({
            ...formulario,
            ...stats,
            conclusiones
        });
        setShowModal(true);
    };

    const generarConclusiones = (prom, desv) => {
        const p = parseFloat(prom);
        const d = parseFloat(desv);

        if (p >= 90 && d <= 5) {
            return {
                nivel: "Dominio Maestro",
                desc: `La media grupal de ${p}% con baja dispersión (${d}) indica un éxito total en la estandarización de procesos.`
            };
        }
        if (p >= 80 && d > 10) {
            return {
                nivel: "Rendimiento Volátil",
                desc: `Promedio alto (${p}%), pero con brechas importantes entre alumnos (desviación de ${d}).`
            };
        }
        if (p >= 70 && p < 90) {
            return {
                nivel: "Capacidad Operativa",
                desc: `Nivel sólido (${p}%). Los fundamentos están presentes, pero falta ajuste técnico colectivo.`
            };
        }
        if (d > 20) {
            return {
                nivel: "Inconsistencia de Proceso",
                desc: `Alerta: Resultados extremadamente dispares entre los participantes (Desv: ${d}).`
            };
        }
        return {
            nivel: "Fase de Alineación",
            desc: `Media actual de ${p}%. El grupo requiere intervención en puntos clave para madurar digitalmente.`
        };
    };

    return (
        <div className="atl-an-container">
            <div className="atl-an-grid">
                {Object.values(formulariosAgrupados).map(form => (
                    <div key={form.id} className="atl-an-card">
                        <div className="atl-an-card-info">
                            <h4>{form.nombre}</h4>
                            <small className="user-key-tag">ID: {form.id}</small>
                        </div>
                        
                        <div className="atl-an-stats-row">
                            <div className="atl-an-mini-box">
                                <span className="atl-an-val">{form.puntajes.length}</span>
                                <span className="atl-an-lbl">Usuarios (N)</span>
                            </div>
                            <div className="atl-an-mini-box">
                                <span className="atl-an-val">
                                    {form.puntajes.length > 0 
                                        ? (form.puntajes.reduce((a,b)=>a+b,0)/form.puntajes.length).toFixed(0) 
                                        : 0}%
                                </span>
                                <span className="atl-an-lbl">Media (μ)</span>
                            </div>
                        </div>

                        <button className="atl-an-btn-main" onClick={() => abrirAnalisis(form.id)}>
                            Ver Diagnóstico Grupal
                        </button>
                    </div>
                ))}
            </div>

            {showModal && selectedForm && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal">
                        <div className="atl-an-modal-head">
                            <h3>Reporte ATLAS: {selectedForm.nombre}</h3>
                            <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="atl-an-metrics-grid">
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val blue">{selectedForm.promedio}%</span>
                                <span className="atl-an-lbl">Media (μ)</span>
                            </div>
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val green">{selectedForm.moda}%</span>
                                <span className="atl-an-lbl">Moda (Mo)</span>
                            </div>
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val gold">{selectedForm.desviacion}</span>
                                <span className="atl-an-lbl">Desv. (σ)</span>
                            </div>
                        </div>

                        <div className="atl-an-progress-section">
                            <label className="atl-an-lbl">Posicionamiento en Curva de Rendimiento</label>
                            <div className="atl-an-bar-bg">
                                <div className="atl-an-bar-fill" style={{ width: `${selectedForm.promedio}%` }}></div>
                            </div>
                        </div>

                        <div className="atl-an-insight-card">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                <span style={{fontSize: '1.5rem'}}>📊</span>
                                <h5 style={{margin: 0, color: '#2d3748'}}>Interpretación Grupal</h5>
                            </div>
                            <p className="atl-an-nivel" style={{color: 'var(--atlas-accent)', fontSize: '1.1rem'}}>{selectedForm.conclusiones.nivel}</p>
                            <p className="atl-an-desc" style={{lineHeight: '1.6', color: '#4a5568'}}>
                                {selectedForm.conclusiones.desc}
                            </p>
                            <p style={{fontSize: '0.7rem', color: '#a0aec0', marginTop: '15px', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '10px'}}>
                                * Este análisis utiliza {selectedForm.n} muestras de alumnos.
                            </p>
                        </div>

                        <button className="atl-an-btn-main" onClick={() => setShowModal(false)}>Cerrar Reporte</button>
                    </div>
                </div>
            )}
        </div>
    );
};