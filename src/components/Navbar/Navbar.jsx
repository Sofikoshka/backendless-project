import React, { useState } from 'react';
import {NavLink} from "react-router-dom";
import {useNavigate} from "react-router";
import "./Navbar.css"

function Navbar() { 


    const navigate = useNavigate();
    
    return (
        <nav className="nav">
        <div className="container">
            <div className="nav-row">
               
                <ul className="nav-list">
          

                    <NavLink to="/registration" className="nav-list__item">Реєстрація</NavLink>
                    <NavLink to="/login" className="nav-list__item">Авторизація</NavLink>
                    <NavLink to="/cabinet" className="nav-list__item">Особистий кабінет</NavLink>
                    <NavLink to="/files" className="nav-list__item">Мої файли</NavLink> 
                    <NavLink to="/myplaces" className="nav-list__item">Мої місця</NavLink> 
                    <NavLink to="/myfriends" className="nav-list__item">Мої друзі</NavLink> 
                    <NavLink to="/developer-feedback" className="nav-list__item">Фідбек</NavLink> 


                </ul>
            </div>
        </div>
    </nav>
    );
}

export default Navbar;