import Usuario from "../models/usuarios.js";

const camposPublicos = "nome email cargo createdAt";

export const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find().select(camposPublicos);
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const criarUsuario = async (req, res, next) => {
  try {
    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    const { senha, ...usuarioSemSenha } = novoUsuario.toObject();
    res.status(201).json(usuarioSemSenha);
  } catch (error) {
    next(error);
  }
};

export const obterUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select(camposPublicos);
    if (!usuario) return res.status(404).json({ mensagem: "Usuário não encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
};

export const atualizarUsuario = async (req, res, next) => {
  try {
    delete req.body.senha;
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select(camposPublicos);
    if (!usuarioAtualizado) return res.status(404).json({ mensagem: "Usuário não encontrado" });
    res.status(200).json(usuarioAtualizado);
  } catch (error) {
    next(error);
  }
};

export const deletarUsuario = async (req, res, next) => {
  try {
    const usuarioDeletado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioDeletado) return res.status(404).json({ mensagem: "Usuário não encontrado" });
    res.status(200).json({ mensagem: "Usuário removido com sucesso" });
  } catch (error) {
    next(error);
  }
};
