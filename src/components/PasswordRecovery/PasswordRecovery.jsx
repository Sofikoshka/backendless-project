import React, { useState } from 'react';
import Backendless from "backendless";
import "./PasswordRecovery.css"

function PasswordRecovery() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = event => {
        setEmail(event.target.value);
    };

    const handleRecovery = event => {
        event.preventDefault();

        Backendless.UserService.restorePassword(email)
            .then(response => {
                setMessage("Інструкції щодо відновлення паролю були надіслані на вашу електронну пошту.");
                setError(null);
            })
            .catch(error => {
                setMessage(null);
                setError("Помилка відновлення паролю. Будь ласка, перевірте правильність введеної електронної пошти.");
            });
    };

    return (
        <div className="password-recovery">
            <h2>Відновлення паролю</h2>
            <form onSubmit={handleRecovery} className="password-recovery-form">
                <input type="email" value={email} onChange={handleChange} placeholder="Введіть вашу електронну пошту" required />
                <button type="submit">Надіслати інструкції</button>
            </form>
            {message && <p className="password-recovery-message">{message}</p>}
            {error && <p className="password-recovery-error">{error}</p>}
        </div>
    );
}

export default PasswordRecovery;
