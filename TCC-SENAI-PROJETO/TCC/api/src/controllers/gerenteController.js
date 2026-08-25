const Gerente = require('../models/Gerente');

// Cadastrar novo Gerente
exports.criarGerente = async (req, res) => {
  try {
    const { email } = req.body;
    
    const gerenteExistente = await Gerente.findOne({ email });
    if (gerenteExistente) {
      return res.status(400).json({ message: "Este e-mail já está cadastrado para outro gerente." });
    }

    const novoGerente = new Gerente(req.body);
    await novoGerente.save();
    return res.status(201).json({ message: "Gerente cadastrado com sucesso!", gerente: novoGerente });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao cadastrar gerente", error: error.message });
  }
};

// Login de Gerente
exports.loginGerente = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const gerente = await Gerente.findOne({ email, senha });
    if (!gerente) {
      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    }

    return res.status(200).json({ message: "Login realizado com sucesso!", gerente });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao realizar login", error: error.message });
  }
};

// Listar todos os gerentes
exports.listarGerentes = async (req, res) => {
  try {
    const gerentes = await Gerente.find();
    return res.status(200).json(gerentes);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar gerentes", error: error.message });
  }
};

// Buscar gerente por ID
exports.buscarGerentePorId = async (req, res) => {
  try {
    const gerente = await Gerente.findById(req.params.id);
    if (!gerente) {
      return res.status(404).json({ message: "Gerente não encontrado" });
    }
    return res.status(200).json(gerente);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar gerente", error: error.message });
  }
};

// Atualizar gerente por ID
exports.atualizarGerente = async (req, res) => {
  try {
    const gerenteAtualizado = await Gerente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!gerenteAtualizado) {
      return res.status(404).json({ message: "Gerente não encontrado" });
    }
    return res.status(200).json({ message: "Gerente atualizado com sucesso!", gerente: gerenteAtualizado });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar gerente", error: error.message });
  }
};

// Deletar gerente por ID
exports.deletarGerente = async (req, res) => {
  try {
    const gerenteDeletado = await Gerente.findByIdAndDelete(req.params.id);
    if (!gerenteDeletado) {
      return res.status(404).json({ message: "Gerente não encontrado" });
    }
    return res.status(200).json({ message: "Gerente excluído com sucesso!" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao deletar gerente", error: error.message });
  }
};