const departamentoModel = require('../Models/departamentoModel');

exports.createDepartamento = async (req, res) => {
  try {
    const { nombre_departamento } = req.body;
    const departamento = await departamentoModel.createDepartamento(nombre_departamento);
    res.status(201).json(departamento);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getAllDepartamentos = async (req, res) => {
  try {
    const departamentos = await departamentoModel.getAllDepartamentos();
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.getDepartamentoById = async (req, res) => {
  try {
    const departamento = await departamentoModel.getDepartamentoById(req.params.id);
    if (!departamento) return res.status(404).json({ message: 'Departamento no encontrado.' });
    res.json(departamento);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.updateDepartamento = async (req, res) => {
  try {
    const { nombre_departamento } = req.body;
    const departamento = await departamentoModel.updateDepartamento(req.params.id, nombre_departamento);
    if (!departamento) return res.status(404).json({ message: 'Departamento no encontrado.' });
    res.json(departamento);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

exports.deleteDepartamento = async (req, res) => {
  try {
    const deleted = await departamentoModel.deleteDepartamento(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Departamento no encontrado.' });
    res.json({ message: 'Departamento eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};