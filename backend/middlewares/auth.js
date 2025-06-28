// backend/config/middlewares/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Obtener el token del header 'Authorization'
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        // 2. Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Adjuntar el usuario decodificado a la solicitud
        req.user = decoded;
        
        // 4. Continuar con la siguiente función (controller)
        next();
    } catch (err) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = auth;