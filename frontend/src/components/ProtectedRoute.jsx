import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, requireAdmin, children }) {
  // 1. Si no hay usuario logueado, lo devolvemos al inicio (o al login)
  if (!user) {
    return <Navigate to="/" replace />; 
  }

  // 2. (Opcional) Si la ruta requiere ser administrador/superusuario
  if (requireAdmin) {
    const isSuperUser = user.isSuperUser || user.roles?.includes("edit");
    if (!isSuperUser) {
      // Si está logueado pero no es admin, lo devolvemos al inicio
      return <Navigate to="/" replace />;
    }
  }

  // 3. Si pasó las pruebas de seguridad, mostramos la página normal
  return children;
}