import React, { useEffect, useState } from 'react';
import Backendless from 'backendless';
import { useNavigate } from "react-router";
import "./Files.css";

const Files = () => {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [user, setUser] = useState(null);
    const [currentFolder, setCurrentFolder] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [shareUsername, setShareUsername] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [fileToShare, setFileToShare] = useState(null);

    useEffect(() => {
        const fetchAndSetUser = () => {
            Backendless.UserService.getCurrentUser()
                .then(currentUser => {
                    if (currentUser) {
                        setUser(currentUser);
                    } else {
                        navigate('/login');
                    }
                })
                .catch(error => {
                    console.error('Помилка отримання поточного користувача:', error);
                    navigate('/login');
                });
        };
        fetchAndSetUser();
    }, [navigate]);

    const showSuccessNotification = (message) => {
        console.log('Success:', message);
    };

    const showErrorNotification = (message) => {
        console.error('Error:', message);
    };

    const refreshFileList = (folderPath) => {
        fetchFiles(folderPath);
    };

    const fetchFiles = (dir) => {
        if (!user) {
            console.warn('Користувач не встановлений. Завантаження файлів скасовано.');
            return;
        }

        const path = `/papki/${user.name || user.objectId}/${dir}`;
        Backendless.Files.listing(path)
            .then(fileListing => {
                const files = fileListing.filter(file => file.name.match(/\./));
                const folders = fileListing.filter(file => !file.name.match(/\./));
                setFiles(files);
                setFolders(folders);
            })
            .catch(error => {
                console.error('Сталася помилка під час завантаження файлів:', error);
            });
    };

    useEffect(() => {
        if (user) {
            fetchFiles(currentFolder);
        }
    }, [currentFolder, user]);

    const createNewFolder = async () => {
        try {
            const path = `/papki/${user.name || user.objectId}/${currentFolder}/${newFolderName}`;
            await Backendless.Files.createDirectory(path);
            fetchFiles(currentFolder);
        } catch (error) {
            console.error('Не вдалося створити папку:', error);
        }
    };

    const uploadFile = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.error('Файл не обраний.');
            return;
        }

        const path = `/papki/${user.name || user.objectId}/${currentFolder}/${file.name}`;
        try {
            await Backendless.Files.upload(file, path);
            fetchFiles(currentFolder);
        } catch (error) {
            console.error('Не вдалося завантажити файл:', error);
            Backendless.Logging.getLogger('FileSaveLogger').error(`Помилка збереження файлу на сервері: ${error.message}`);
        }
    };


    const openDirectory = (dirName) => {
        setCurrentFolder(currentFolder ? `${currentFolder}/${dirName}` : dirName);
    };

    const goBack = () => {
        const currentDirArray = currentFolder.split('/');
        currentDirArray.pop();
        setCurrentFolder(currentDirArray.join('/'));
    };

    const openShareModal = (file) => {
        setIsShareModalOpen(true);
        setFileToShare(file);
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
        setShareUsername('');
        setFileToShare(null);
    };

    const shareFile = async () => {
        if (!fileToShare || !shareUsername) {
            console.error('File or username is not provided');
            return;
        }

        try {
            const whereClause = `name = '${shareUsername}'`;
            const queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);
            const userExists = await Backendless.Data.of("Users").find(queryBuilder);
            if (userExists.length === 0) {
                alert('User does not exist');
                return;
            }
            const pathToSave = `/papki/${shareUsername}/shared`;
            const downloadLink = fileToShare.publicUrl;
            const fileName = fileToShare.name;
            await Backendless.Files.saveFile(pathToSave, fileName, downloadLink, true);
            alert('Файл успішно передано');
        } catch (error) {
            console.error('Failed to share file:', error);
        } finally {
            closeShareModal();
        }
    };

    const deleteFile = (fileName) => {
        const confirmDeletion = window.confirm(`Ви дійсно бажаєте вилучити "${fileName}" назавжди?`);
        if (!confirmDeletion) return;

        const userFolderPath = `${user.name || user.objectId}/${currentFolder}`;
        const filePath = `/papki/${userFolderPath}/${fileName}`;

        Backendless.Files.remove(filePath)
            .then(() => {
                showSuccessNotification(`Файл "${fileName}" був успішно видалений.`);
                refreshFileList(currentFolder);
            })
            .catch(error => {
                console.error('Виникла проблема під час видалення файлу:', error);
                showErrorNotification('Не вдалося видалити файл. Спробуйте ще раз пізніше.');
            });
    };

    const logout = async () => {
        try {
            await Backendless.UserService.logout();
            navigate('/');
            console.log('Користувач вийшов з системи успішно');
        } catch (error) {
            console.error('Помилка виходу з системи:', error);
        }
    };

    const refreshPage = async () => {
        try {
            await fetchFiles(currentFolder);
            console.log('Список файлів оновлено успішно');
        } catch (error) {
            console.error('Помилка оновлення:', error);
        }
    };

    const openSharedFile = async (fileName) => {
        try {
            const filePath = `/user_files/${user.name || user.objectId}/shared_with_me/${fileName}`;
            const fileLink = await Backendless.Files.loadFile(filePath);
            window.open(fileLink);
        } catch (error) {
            console.error('Не вдалося відкрити спільний файл:', error);
        }
    };

    return (
        <div className="file-management">
            <div className="header">
                {user && <h3>Cторінка користувача {user.name} для роботи з файлами</h3>}
                <div className="actions">
                    <button onClick={refreshPage}>Оновити сторінку</button>
                    <button onClick={logout}>Вийти з системи</button>
                </div>
            </div>
            {isShareModalOpen && (
                <div className="modal-form">
                    <span className="close-btn" onClick={closeShareModal}>×</span>
                    <input
                        type="text"
                        id="share-username"
                        name="share-username"
                        value={shareUsername}
                        onChange={e => setShareUsername(e.target.value)}
                        placeholder="Ім'я користувача"
                    />
                    <button onClick={shareFile}>Поділитися</button>
                </div>
            )}
            <div className="form">
                {currentFolder && <button onClick={goBack}>Назад</button>}
                <input
                    type="text"
                    id="new-folder-name"
                    name="new-folder-name"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Ім'я нової папки"
                />
                <button onClick={createNewFolder}>Створити папку</button>
                <input
                    type="file"
                    id="upload-file"
                    name="upload-file"
                    onChange={uploadFile}
                />
            </div>
            <ul className="file-list">
                {folders.map(dir => (
                    <li key={dir.name}>
                        <span>{dir.name}</span>
                        {dir.name !== 'shared' &&
                            <button onClick={() => deleteFile(dir.name)}>Видалити</button>}
                        <button onClick={() => openDirectory(dir.name)}>Відкрити</button>
                    </li>
                ))}
                {files.map(file => (
                    <li key={file.name}>
                        <span>{file.name}</span>
                        <button onClick={() => deleteFile(file.name)}>Видалити</button>
                        <button onClick={() => openShareModal(file)}>Поділитися файлом</button>
                        <a href={file.publicUrl} download>Скачати</a>
                    </li>
                ))}
            </ul>
        </div>
    );
    };
    
    export default Files;