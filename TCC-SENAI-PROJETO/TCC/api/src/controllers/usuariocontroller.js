const Usuario = require('../models/Usuario');

// Cadastrar novo usuário
exports.criarUsuario = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (email) {
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ message: "Já existe um usuário cadastrado com este e-mail." });
      }
    }

    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    return res.status(201).json({ message: "Usuário cadastrado com sucesso!", usuario: novoUsuario });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao cadastrar usuário", error: error.message });
  }
};

// Login de usuário
exports.loginUsuario = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email, senha });
    if (!usuario) {
      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    }

    return res.status(200).json({ message: "Login realizado com sucesso!", usuario });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao realizar login", error: error.message });
  }
};

// Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar usuários", error: error.message });
  }
};

// Buscar usuário por ID
exports.buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar usuário", error: error.message });
  }
};

// Atualizar usuário por ID
exports.atualizarUsuario = async (req, res) => {
  try {
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!usuarioAtualizado) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    return res.status(200).json({ message: "Usuário atualizado com sucesso!", usuario: usuarioAtualizado });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar usuário", error: error.message });
  }
};

// Deletar usuário por ID
exports.deletarUsuario = async (req, res) => {
  try {
    const usuarioDeletado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioDeletado) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    return res.status(200).json({ message: "Usuário excluído com sucesso!" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao deletar usuário", error: error.message });
  }
};