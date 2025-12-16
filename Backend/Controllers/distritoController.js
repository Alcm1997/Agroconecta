const distritoModel = require('../Models/distritoModel');

exports.createDistrito = async (req, res) => {
  try {
    const { nombre_distrito, id_departamento } = req.body;
    const distrito = await distritoModel.createDistrito(nombre_distrito, id_departamento);
    res.status(201).json(distrito);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getAllDistritos = async (req, res) => {
  try {
    const distritos = await distritoModel.getAllDistritos();
    res.json(distritos);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getDistritoById = async (req, res) => {
  try {
    const distrito = await distritoModel.getDistritoById(req.params.id);
    if (!distrito) return res.status(404).json({ message: 'Distrito no encontrado.' });
    res.json(distrito);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getDistritosByDepartamento = async (req, res) => {
  try {
    const distritos = await distritoModel.getDistritosByDepartamento(req.params.id_departamento);
    res.json(distritos);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.updateDistrito = async (req, res) => {
  try {
    const { nombre_distrito, id_departamento } = req.body;
    const distrito = await distritoModel.updateDistrito(req.params.id, nombre_distrito, id_departamento);
    if (!distrito) return res.status(404).json({ message: 'Distrito no encontrado.' });
    res.json(distrito);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.deleteDistrito = async (req, res) => {
  try {
    const deleted = await distritoModel.deleteDistrito(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Distrito no encontrado.' });
    res.json({ message: 'Distrito eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};