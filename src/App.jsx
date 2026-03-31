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
import InstallationsScreen from './screens/InstallationsScreen'
import GuardsScreen from './screens/GuardsScreen'
import RoundScreen from './screens/RoundScreen'
import PDFScreen from './screens/PDFScreen'
import SupervisorsScreen from './screens/SupervisorsScreen'
import ClientsScreen from './screens/ClientsScreen'
import AdminRoundsScreen from './screens/AdminRoundsScreen';
import AdminSchedulesScreen from './screens/AdminSchedulesScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import AdminAttendanceScreen from './screens/AdminAttendanceScreen';
import RoundDetailsScreen from './screens/RoundDetailsScreen';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Cargando...</div>
  if (user) return <Navigate to="/" />
  return children
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
      <Route path="/attendance" element={<AttendanceScreen />} />
      <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScannerScreen /></ProtectedRoute>} />
      <Route path="/round/:scheduleId" element={<ProtectedRoute><RoundScreen /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapScreen /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminScreen /></ProtectedRoute>} />
      <Route path="/installations" element={<ProtectedRoute><InstallationsScreen /></ProtectedRoute>} />
      <Route path="/guards" element={<ProtectedRoute><GuardsScreen /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsScreen /></ProtectedRoute>} />
      <Route path="/pdf-reports" element={<ProtectedRoute><PDFScreen /></ProtectedRoute>} />
      <Route path="/supervisors" element={<ProtectedRoute><SupervisorsScreen /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientsScreen /></ProtectedRoute>} />
      <Route path="/admin-rounds" element={<ProtectedRoute><AdminRoundsScreen /></ProtectedRoute>} />
      <Route path="/admin-schedules/:instId" element={<ProtectedRoute><AdminSchedulesScreen /></ProtectedRoute>} />
      <Route path="/admin-attendance" element={<ProtectedRoute><AdminAttendanceScreen /></ProtectedRoute>} />
      <Route path="/round-details" element={<ProtectedRoute><RoundDetailsScreen /></ProtectedRoute>} />
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
