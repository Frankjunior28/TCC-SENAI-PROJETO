const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  // Identificação Básica
  nome: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  descricao: { type: String },
  categoria: { type: String, required: true }, // Ex: "Sofás", "Mesas"
  
  // Preço e Estoque
  preco: { type: Number, required: true },
  precoPromocional: { type: Number },
  estoque: { type: Number, required: true, default: 0 },
  
  // Especificações Essenciais do Móvel (em cm)
  dimensoes: {
    altura: { type: Number, required: true },
    largura: { type: Number, required: true },
    profundidade: { type: Number, required: true }
  },
  pesoKg: { type: Number },
  cor: { type: String },
  material: { type: String }, // Ex: "MDF", "Madeira Maciça"
  
  // Mídia e Status
  imagens: [{ type: String }], // URLs das fotos
  ativo: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Produto', produtoSchema);
