export const categoryLabels = {
  publicity: "Publicidade",
  "events-bts": "Bastidores",
  "editorial-artistic": "Editorial",
  portraits: "Retratos",
};

const validationMessages = new Map([
  ["Unknown Portfolio category.", "Selecione uma categoria válida."],
  ["Display order is outside the destination category.", "Escolha uma posição válida para essa categoria."],
  ["The order contains duplicate photo IDs.", "A ordem contém fotos repetidas. Atualize a lista e tente novamente."],
  ["Photo IDs must be positive integers.", "A seleção contém fotos inválidas. Atualize a lista e tente novamente."],
  ["Display order must be a nonnegative integer.", "Escolha uma posição válida para a foto."],
  ["Published must be a boolean.", "Selecione uma opção de visibilidade."],
  ["Photo title must have at most 160 characters.", "O título da foto deve ter até 160 caracteres."],
  ["Photo title must be text or null.", "Digite um título em texto ou deixe o campo em branco."],
  ["Alt text must have at most 255 characters.", "O texto alternativo deve ter até 255 caracteres."],
  ["Alt text must be text of at most 255 characters or null.", "Digite um texto alternativo de até 255 caracteres ou deixe o campo em branco."],
  ["Select a nonempty photograph.", "Selecione um arquivo de imagem que não esteja vazio."],
  ["Could not read the uploaded file.", "Não foi possível ler o arquivo selecionado."],
  ["The photograph must have a file name.", "Selecione um arquivo que tenha nome."],
  ["The photograph file name is invalid.", "O nome do arquivo é inválido."],
  ["Image dimensions exceed 10,000 pixels per side or 25 megapixels.", "A imagem deve ter até 10.000 pixels de cada lado e até 25 megapixels."],
  ["Could not decode the image. It may be damaged or animated.", "Não foi possível abrir a imagem. Ela pode estar danificada ou ser animada."],
]);

export const unconfirmedSave = "Não foi possível confirmar a gravação. Atualize a lista de fotos antes de fazer outra alteração.";

export function photoErrorMessage(error) {
  switch (error.status) {
    case 400: return validationMessages.get(error.message) ?? "Confira os campos e tente novamente.";
    case 403: return "Não foi possível autorizar esta ação. Atualize a página e tente novamente.";
    case 404: return "Foto não encontrada. Atualize a lista e tente novamente.";
    case 413: return "A foto ultrapassa o limite de tamanho para envio.";
    case 415: return "Envie uma imagem JPEG, PNG ou WebP.";
    case 429: return "Há muitos envios em andamento. Aguarde um momento e tente novamente.";
    case 502:
    case 503: {
      const reference = error.message.match(/this reference before retrying: ([a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})$/i)?.[1];
      if (!reference) return unconfirmedSave;
      const problem = error.status === 502 ? "Não foi possível confirmar o envio da imagem."
        : "Não foi possível confirmar a gravação no banco de dados.";
      return `${problem} Informe a referência ${reference} ao suporte antes de tentar novamente.`;
    }
    default: return unconfirmedSave;
  }
}
