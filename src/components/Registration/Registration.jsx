import React, { useState } from 'react';
import Backendless from "backendless";
import { NavLink } from "react-router-dom"; 
import { useNavigate } from 'react-router';
import "./Registration.css";

function Registration() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        age: "",
        gender: "",
        country: ""
    });

    const navigate = useNavigate();

    const handleChange = event => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleRegistration = async (event) => {
        event.preventDefault();

        try {
            const ageAsNumber = parseInt(formData.age, 10);
            const user = await Backendless.UserService.register({
                ...formData,
                age: ageAsNumber 
            });
            
            console.log("Користувач зареєстрований успішно:", user);
            
            const { objectId, name } = user;

            const userFolderPath = `/papki/${name}`;
            const placeholderFileName = "placeholder.txt";
            const placeholderFileContent = "This is a placeholder file.";
            
            await Backendless.Files.saveFile(userFolderPath, placeholderFileName, placeholderFileContent, true);

            console.log("Папка для користувача створена успішно:", name);

            const sharedWithMeFolderPath = `/papki/${name}/shared`;
            
            await Backendless.Files.saveFile(sharedWithMeFolderPath, placeholderFileName, placeholderFileContent, true);

            console.log("Створена папка з назвою shared для юзера успішно:", name);

            navigate('/cabinet');
        } catch (error) {
            console.error("Помилка під час реєстрації користувача:", error);
        }
    };

    const handleSubmit = event => {
        handleRegistration(event);
    };

    return (
        <div className='registration'>
            <form onSubmit={handleSubmit} className='registration-form'>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Електронна пошта" required />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Пароль" required />
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ім'я" required />
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Вік" required />
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Оберіть стать</option>
                    <option value="male">Чоловіча</option>
                    <option value="female">Жіноча</option>
                    <option value="other">Інша</option>
                </select>
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Країна" required />
                <button type="submit">Зареєструватися</button>
                <p className="registration-form-p">Вже маєте акаунт? <NavLink to="/login" className="registration-form-btn-tologin">Увійти</NavLink></p>
            </form>
        </div>
    );
}

export default Registration;
