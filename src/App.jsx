import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SignIn from './pages/SignIn'
import AdminSignIn from './pages/AdminSignIn'
import AdminDashboard from './pages/AdminDashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import GuideView from './pages/GuideView'
import Tutor from './pages/Tutor'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/courses/:courseId/guides/:guideId" element={<ProtectedRoute><GuideView /></ProtectedRoute>} />
            <Route path="/tutor" element={<ProtectedRoute><Tutor /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
