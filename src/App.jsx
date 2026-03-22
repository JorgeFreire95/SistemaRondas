import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'

import HomeScreen from './screens/HomeScreen'
import LoginScreen from './screens/LoginScreen'
import AdminScreen from './screens/AdminScreen'
import ReportsScreen from './screens/ReportsScreen'
import ScannerScreen from './screens/ScannerScreen'
import MapScreen from './screens/MapScreen'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScannerScreen /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapScreen /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminScreen /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsScreen /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <div className="premium-container">
            <AppContent />
          </div>
        </Router>
      </LocationProvider>
    </AuthProvider>
  )
}

export default App
