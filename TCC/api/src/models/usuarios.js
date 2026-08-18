const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  // Dados de Identificação
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  senha: { type: String, required: true }, // Criptografada (ex: bcrypt)
  cpf: { type: String, required: true, unique: true, trim: true },
  telefone: { type: String, required: true },

  // Status da Conta
  status: { 
    type: String, 
    enum: ['ativo', 'inativo', 'bloqueado'], 
    default: 'ativo' 
  },

  // Endereços do Cliente (importante para cálculo de frete e entregas de móveis)
  enderecos: [{
    rotulo: { type: String, default: 'Casa' }, // Ex: "Casa", "Trabalho"
    cep: { type: String, required: true },
    logradouro: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: { type: String },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    instrucoesEntrega: { type: String } // Ex: "Acesso por escadas (sem elevador)", "Portaria 24h"
  }]
}, {
  timestamps: true // Gera automaticamente createdAt e updatedAt
});

module.exports = mongoose.model('Usuario', usuarioSchema);