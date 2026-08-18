const mongoose = require('mongoose');

const gerenteSchema = new mongoose.Schema({
  // Identificação Profissional
  matricula: { type: String, required: true, unique: true, trim: true },
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  senha: { type: String, required: true },
  cpf: { type: String, required: true, unique: true, trim: true },
  telefone: { type: String },

  // Cargo e Setor Operacional
  cargo: { type: String, required: true }, // Ex: "Gerente Geral", "Supervisor de Estoque"
  departamento: { 
    type: String, 
    enum: ['estoque', 'vendas', 'logistica', 'financeiro', 'geral'], 
    default: 'geral',
    required: true 
  },

  // Lista de Permissões no Painel
  permissoes: [{
    type: String,
    enum: [
      'produtos:criar',
      'produtos:editar',
      'produtos:deletar',
      'estoque:atualizar',
      'pedidos:aprovar',
      'pedidos:cancelar',
      'relatorios:visualizar'
    ]
  }],

  // Controle de Acesso
  status: { 
    type: String, 
    enum: ['ativo', 'inativo', 'suspenso'], 
    default: 'ativo' 
  },
  ultimoAcesso: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gerente', gerenteSchema);