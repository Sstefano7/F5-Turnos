import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
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


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
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

      
      <Route path="/admin/pagos" element={<GestionPagos />} />
    

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;