import Usuario from "../models/usuarios.js";

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários", error: error.message });
  }
};

export const buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: "ID inválido", error: error.message });
  }
};

export const criarUsuario = async (req, res) => {
  try {
    const novoUsuario = await Usuario.create(req.body);
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar usuário", error: error.message });
  }
};

export const atualizarUsuario = async (req, res) => {
  try {
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!usuarioAtualizado) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(usuarioAtualizado);
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar usuário", error: error.message });
  }
};

export const deletarUsuario = async (req, res) => {
  try {
    const usuarioDeletado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioDeletado) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json({ message: "Usuário removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar usuário", error: error.message });
  }
};