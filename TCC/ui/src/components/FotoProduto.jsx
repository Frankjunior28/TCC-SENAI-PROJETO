import { useState } from "react";

/** Imagem de produto com fallback elegante e tratamento de URL inválida. */
export function FotoProduto({ foto, alt, className, largura = "100%", altura = 180 }) {
  const [urlComErro, setUrlComErro] = useState(null);
  const falhou = Boolean(foto) && urlComErro === foto;

  if (!foto || falhou) {
    return (
      <div
        className="foto-placeholder"
        style={{ width: largura, height: altura }}
        role="img"
        aria-label="Imagem do produto indisponível"
      >
        <span>Imagem não disponível</span>
      </div>
    );
  }

  return (
    <img
      src={foto}
      alt={alt || ""}
      onError={() => setUrlComErro(foto)}
      className={className}
      style={{ width: largura, height: altura, objectFit: "cover", display: "block" }}
    />
  );
}
