
// En api/routes/historyRoutes.js
router.get('/', async (req, res) => {
  try {
    const history = await History.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
});