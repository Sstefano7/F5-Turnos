import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

import Reservar from './pages/Reservar';
import MisReservas from './pages/MisReservas';
import AdminDashboard from './pages/admin/AdminDashboard';
import GestionCanchas from './pages/admin/GestionCanchas';
import GestionTurnos from './pages/admin/GestionTurnos';
import GestionClientes from './pages/admin/GestionClientes';
import GestionHorarios from './pages/admin/GestionHorarios';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GestionPagos from './pages/admin/GestionPagos';
import ReportBugButton from './components/ReportBugButton';
import GestionBugReports from './pages/admin/GestionBugReports';
import SuperAdminRoute from './components/SuperAdminRoute';

import GestionAudits from './pages/admin/GestionAudits'; 
import GestionLogs from './pages/admin/GestionBugReports'; 

import GestionBackups from './pages/admin/GestionBackups';



function App() {
  return (
    <> {/* <--- Abrimos Fragmento */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Ahora el botón está DENTRO de la función y AFUERA de las rutas */}
      <ReportBugButton />
    </> 
  );
}

export default App;