import React, { useEffect, useState } from 'react';
import Backendless from 'backendless';
import './DeveloperFeedback.css'; 

const DeveloperFeedback = () => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('');
    
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const currentUser = await Backendless.UserService.getCurrentUser(true);
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    };

    const handleSubmit = async () => {
        if (!message.trim() || !type) {
            alert('Будь ласка, введіть повідомлення та виберіть тип.');
            return;
        }
    
        const feedbackData = {
            message,
            type,
            user: user?.name,
            userEmail: user?.email,
        };
    
        try {
          
            await Backendless.Data.of('Feedback').save(feedbackData);
    
           
            const emailBody = `
            <p><strong>Категорія:</strong> ${type}</p>
            <p><strong>Повідомлення:</strong> ${message}</p>
            <p><strong>Відправник:</strong> ${user?.name} (${user?.email})</p>
        `;
        const bodyParts = new Backendless.Bodyparts({
            textmessage: `Категорія: ${type}
        
        Повідомлення:
        ${message}
        
        Відправник: ${user?.name} (${user?.email})`,
            htmlmessage: emailBody
        });
        
        await Backendless.Messaging.sendEmail(
            `Нове звернення категорії "${type}" від ${user?.name}`,
            bodyParts,
            ['sofiakolokolcheva@gmail.com']
        );
    
           alert('Фідбек відправлений');
        } catch (error) {
            console.error('Помилка при відправленні зворотнього зв\'язку:', error);
            alert('Сталася помилка. Будь ласка, спробуйте ще раз.');
        }
    };
    
    return (
        <div className="feedback-container"> 
           
                <div>
                    <div className="d-flex justify-content-between mb-3">
                       
                        <h2 className="feedback-heading">Відправити відгук</h2> 
                    </div>
            
                    <div className="form-group">
                       
                        <textarea
                            id="message"
                            className="form-textarea" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Введіть ваш відгук..."
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">Тип:</label>
                        <select
                            id="type"
                            className="custom-select" 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            
                            <option value="помилка">Помилка</option>
                            <option value="порада">Порада</option>
                        </select>
                    </div>
                    <button className="submit-btn" onClick={handleSubmit}> 
                        Відправити
                    </button>
                </div>
            
        </div>
    );
};

export default DeveloperFeedback;
