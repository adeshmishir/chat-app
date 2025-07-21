import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext'
import bgImage from './assets/bgImage.svg'; // <- Correct the path if needed



const App = () => {
 const {authUser} = useContext(AuthContext);

  return (
    <div style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'contain' }}>
     <Toaster/>
      <Routes>
        <Route path='/' element={authUser?<HomePage/> : <Navigate to= "/login"/>} />
        <Route path='/login' element={!authUser?<LoginPage/> : <Navigate to="/"/>} />
        <Route path='/profile' element={authUser?<ProfilePage/> : <Navigate to="/login" />} />
      </Routes>
      
    </div>
  )
}

export default App
