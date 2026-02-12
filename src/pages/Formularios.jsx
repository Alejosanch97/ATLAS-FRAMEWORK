import React, { useState, useEffect, useRef, useMemo } from "react";
import "../Styles/formularios.css";

export const Formularios = ({ userData, isSyncing, setIsSyncing, API_URL }) => {
    const questionsRef = useRef(null);

    // --- ESTADOS ---
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const [formsList, setFormsList] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        ID_Form: `FORM-${Date.now()}`,
        Titulo_Form: "",
        Descripcion: "",
        Fase_ATLAS: "A",
        Puntos_Maximos: 100,
        Teacher_Key: userData?.Teacher_Key
    };

    const [formConfig, setFormConfig] = useState(initialFormState);
    const [preguntas, setPreguntas] = useState([
        { idTemp: Date.now(), Bloque: "", Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }
    ]);

    // --- LÓGICA DE VALIDACIÓN DE PUNTAJE ---
    const totalPuntosActuales = useMemo(() => {
        return preguntas.reduce((sum, p) => sum + parseFloat(p.Puntaje_Asociado || 0), 0);
    }, [preguntas]);

    const statusPuntaje = useMemo(() => {
        const totalMeta = parseFloat(formConfig.Puntos_Maximos) || 0;
        const actual = parseFloat(totalPuntosActuales.toFixed(2));
        
        if (actual < totalMeta) {
            return { color: "#f59e0b", msg: `Faltan ${(totalMeta - actual).toFixed(2)} pts` };
        } else if (actual > totalMeta) {
            return { color: "#ef4444", msg: `Excedido por ${(actual - totalMeta).toFixed(2)} pts` };
        }
        return { color: "#10b981", msg: "Puntaje perfecto" };
    }, [totalPuntosActuales, formConfig.Puntos_Maximos]);

    // --- CARGAR LISTA AL INICIAR ---
    const fetchForms = async () => {
        setIsSyncing(true); // Mostrar nube al cargar lista
        try {
            const res = await fetch(`${API_URL}?sheet=Config_Formularios&user_key=${userData?.Teacher_Key}`);
            const data = await res.json();
            if (Array.isArray(data)) setFormsList(data);
        } catch (e) { 
            console.error("Error al cargar lista:", e); 
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => { fetchForms(); }, []);

    // --- LÓGICA DE EDICIÓN ---
    const handleEditForm = async (form) => {
        setIsEditing(true);
        setFormConfig({
            ID_Form: form.ID_Form,
            Titulo_Form: form.Titulo_Form,
            Descripcion: form.Descripcion,
            Fase_ATLAS: form.Fase_ATLAS,
            Puntos_Maximos: form.Puntos_Maximos,
            Teacher_Key: form.Teacher_Key
        });
        
        setIsConfigOpen(true);
        setIsQuestionsOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        setIsSyncing(true); // Mostrar nube mientras bajan las preguntas
        try {
            const res = await fetch(`${API_URL}?sheet=Config_Preguntas`);
            const allQuestions = await res.json();
            const filtered = allQuestions.filter(q => q.ID_Form === form.ID_Form);
            
            if(filtered.length > 0) {
                setPreguntas(filtered.map(q => ({
                    idTemp: q.ID_Pregunta || (Date.now() + Math.random()),
                    Bloque: q.Bloque || "",
                    Texto_Pregunta: q.Texto_Pregunta,
                    Tipo_Respuesta: q.Tipo_Respuesta,
                    Opciones_Seleccion: q.Opciones_Seleccion || "",
                    Puntaje_Asociado: q.Puntaje_Asociado
                })));
            }
        } catch (e) { 
            console.error("Error cargando preguntas"); 
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteForm = async (id) => {
        const confirmFirst = window.confirm("¿Eliminar este instrumento y todas sus preguntas?");
        if (!confirmFirst) return;
        const confirmSecond = window.confirm("¡ADVERTENCIA! Se pueden perder datos asociados. ¿Desea continuar?");
        if (!confirmSecond) return;

        const backup = [...formsList];
        setFormsList(formsList.filter(f => f.ID_Form !== id));

        setIsSyncing(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete_instrumento', idValue: id })
            });
        } catch (e) {
            setFormsList(backup);
            alert("Error al borrar.");
        } finally {
            setIsSyncing(false);
            fetchForms();
        }
    };

    const handleAddPregunta = () => {
        setPreguntas([...preguntas, { 
            idTemp: Date.now() + Math.random(), 
            Bloque: "",
            Texto_Pregunta: "", 
            Tipo_Respuesta: "MULTIPLE", 
            Opciones_Seleccion: "", 
            Puntaje_Asociado: 0 
        }]);
    };

    const handleRemovePregunta = (id) => {
        if(preguntas.length > 1) setPreguntas(preguntas.filter(p => p.idTemp !== id));
    };

    const updatePregunta = (id, field, value) => {
        setPreguntas(preguntas.map(p => p.idTemp === id ? { ...p, [field]: value } : p));
    };

    const getPlaceholderByTipo = (tipo) => {
        switch(tipo) {
            case "MULTIPLE": return "Ej: Sí(2), No(1.5), No estoy seguro(1)";
            case "CHECKBOX": return "Ej: Planificación(0.7), Evaluación(0.7), Ninguno(1)";
            case "ESCALA": return "Ej: 1(0.5), 2(1.0), 3(1.5), 4(2.0), 5(2.5)";
            default: return "Escribe las opciones separadas por comas...";
        }
    };

    const handleSubmitInstrumento = async (e) => {
        e.preventDefault();
        if (totalPuntosActuales !== parseFloat(formConfig.Puntos_Maximos)) {
            const proceed = window.confirm(`El puntaje total (${totalPuntosActuales}) no coincide con el máximo (${formConfig.Puntos_Maximos}). ¿Deseas guardar de todos modos?`);
            if (!proceed) return;
        }
        setIsSyncing(true);
        const payload = {
            action: isEditing ? 'update_instrumento' : 'create_instrumento',
            form: { ...formConfig, Teacher_Key: userData?.Teacher_Key },
            questions: preguntas
        };
        try {
            await fetch(API_URL, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
            setIsEditing(false);
            setIsConfigOpen(false);
            setIsQuestionsOpen(false);
            setFormConfig({ ...initialFormState, ID_Form: `FORM-${Date.now()}` });
            setPreguntas([{ idTemp: Date.now(), Bloque: "", Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }]);
        } catch (error) {
            alert("Error al guardar.");
        } finally {
            setIsSyncing(false);
            fetchForms();
        }
    };

    return (
        <div className="atlas-architect-container animate-fade-in">
            
            {/* INDICADOR DE SINCRONIZACIÓN (LA NUBE) */}
            {isSyncing && (
                <div className="sync-overlay-status">
                    <div className="sync-pill">
                    </div>
                </div>
            )}

            {/* BOTÓN SUPERIOR DE CREACIÓN */}
            {!isEditing && !isConfigOpen && (
                <button className="btn-publish-main btn-create-top" onClick={() => setIsConfigOpen(true)}>
                    ➕ Crear Nuevo Instrumento
                </button>
            )}

            <form onSubmit={handleSubmitInstrumento} className="architect-layout-grid">
                {/* PASO 1: CONFIGURACIÓN */}
                <section className={`info-card-modern ${isConfigOpen ? 'is-open' : ''}`}>
                    <div className="card-header-minimal" onClick={() => setIsConfigOpen(!isConfigOpen)}>
                        <div className="header-left-group">
                            <span className="step-badge">1</span>
                            <h3 className="header-title-main">
                                {isEditing ? "Editando: " + formConfig.Titulo_Form : "Configuración Base"}
                            </h3>
                        </div>
                        
                        <div className="header-right-controls">
                            <div className="header-alert-badge" style={{ color: statusPuntaje.color }}>
                                <span>{statusPuntaje.msg}</span>
                            </div>
                            <span className="toggle-icon">{isConfigOpen ? "▲" : "▼"}</span>
                        </div>
                    </div>
                    
                    {isConfigOpen && (
                        <div className="input-stack animate-slide-down">
                            <div className="group-modern">
                                <label>Título del Instrumento</label>
                                <input 
                                    type="text" 
                                    placeholder="Nombre del formulario..." 
                                    value={formConfig.Titulo_Form}
                                    onChange={(e) => setFormConfig({...formConfig, Titulo_Form: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="row-split">
                                <div className="group-modern">
                                    <label>Fase ATLAS</label>
                                    <select
                                        value={formConfig.Fase_ATLAS}
                                        onChange={(e) => setFormConfig({ ...formConfig, Fase_ATLAS: e.target.value })}
                                    >
                                        <option value="A">A - Auditar</option>
                                        <option value="AE">AE - Academia Evaluación (Módulos)</option> {/* Nueva opción */}
                                        <option value="T">T - Transformar</option>
                                        <option value="L">L - Liderar</option>
                                    </select>
                                </div>
                                <div className="group-modern">
                                    <label>Puntos Máximos</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={formConfig.Puntos_Maximos}
                                        onChange={(e) => setFormConfig({...formConfig, Puntos_Maximos: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="group-modern">
                                <label>Instrucciones</label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Define el objetivo..."
                                    value={formConfig.Descripcion}
                                    onChange={(e) => setFormConfig({...formConfig, Descripcion: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* PASO 2: PREGUNTAS */}
                <section className={`info-card-modern ${isQuestionsOpen ? 'is-open' : ''}`} ref={questionsRef}>
                    <div className="card-header-flex-modern" onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}>
                        <div className="header-left-group">
                            <span className="step-badge">2</span>
                            <h3>Diseño de Preguntas</h3>
                        </div>
                        
                        <div className="header-right-controls">
                            <button type="button" className="btn-add-pill" onClick={(e) => {e.stopPropagation(); handleAddPregunta();}}>
                                ➕ Añadir Pregunta
                            </button>
                            <span className="toggle-icon">{isQuestionsOpen ? "▲" : "▼"}</span>
                        </div>
                    </div>

                    {isQuestionsOpen && (
                        <div className="questions-list-container animate-slide-down">
                            {preguntas.map((pregunta, index) => (
                                <div key={pregunta.idTemp} className="question-builder-card">
                                    <div className="q-number-side">{index + 1}</div>
                                    <div className="q-main-fields">
                                        <div className="q-inputs-row">
                                            <input 
                                                type="text"
                                                className="q-block-input"
                                                placeholder="Bloque"
                                                value={pregunta.Bloque}
                                                onChange={(e) => updatePregunta(pregunta.idTemp, 'Bloque', e.target.value)}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Escribe la pregunta..." 
                                                className="q-input-text-large"
                                                value={pregunta.Texto_Pregunta}
                                                onChange={(e) => updatePregunta(pregunta.idTemp, 'Texto_Pregunta', e.target.value)}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="q-controls-row">
                                            <div className="control-item">
                                                <label>Tipo:</label>
                                                <select 
                                                    value={pregunta.Tipo_Respuesta}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Tipo_Respuesta', e.target.value)}
                                                >
                                                    <option value="MULTIPLE">Opción Múltiple</option>
                                                    <option value="CHECKBOX">Casillas</option>
                                                    <option value="ESCALA">Escala (1-5)</option>
                                                    <option value="TEXTO">Respuesta Corta</option>
                                                    <option value="PARRAFO">Párrafo</option>
                                                </select>
                                            </div>
                                            <div className="control-item">
                                                <label>Pts:</label>
                                                <input 
                                                    type="number" 
                                                    step="0.1"
                                                    className="q-pts-mini"
                                                    value={pregunta.Puntaje_Asociado}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Puntaje_Asociado', e.target.value)}
                                                />
                                            </div>
                                            <button type="button" className="btn-delete-q" onClick={() => handleRemovePregunta(pregunta.idTemp)}>🗑️</button>
                                        </div>

                                        {["MULTIPLE", "CHECKBOX", "ESCALA"].includes(pregunta.Tipo_Respuesta) && (
                                            <div className="options-zone animate-fade-in">
                                                <input 
                                                    type="text"
                                                    className="q-options-field"
                                                    placeholder={getPlaceholderByTipo(pregunta.Tipo_Respuesta)}
                                                    value={pregunta.Opciones_Seleccion}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Opciones_Seleccion', e.target.value)}
                                                />
                                                <small>Usa el formato: <strong>Respuesta(Valor)</strong> separado por comas.</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="architect-footer-zone">
                                <button type="submit" className="btn-publish-main" disabled={isSyncing}>
                                    {isSyncing ? "💾 Sincronizando..." : isEditing ? "🔄 Actualizar Instrumento" : "🚀 Publicar Instrumento"}
                                </button>
                                {isEditing && (
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setIsEditing(false); 
                                        setIsConfigOpen(false);
                                        setIsQuestionsOpen(false);
                                        setFormConfig({ ...initialFormState, ID_Form: `FORM-${Date.now()}` });
                                        setPreguntas([{ idTemp: Date.now(), Bloque: "", Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }]);
                                    }}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </form>

            {/* LISTADO DE INSTRUMENTOS */}
            <section className="info-card-modern list-area">
                <div className="card-header-minimal">
                    <div className="header-left-group">
                        <h3>Mis Instrumentos Creados</h3>
                        {/* Opcional: Un contador para saber cuántos hay en total */}
                        <span className="count-badge">{formsList.length}</span>
                    </div>
                </div>
                <div className="forms-grid">
                    {formsList.length > 0 ? formsList.map((f) => (
                        <div key={f.ID_Form} className="form-item-card animate-fade-in">
                            <div className="form-info">
                                {/* Clase dinámica: pill-a, pill-ae, pill-t, etc. */}
                                <span className={`phase-pill pill-${f.Fase_ATLAS.toLowerCase()}`}>
                                    {f.Fase_ATLAS === "AE" ? "Academia" : f.Fase_ATLAS}
                                </span>
                                <h4>{f.Titulo_Form}</h4>
                                <small>{f.Puntos_Maximos} pts</small>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-edit-small" onClick={() => handleEditForm(f)} title="Editar">✏️</button>
                                <button type="button" className="btn-delete-small" onClick={() => handleDeleteForm(f.ID_Form)} title="Eliminar">🗑️</button>
                            </div>
                        </div>
                    )) : <p className="empty-msg">No has creado instrumentos todavía.</p>}
                </div>
            </section>
        </div>
    );
};