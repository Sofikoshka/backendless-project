import React, { useState, useEffect, useRef } from 'react';
import Backendless from "backendless";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-shadow.png";
import "./myPlaces.css";
import pointerIcon from './../../pointer.png';

const customIcon = new L.Icon({
    iconUrl: pointerIcon,
    iconSize: [32, 32], 
    iconAnchor: [16, 32], 
    popupAnchor: [0, -32], 
});

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
    iconUrl: require('leaflet/dist/images/marker-icon.png').default,
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default
});

function LocationPicker({ location, setLocation }) {
    useMapEvents({
        click(e) {
            const latlng = e.latlng;
            const point = { lat: latlng.lat, lng: latlng.lng };
            setLocation(point);
        }
    });

    return location === null ? null : (
        <Marker position={location} icon={customIcon}></Marker>
    );
}

function MyPlaces() {
    const [myPlaces, setMyPlaces] = useState([]);
    const [newPlaceData, setNewPlaceData] = useState({
        name: '',
        location: { lat: 51.505, lng: -0.09 },
        description: '',
        category: '',
        hashtag: '',
        photoURL: '',
        createdAt: new Date()
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchRadius, setSearchRadius] = useState(1000); 
    const [userLocation, setUserLocation] = useState(null);

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const mapRef = useRef(null);
    const [searchResults, setSearchResults] = useState([]); 

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchCategories();
        loadPlaces();
        fetchCurrentUser();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            });
        }
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const user = await Backendless.UserService.getCurrentUser(true);
            setCurrentUser(user);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const allPlaces = await Backendless.Data.of('Places').find();
            const uniqueCategories = [...new Set(allPlaces.map(place => place.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Failed to fetch unique categories:', error);
        }
    };

    const handleMapMoveEnd = (e) => {
        const latlng = e.target.getCenter();
        console.log('Map center:', latlng);
    };

    const loadPlaces = async () => {
        try {
            const currentUser = await Backendless.UserService.getCurrentUser(true);
            const objectId = currentUser.objectId;
            const queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(`ownerId = '${objectId}'`);
            const userPlaces = await Backendless.Data.of('Places').find(queryBuilder);

            const placesWithLikes = await Promise.all(userPlaces.map(async place => {
                const likesQuery = Backendless.DataQueryBuilder.create().setWhereClause(`placeId = '${place.objectId}'`);
                const likes = await Backendless.Data.of('Likes').find(likesQuery);
                return { ...place, likes, isLiked: likes.some(like => like.userId === currentUser.objectId) };
            }));
    
            setMyPlaces(placesWithLikes);
        } catch (error) {
            console.error('Failed to fetch places:', error);
        }
    };
    
    const uploadPhotoIfNeeded = async (placeData) => {
        if (placeData.photoURL) {
            try {
                const file = placeData.photoURL;
                const fileName = `${new Date().getTime()}_${file.name}`;
                const result = await Backendless.Files.upload(file, 'places_photos', true, fileName);
                placeData.photoURL = result.fileURL;
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
        }
        return placeData;
    };

    const handlePhotoChange = (event) => {
        setNewPlaceData({ ...newPlaceData, photoURL: event.target.files[0] });
    };

    const addPlace = async () => {
        try {
            const newPlaceDataWithPhotoURL = await uploadPhotoIfNeeded(newPlaceData);
            const newPlace = await Backendless.Data.of('Places').save(newPlaceDataWithPhotoURL);
            setNewPlaceData({
                name: '',
                location: { lat: 51.505, lng: -0.09 },
                description: '',
                category: '',
                hashtag: '',
                photoURL: null,
            });
            loadPlaces();
        } catch (error) {
            console.error('Error adding new place:', error);
        }
    };

    const deletePlace = async (placeId) => {
        try {
            const place = await Backendless.Data.of('Places').findById(placeId);
            if (place.ownerId === currentUser.objectId) {
                await Backendless.Data.of('Places').remove(placeId);
                loadPlaces();
            } else {
                alert('You can only delete your own places.');
            }
        } catch (error) {
            alert('You can only delete your own places.');
            console.error('Error deleting place:', error);
        }
    };

    const openModal = (place) => {
        setSelectedPlace(place);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedPlace(null);
        setIsModalOpen(false);
    };

    const searchPlace = async (query, radius) => {
        try {
            let whereClause = '';

            if (query.trim() !== '') {
                whereClause = `name LIKE '%${query}%' OR category LIKE '%${query}%'`;
            }

            const queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);

            if (radius && userLocation) {
                const radiusInMeters = parseFloat(radius);
                queryBuilder.setRadiusSearch(userLocation.latitude, userLocation.longitude, radiusInMeters);
            }

            const searchResults = await Backendless.Data.of('Places').find(queryBuilder);
            setSearchResults(searchResults); 
        } catch (error) {
            console.error('Error searching for places:', error);
        }
    };

    const toggleLike = async (place, currentUser) => {
        console.log(place.objectId, currentUser.objectId);
        try {
            const likesQueryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`placeId = '${place.objectId}' AND userId = '${currentUser.objectId}'`);
            const existingLikes = await Backendless.Data.of('Likes').find(likesQueryBuilder);
           
            if (existingLikes.length === 0) {
                const like = {
                    placeId: place.objectId,
                    userId: currentUser.objectId,
                };
                
                const savedLike = await Backendless.Data.of('Likes').save(like);
                await Backendless.Data.of('Likes').setRelation(savedLike, 'placeId', [place.objectId]);
                await Backendless.Data.of('Likes').setRelation(savedLike, 'userId', [currentUser.objectId]);
    
                place.totalLikes = (place.totalLikes || 0) + 1;
                place.isLiked = true;
               
            } else {
                await Backendless.Data.of('Likes').remove(existingLikes[0]);
                place.totalLikes = (place.totalLikes || 0) - 1;
                place.isLiked = false;
            }
           
            setMyPlaces([...myPlaces]);
        } catch (error) {
            
            console.error('Error liking/unliking place:', error);
        }
    };

    return (
        <div className="my-places">
            <h1>My Places</h1>
            <div className="add-place">
                <h2>Add a New Place</h2>
                <input
                    type="text"
                    placeholder="Name"
                    value={newPlaceData.name}
                    onChange={(e) => setNewPlaceData({ ...newPlaceData, name: e.target.value })}
                />
                <textarea
                    placeholder="Description"
                    value={newPlaceData.description}
                    onChange={(e) => setNewPlaceData({ ...newPlaceData, description: e.target.value })}
                />
                <select
                    className="form-control"
                    name="category"
                    value={newPlaceData.category}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'new') {
                            setIsCustomCategory(true);
                            setNewPlaceData(prevData => ({ ...prevData, category: '' }));
                        } else {
                            setIsCustomCategory(false);
                            setNewPlaceData(prevData => ({ ...prevData, category: value }));
                        }
                    }}
                >
                    <option value="">Choose category</option>
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="new">Add new category</option>
                </select>
                {isCustomCategory && (
                    <input
                        type="text"
                        className="form-control"
                        name="category"
                        value={newPlaceData.category}
                        onChange={(e) => setNewPlaceData({ ...newPlaceData, category: e.target.value })}
                        placeholder="New Category"
                    />
                )}
                <input
                    type="text"
                    placeholder="Hashtag"
                    value={newPlaceData.hashtag}
                    onChange={(e) => setNewPlaceData({ ...newPlaceData, hashtag: e.target.value })}
                />
                <input
                    type="file"
                    onChange={handlePhotoChange}
                />
                <button onClick={addPlace}>Add Place</button>
                <MapContainer
                    ref={mapRef}
                    className={isModalOpen ? 'map-blur' : ''}
                    center={[51.505, -0.09]}
                    zoom={13}
                    style={{ width: '100%', height: '400px' }}
                    onMoveend={handleMapMoveEnd}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationPicker
                        location={newPlaceData.location}
                        setLocation={(location) => setNewPlaceData({ ...newPlaceData, location })}
                    />
                </MapContainer>
            </div>

            <div className="search-place">
                <h2>Search Places</h2>
                <input
                    type="text"
                    placeholder="Search by name or category"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Search radius in meters"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(e.target.value)}
                />
                <button onClick={() => searchPlace(searchQuery, searchRadius)}>Search</button>
            </div>
            <div className="places-list">
                <h2>Search Results</h2>
                {searchResults.length === 0 ? (
                    <p>No search results found</p>
                ) : (
                    <ul>
                        {searchResults.map((place) => (
                            <li key={place.objectId}>
                                <h3>{place.name}</h3>
                                <p>{place.description}</p>
                                <p>Category: {place.category}</p>
                                <p>Hashtag: {place.hashtag}</p>
                                {place.photoURL && <img src={place.photoURL} alt={place.name} />}
                                <button className='places-list-button' onClick={() => openModal(place)}>View on Map</button>
                                <button className='places-list-button' onClick={() => deletePlace(place.objectId)}>Delete</button>
                                <button 
    className="btn btn-sm btn-light me-2"
    onClick={() => toggleLike(place, currentUser)}
>
    {place?.isLiked ? (
        <span style={{ color: 'red' }}>
            <i className="fa-solid fa-heart me-1" style={{ color: 'red' }}></i>
           
        </span>
    ) : (
        <span style={{ color: 'red' }}>
            <i className="fa-regular fa-heart me-1" style={{ color: 'red' }}></i>
           
        </span>
    )}
</button>


                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="places-list">
                <h2>My Places List</h2>
                {myPlaces.length === 0 ? (
                    <p>No places available</p>
                ) : (
                    <ul>
                        {myPlaces.map((place) => (
                            <li key={place.objectId}>
                                <h3>{place.name}</h3>
                                <p>{place.description}</p>
                                <p>Category: {place.category}</p>
                                <p>Hashtag: {place.hashtag}</p>
                                {place.photoURL && <img src={place.photoURL} alt={place.name} />}
                                <button className='places-list-button' onClick={() => openModal(place)}>View on Map</button>
                                <button className='places-list-button' onClick={() => deletePlace(place.objectId)}>Delete</button>
                                
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isModalOpen && selectedPlace && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>{selectedPlace.name}</h2>
                        <p>{selectedPlace.description}</p>
                        <MapContainer 
                            center={[selectedPlace.location.lat, selectedPlace.location.lng]} 
                            zoom={13} 
                            style={{ width: '100%', height: '400px' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[selectedPlace.location.lat, selectedPlace.location.lng]} icon={customIcon} />
                        </MapContainer>
                    </div>
                </div>
            )}

        </div>
    );
}

export default MyPlaces;
