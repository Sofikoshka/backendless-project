import React, { useState, useEffect } from 'react';
import Backendless from "backendless";
import './myFriends.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import pointerIcon from './../../pointer.png';


const friendIcon = new L.Icon({
    iconUrl: pointerIcon, 
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MyFriends() {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [locationSearchRadius, setLocationSearchRadius] = useState(10); 
    const [locationSearchResults, setLocationSearchResults] = useState([]);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadFriends();
            loadFriendRequests();
        }
    }, [currentUser]);

    const fetchCurrentUser = async () => {
        try {
            const user = await Backendless.UserService.getCurrentUser(true);
            setCurrentUser(user);
            console.log(user);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    };

    const loadFriends = async () => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`(userId1 = '${currentUser.objectId}' OR userId2 = '${currentUser.objectId}') AND request = 'accept'`);
            const friendRelations = await Backendless.Data.of('Friends').find(queryBuilder);
    
            const friendIds = friendRelations.map(relation => relation.userId1 === currentUser.objectId ? relation.userId2 : relation.userId1);
            const query = Backendless.DataQueryBuilder.create()
                .setWhereClause(`objectId IN ('${friendIds.join("','")}')`);
            const friendsList = await Backendless.Data.of('Users').find(query);
            setFriends(friendsList);
    
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };
    
    const loadFriendRequests = async () => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`userId2 = '${currentUser.objectId}' AND request = 'waiting'`);
            const requestRelations = await Backendless.Data.of('Friends').find(queryBuilder);
    
            const requestIds = requestRelations.map(relation => relation.userId1);
            const query = Backendless.DataQueryBuilder.create()
                .setWhereClause(`objectId IN ('${requestIds.join("','")}')`);
            const requestsList = await Backendless.Data.of('Users').find(query);
            setFriendRequests(requestsList);
            
        } catch (error) {
            console.error('Failed to load friend requests:', error);
        }
    };

    const searchUsers = async () => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`(name LIKE '%${searchQuery}%' OR email LIKE '%${searchQuery}%') AND objectId != '${currentUser.objectId}'`);
            const users = await Backendless.Data.of('Users').find(queryBuilder);
            setSearchResults(users);
        } catch (error) {
            console.error('Error searching for users:', error);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`userId1 = '${currentUser.objectId}' AND userId2 = '${userId}'`);
            const existingRequest = await Backendless.Data.of('Friends').find(queryBuilder);
    
            if (existingRequest.length === 0) {
                const newRequest = {
                    userId1: currentUser.objectId,
                    userId2: userId,
                    request: 'waiting',
                };
                await Backendless.Data.of('Friends').save(newRequest);
                loadFriendRequests();
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };
    
    const acceptFriendRequest = async (userId) => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`userId1 = '${userId}' AND userId2 = '${currentUser.objectId}' AND request = 'waiting'`);
            const friendRequest = await Backendless.Data.of('Friends').find(queryBuilder);
    
            if (friendRequest.length > 0) {
                friendRequest[0].request = 'accept';
                await Backendless.Data.of('Friends').save(friendRequest[0]);
    
                loadFriends();
                loadFriendRequests();
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };
    
    const declineFriendRequest = async (userId) => {
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`userId1 = '${userId}' AND userId2 = '${currentUser.objectId}' AND request = 'waiting'`);
            const friendRequest = await Backendless.Data.of('Friends').find(queryBuilder);
    
            if (friendRequest.length > 0) {
                await Backendless.Data.of('Friends').remove(friendRequest[0].objectId);
                loadFriendRequests();
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };
    
    const removeFriend = async (userId) => {
        const confirmation = window.confirm("Are you sure you want to remove this friend?");
        if (!confirmation) {
            return;
        }
    
        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`(userId1 = '${currentUser.objectId}' AND userId2 = '${userId}') OR (userId1 = '${userId}' AND userId2 = '${currentUser.objectId}')`);
            const friendRelation = await Backendless.Data.of('Friends').find(queryBuilder);
    
            if (friendRelation.length > 0) {
                await Backendless.Data.of('Friends').remove(friendRelation[0].objectId);
                window.alert("Friend has been removed successfully.");
                loadFriends(); 
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            window.alert("Failed to remove friend. Please try again later.");
        }
    };

    const searchFriendsByLocation = async () => {
        if (!currentUser.myLocation) {
            window.alert("Current user location is not set.");
            return;
        }

        try {
            const queryBuilder = Backendless.DataQueryBuilder.create()
                .setWhereClause(`trackLocation = true`);
            const usersWithLocation = await Backendless.Data.of('Users').find(queryBuilder);

            const results = usersWithLocation.filter(user => {
                if (!isValidLocation(user.myLocation)) return false;
                const distance = calculateDistance(
                    currentUser.myLocation.latitude,
                    currentUser.myLocation.longitude,
                    user.myLocation.latitude,
                    user.myLocation.longitude
                );
                return distance <= locationSearchRadius;
            });

            setLocationSearchResults(results);
            console.log(results);
        } catch (error) {
            console.error('Error searching friends by location:', error);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const isValidLocation = (location) => {
        return location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
    };

    return (
        
        <div className="my-friends">
            <h1>My Friends</h1>

            <div className="search-users">
                <h2>Search Users</h2>
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={searchUsers}>Search</button>

                <ul>
                    {searchResults.map((user) => (
                        <li key={user.objectId}>
                            {user.name} ({user.email})
                            <button onClick={() => sendFriendRequest(user.objectId)}>Add Friend</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="friend-requests">
                <h2>Friend Requests</h2>
                <ul>
                    {friendRequests.map((request) => (
                        <li key={request.objectId}>
                            {request.name} ({request.email})
                            <button style={{ marginRight: '5px', backgroundColor: 'green' }} onClick={() => acceptFriendRequest(request.objectId)}>Accept</button>
                            <button style={{ backgroundColor: 'red' }} onClick={() => declineFriendRequest(request.objectId)}>Decline</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="friends-list">
                <h2>My Friends</h2>
                <ul>
                    {friends.map((friend) => (
                        <li key={friend.objectId}>
                            {friend.name} ({friend.email})
                            <button onClick={() => removeFriend(friend.objectId)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="location-search">
                <h2>Search Friends by Location</h2>
                <input
                    type="number"
                    placeholder="Radius in kilometers"
                    value={locationSearchRadius}
                    onChange={(e) => setLocationSearchRadius(e.target.value)}
                />
                <button onClick={searchFriendsByLocation}>Search by Location</button>

                <MapContainer center={[currentUser?.myLocation?.latitude || 0, currentUser?.myLocation?.longitude || 0]} zoom={10} style={{ height: "400px", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {locationSearchResults.map((friend) => (
                        isValidLocation(friend.myLocation) && (
                            <Marker key={friend.objectId} position={[friend.myLocation.latitude, friend.myLocation.longitude]} icon={friendIcon}>
                                <Popup>{friend.name}</Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default MyFriends;