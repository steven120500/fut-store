

// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Credenciales hardcodeadas (solo para prueba)
const USER = {
    username: "207370026",
    password: "Bety1234"
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validar credenciales (en producción usa DB)
    if (username !== USER.username || password !== USER.password) {
        return res.status(401).json({
            success: false,
            error: "Credenciales incorrectas"
        });
    }

    // Generar token JWT
    const token = jwt.sign(
        { userId: USER.username }, // Payload
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Opcional: expira en 24 horas
    );

    res.json({ 
        success: true,
        token 
    });
});

module.exports = router;