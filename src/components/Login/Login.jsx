import React, { useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import Backendless from "backendless";
import "./Login.css";

function Login() {
    const [formData, setFormData] = useState({
        name: "",
        password: ""
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const logger = Backendless.Logging.getLogger('ua.mbaas.AuthLogger');

    const handleChange = event => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setError(null);

        try {
            const user = await Backendless.UserService.login(formData.name, formData.password, true);
            console.log("Користувач успішно авторизований:", user);
            navigate('/cabinet'); 
        } catch (error) {
            console.error("Помилка під час авторизації користувача:", error.message);
            logger.error(`Помилка авторизації. Логін: ${formData.name}, Пароль: ${formData.password}, Помилка: ${error.message}`);
            setError("Помилка під час авторизації користувача: " + error.message);
        }
    };

    return (
        <div className='login'>
            <form onSubmit={handleSubmit} className='login-form'>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="name" required />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Пароль" required />
                <button type="submit">Увійти</button>
                {error && <p className="error-message">{error}</p>}
                <p className="login-form-p">Не маєте акаунта? <NavLink to="/registration" className="login-form-btn-tologin">Зареєструватися</NavLink></p>
                <NavLink to="/password-recovery" className="login-form-btn-tologin">Я забув пароль</NavLink>
            </form>
        </div>
    );
}

export default Login;
