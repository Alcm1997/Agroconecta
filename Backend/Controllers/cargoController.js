const cargoModel = require('../Models/cargoModel');

exports.createCargo = async (req, res) => {
  try {
    const { nombre_cargo } = req.body;
    const cargo = await cargoModel.createCargo(nombre_cargo);
    res.status(201).json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getAllCargos = async (req, res) => {
  try {
    const cargos = await cargoModel.getAllCargos();
    res.json(cargos);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getCargoById = async (req, res) => {
  try {
    const cargo = await cargoModel.getCargoById(req.params.id);
    if (!cargo) return res.status(404).json({ message: 'Cargo no encontrado.' });
    res.json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.updateCargo = async (req, res) => {
  try {
    const { nombre_cargo } = req.body;
    const cargo = await cargoModel.updateCargo(req.params.id, nombre_cargo);
    if (!cargo) return res.status(404).json({ message: 'Cargo no encontrado.' });
    res.json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.deleteCargo = async (req, res) => {
  try {
    const deleted = await cargoModel.deleteCargo(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Cargo no encontrado.' });
    res.json({ message: 'Cargo eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};