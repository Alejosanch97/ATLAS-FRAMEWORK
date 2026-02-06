import React, { useState, useEffect } from 'react';
import '../Styles/responderFormularios.css'; 

export const ResponderFormularios = ({ userData, API_URL, setIsSyncing, isSyncing }) => {
    const [availableForms, setAvailableForms] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [currentResponses, setCurrentResponses] = useState({});
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsSyncing(true);
        try {
            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const forms = await resForms.json();
            const resAnswers = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData?.Teacher_Key}`);
            const answers = await resAnswers.json();
            if (Array.isArray(forms)) setAvailableForms(forms);
            if (Array.isArray(answers)) setUserAnswers(answers);
        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const isFormAnswered = (formId) => userAnswers.some(ans => ans.ID_Form === formId);
    const pendingForms = availableForms.filter(f => !isFormAnswered(f.ID_Form));
    const completedForms = availableForms.filter(f => isFormAnswered(f.ID_Form));

    const handleOpenForm = async (form) => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_URL}?sheet=Config_Preguntas`);
            const allQuestions = await res.json();
            const filteredQuestions = allQuestions.filter(q => q.ID_Form === form.ID_Form);
            setSelectedForm({ ...form, questions: filteredQuestions });
            setCurrentResponses({}); 
        } catch (e) {
            alert("Error al cargar preguntas");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleInputChange = (questionId, value) => {
        setCurrentResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const cleanOptionText = (text) => {
        return text ? String(text).replace(/\s*\(\d+\)$/, "").trim() : "";
    };

    // --- LÓGICA DE SINCRONIZACIÓN SILENCIOSA Y RÁPIDA ---
    const handleSubmitAnswers = (e) => {
        e.preventDefault();
        
        // 1. Cerramos el modal inmediatamente y marcamos como completado en UI
        const formToSave = { ...selectedForm };
        const responsesToSave = { ...currentResponses };
        
        const completionStamp = { ID_Form: formToSave.ID_Form };
        setUserAnswers(prev => [...prev, completionStamp]);
        setSelectedForm(null);

        // 2. Iniciamos sincronización en segundo plano
        setIsSyncing(true);

        const promises = formToSave.questions.map(q => {
            const answerValue = responsesToSave[q.ID_Pregunta];
            
            let questionPoints = 0;
            if (answerValue !== undefined && answerValue !== null) {
                const scoreMatch = String(answerValue).match(/\((\d+)\)$/);
                if (scoreMatch) {
                    questionPoints = parseFloat(scoreMatch[1]);
                } else if (q.Tipo_Respuesta === "ESCALA") {
                    questionPoints = parseFloat(answerValue || 0);
                } else {
                    questionPoints = parseFloat(q.Puntaje_Asociado || 0);
                }
            }

            const detailedResponse = {
                ID_Respuesta: `RES-${Date.now()}-${q.ID_Pregunta}-${Math.random().toString(36).substr(2, 5)}`,
                Teacher_Key: userData?.Teacher_Key,
                ID_Form: formToSave.ID_Form,
                ID_Pregunta: q.ID_Pregunta,
                Valor_Respondido: cleanOptionText(answerValue),
                Puntos_Ganados: questionPoints,
                Fecha_Respuesta: new Date().toISOString()
            };

            return fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Optimiza la velocidad de envío si no necesitas leer la respuesta inmediata
                body: JSON.stringify({
                    action: 'create',
                    sheet: 'Respuestas_Usuarios',
                    data: detailedResponse
                })
            });
        });

        // 3. Ejecutamos todas las peticiones en paralelo
        Promise.all(promises)
            .then(() => {
                console.log("Sincronización completa");
            })
            .catch(err => {
                console.error("Error en sincronización silenciosa:", err);
            })
            .finally(() => {
                setIsSyncing(false);
            });
    };

    return (
        <div className="atlas-responder-container animate-fade-in">
            <div className="responder-controls-row">
                <div className="tab-container-modern">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        Pendientes <span className="tab-count">{pendingForms.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                        Completados <span className="tab-count">{completedForms.length}</span>
                    </button>
                </div>
                <div className={`sync-status-pill ${isSyncing ? 'syncing' : ''}`}>
                    <span className="sync-icon">{isSyncing ? "🔄" : "☁️"}</span>
                    {isSyncing ? "Sincronizando..." : "Nube Actualizada"}
                </div>
            </div>

            <div className="forms-grid-responder">
                {(activeTab === 'pending' ? pendingForms : completedForms).map(form => (
                    <div key={form.ID_Form} className={`form-card-answerable ${activeTab === 'completed' ? 'card-done' : 'card-pending'}`}>
                        <div className="card-accent" />
                        <span className="phase-badge">{form.Fase_ATLAS}</span>
                        <h3>{form.Titulo_Form}</h3>
                        <p>{form.Descripcion}</p>
                        <div className="card-footer">
                            <span className="pts-tag">{form.Puntos_Maximos} Pts Máx</span>
                            {activeTab === 'pending' ? (
                                <button className="btn-respond" onClick={() => handleOpenForm(form)}>Responder Ahora ✍️</button>
                            ) : (
                                <span className="status-done-pill">✅ Completado</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedForm && (
                <div className="modal-overlay-atlas" onClick={() => setSelectedForm(null)}>
                    <div className="modal-content-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-atlas-header">
                            <div className="header-info">
                                <h2>{selectedForm.Titulo_Form}</h2>
                                <span className="modal-subtitle">Fase {selectedForm.Fase_ATLAS} • Máximo: {selectedForm.Puntos_Maximos} pts</span>
                            </div>
                            <button className="close-btn-circle" onClick={() => setSelectedForm(null)}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmitAnswers} className="modal-atlas-body">
                            {selectedForm.questions.map((q, idx) => (
                                <div key={q.ID_Pregunta} className="question-card-minimal">
                                    <div className="q-number">{idx + 1}</div>
                                    <div className="q-content">
                                        <label className="q-text">{q.Texto_Pregunta}</label>
                                        
                                        {q.Tipo_Respuesta === "MULTIPLE" && (
                                            <div className="options-vertical">
                                                {q.Opciones_Seleccion.split(',').map(opt => {
                                                    const originalValue = opt.trim();
                                                    const cleanLabel = cleanOptionText(originalValue);
                                                    return (
                                                        <label key={opt} className="custom-radio-row">
                                                            <input 
                                                                type="radio" 
                                                                name={q.ID_Pregunta} 
                                                                value={originalValue} 
                                                                required
                                                                onChange={(e) => handleInputChange(q.ID_Pregunta, e.target.value)}
                                                            />
                                                            <span className="radio-label-text">{cleanLabel}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {q.Tipo_Respuesta === "TEXTO" && (
                                            <textarea className="atlas-textarea" placeholder="Escribe tu respuesta aquí..." onChange={(e) => handleInputChange(q.ID_Pregunta, e.target.value)} required />
                                        )}

                                        {q.Tipo_Respuesta === "ESCALA" && (
                                            <div className="atlas-scale-row">
                                                {[1,2,3,4,5].map(num => (
                                                    <button key={num} type="button" className={`scale-pill ${currentResponses[q.ID_Pregunta] == num ? 'active' : ''}`} onClick={() => handleInputChange(q.ID_Pregunta, num)}>{num}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="modal-footer-sticky">
                                <button type="submit" className="btn-submit-atlas">Finalizar y Enviar Respuestas</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};