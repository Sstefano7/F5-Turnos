import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import VerifyEmail from './pages/VerifyEmail';

import Reservar from './pages/Reservar';
import MisReservas from './pages/MisReservas';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import SuperAdminRoute from './components/SuperAdminRoute';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Estadisticas = lazy(() => import('./pages/admin/Estadisticas'));
const GestionCanchas = lazy(() => import('./pages/admin/GestionCanchas'));
const GestionTurnos = lazy(() => import('./pages/admin/GestionTurnos'));
const GestionClientes = lazy(() => import('./pages/admin/GestionClientes'));
const GestionHorarios = lazy(() => import('./pages/admin/GestionHorarios'));
const GestionBugReports = lazy(() => import('./pages/admin/GestionBugReports'));
const GestionAudits = lazy(() => import('./pages/admin/GestionAudits'));
const GestionLogs = lazy(() => import('./pages/admin/GestionLogs'));
const GestionPagos = lazy(() => import('./pages/admin/GestionPagos'));
const GestionBackups = lazy(() => import('./pages/admin/GestionBackups'));
const GestionUsuarios = lazy(() => import('./pages/admin/GestionUsuarios'));
function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <> {/* <--- Abrimos Fragmento */}
      <main className="main-content">
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/success" element={<RegisterSuccess />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

         {/* Rutas protegidas para usuarios autenticados */}
        <Route 
          path="/reservar/:id" 
          element={
            <ProtectedRoute>
              <Reservar />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/mis-reservas" 
          element={
            <ProtectedRoute>
              <MisReservas />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de Administración */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/estadisticas" 
          element={
            <AdminRoute>
              <Estadisticas />
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/canchas" 
          element={
            <AdminRoute>
              <GestionCanchas />
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/turnos" 
          element={
            <AdminRoute>
              <GestionTurnos />
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/clientes" 
          element={
            <AdminRoute>
              <GestionClientes />
            </AdminRoute>
          } 
        />
        
<Route 
          path="/admin/horarios" 
          element={
            <AdminRoute>
              <GestionHorarios />
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/pagos" 
          element={
            <AdminRoute>
              <GestionPagos />
            </AdminRoute>
          } 
        />
 
        {/* Rutas de Super Admin */}
        <Route 
          path="/admin/bug-reports" 
          element={
            <SuperAdminRoute>
              <GestionBugReports />
            </SuperAdminRoute>
          } 
        />

        <Route 
          path="/admin/audits" 
          element={
            <SuperAdminRoute>
              <GestionAudits />
            </SuperAdminRoute>
          } 
        />

        <Route 
          path="/admin/logs" 
          element={
            <SuperAdminRoute>
              <GestionLogs />
            </SuperAdminRoute>
          } 
        />
    
        <Route 
          path="/admin/backups" 
          element={
            <SuperAdminRoute>
              <GestionBackups />
            </SuperAdminRoute>
          } 
        />  

        <Route 
          path="/admin/users" 
          element={
            <SuperAdminRoute>
              <GestionUsuarios />
            </SuperAdminRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>

      {/* Footer principal que incluye el botón de reportar bug */}
      <Footer />

      {/* Chatbot guiado flotante */}
      {!isAdminRoute && <Chatbot />}
    </> 
  );
}

export default App;
