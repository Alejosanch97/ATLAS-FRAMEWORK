import React, { useState } from "react";
import "../Styles/home.css"; 
import { useNavigate } from "react-router-dom";

const API_URL = 'https://script.google.com/macros/s/AKfycbxcqIbNhC3H7za-GsBF9iuTU___o8OBCF8URGNxwdQm5q8pUd1vpgthbYyrBRkGXJ5Y8Q/exec';

export const Home = ({ onLoginSuccess }) => {
    // Aseguramos que los nombres coincidan con los que el script espera
    const [credentials, setCredentials] = useState({ user_key: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(""); // Limpia el error mientras el usuario escribe
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); 

        try {
            // Llamada al Backend ATLAS
            const response = await fetch(API_URL, {
                method: 'POST',
                // Importante: No usar mode: 'no-cors' para poder leer la respuesta JSON
                body: JSON.stringify({
                    action: 'login',
                    user_key: credentials.user_key,
                    password: credentials.pass,
                    sheet: "Users_ATLAS" // Indicamos la tabla de usuarios
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // 1. Guardamos la sesión completa (incluyendo Huella_IA y Rol)
                localStorage.setItem("userATLAS", JSON.stringify(result));
                
                // 2. Notificamos al estado global si es necesario
                if (onLoginSuccess) onLoginSuccess(result);
                
                // 3. ¡Redirección inmediata al Dashboard!
                navigate("/dashboard"); 
            } else {
                // El mensaje viene del Apps Script (ej: "Teacher Key o Password incorrectos")
                setError(result.message || "Credenciales inválidas.");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Error de conexión con el servidor ATLAS.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="atlas-main-container">
            <div className="atlas-card-glass">
                {/* Lado Visual: Identidad ATLAS */}
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

                {/* Lado Formulario: Acceso */}
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
                                <input 
                                    type="text" 
                                    name="user_key"
                                    placeholder="Ingresa tu clave"
                                    value={credentials.user_key}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            
                            <div className="input-field">
                                <label>Contraseña</label>
                                <input 
                                    type="password" 
                                    name="pass"
                                    placeholder="••••••••"
                                    value={credentials.pass}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && (
                                <div className="error-badge">
                                    <span className="error-icon">⚠️</span> {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={`btn-atlas-grad ${loading ? 'loading' : ''}`} 
                                disabled={loading}
                            >
                                {loading ? "Verificando..." : "Acceder al Portal"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};