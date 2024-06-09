import React, { useState, useEffect } from 'react';
import Backendless from "backendless";

import "./Cabinet.css";

function Cabinet() {
    const [userData, setUserData] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [locationInterval, setLocationInterval] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        country: '',
        gender: '',
        trackLocation: false,
        myLocation: null
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = await Backendless.UserService.getCurrentUser();
                setUserData(user);
                if (user.avatar) {
                    setAvatarUrl(user.avatar);
                }
                setFormData({
                    email: user.email || '',
                    country: user.country || '',
                    gender: user.gender || '',
                    trackLocation: user.trackLocation || false
                });
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };

        fetchData();
    }, []);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);

        const filePath = `avatars/${userData.objectId}/${file.name}`;
        try {
            const uploadedFile = await Backendless.Files.upload(file, filePath, true);
            const newAvatarUrl = uploadedFile.fileURL;

            const updatedUser = await Backendless.UserService.update({
                ...userData,
                avatar: newAvatarUrl,
            });

            setUserData(updatedUser);
            setAvatarUrl(newAvatarUrl);
        } catch (error) {
            console.error('Помилка завантаження аватара:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        try {
            const updatedUser = await Backendless.UserService.update({
                ...userData,
                email: formData.email,
                country: formData.country,
                gender: formData.gender,
                trackLocation: formData.trackLocation
            });

            setUserData(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Помилка оновлення даних користувача:', error);
        }
    };

    const handleTrackLocationChange = async (event) => {
        const { checked } = event.target;

        try {
            const updatedUser = await Backendless.UserService.update({
                ...userData,
                trackLocation: checked
            });

            setUserData(updatedUser);
            setFormData(prevState => ({
                ...prevState,
                trackLocation: checked
            }));

            if (checked) {
                startLocationUpdates();
            } else {
                stopLocationUpdates();
            }
        } catch (error) {
            console.error('Помилка оновлення налаштувань відстеження місцезнаходження:', error);
        }
    };

    const logger = Backendless.Logging.getLogger('GeoLocationLogger');

const startLocationUpdates = async () => {
    if (navigator.geolocation) {
        const intervalId = setInterval(async () => {
            try {
                const position = await getCurrentPosition();
                const { latitude, longitude } = position.coords;
                const updatedUser = await Backendless.UserService.update({
                    ...userData,
                    myLocation: new Backendless.Data.Point().setLatitude(latitude).setLongitude(longitude)
                });
                console.log('Оновлено місцезнаходження користувача:', updatedUser);
            } catch (error) {
                console.error('Помилка при оновленні локації користувача:', error);
                logger.error('Помилка при оновленні локації користувача:', error);
            }
        }, 60000);

        setLocationInterval(intervalId);
    } else {
        console.error('Geolocation is not supported by this browser.');
        logger.error('Geolocation is not supported by this browser.');
    }
};

    
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    };

    const stopLocationUpdates = () => {
        clearInterval(locationInterval);
    };

    return (
        <div className="cabinet">
            {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="avatar" />
            ) : (
                <p className="no-avatar">Нема аватару</p>
            )}
            <div className="file-upload">
                <label htmlFor="avatar-upload" className="upload-label">
                    {isUploading ? 'Завантаження...' : 'Змінити аватар'}
                </label>
                <input 
                    type="file" 
                    id="avatar-upload" 
                    onChange={handleFileChange} 
                    disabled={isUploading}
                />
            </div>
            {userData ? (
                <div className='cabinet-form'>
                    <h2>Особистий кабінет</h2>

                    {isEditing ? (
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Електронна пошта:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Країна:</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Стать:</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                                    <option value="male">Чоловіча</option>
                                    <option value="female">Жіноча</option>
                                    <option value="other">Інша</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="trackLocation"
                                        checked={formData.trackLocation}
                                        onChange={handleTrackLocationChange}
                                    />
                                    Відслідковувати моє місце розташування
                                </label>
                            </div>
                            <button type="submit" className="save-button">Зберегти</button>
                            <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Відмінити</button>
                        </form>
                    ) : (
                        <div>
                            <p>Ім'я: {userData.name}</p>
                            
                            <p>Електронна пошта: {userData.email}</p>
                            <p>Країна: {userData.country}</p>
                            <p>Стать: {userData.gender}</p>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="trackLocation"
                                        checked={formData.trackLocation}
                                        onChange={handleTrackLocationChange}
                                    />
                                    Відслідковувати моє місце розташування
                                </label>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="edit-button">Редагувати</button>
                        </div>
                    )}
                </div>
            ) : (
                <p>Завантаження...</p>
            )}
        </div>
    );
}

export default Cabinet;
