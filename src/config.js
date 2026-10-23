// ============================================================
//  EDITA AQUI ❤  — todos os textos e fotos da página.
//  As fotos vão para a pasta  public/fotos/  (jpg, png, webp).
//  Escreve só o nome do ficheiro, ex.: 'fotos/nos-dois.jpg'
// ============================================================

export default {
  nomeDela: 'Lectícia',
  nomeDele: 'Augusto',

  // Aparece em partículas no topo antes de explodir num coração.
  // Curto funciona melhor (2–5 caracteres).
  iniciais: 'A ♥ L',

  hero: {
    etiqueta: 'Para ti, Lectícia',
    titulo: '',
    subtitulo: 'Desce devagar. Cada parte desta página foi feita a pensar em ti.',
  },

  // A nossa história — adiciona ou remove quantos momentos quiseres.
  historia: [
    {
      data: 'O dia em que te conheci',
      titulo: 'A nossa primeira dança',
      texto: 'No dia em que nos conhecemos, dançámos como se já nos conhecêssemos há anos. Entre um passo e outro, o teu sorriso apanhou-me — e desde essa noite nunca mais deixei de querer dançar contigo.',
      // pode ser foto ou vídeo (.mp4)
      foto: 'fotos/VIDEO-2025-09-27-23-49-20.mp4',
    },
    {
      data: 'A primeira conversa',
      titulo: 'Horas que pareciam minutos',
      texto: 'Falámos de tudo e de nada, e eu só queria que aquela conversa nunca acabasse.',
      foto: 'fotos/IMG_4184.jpg',
    },
    {
      data: 'Cada momento',
      titulo: 'Sem explicação',
      texto: 'Perguntas-me sempre porquê, e eu nunca sei responder. Não é uma coisa, nem um detalhe — és tu, inteira. Não preciso de razões: simplesmente és tu.',
      foto: 'fotos/IMG_4136.jpg',
    },
    {
      data: 'Hoje',
      titulo: 'Tu és o meu lugar favorito',
      texto: 'Cada dia contigo é melhor do que o anterior. E eu quero muitos mais.',
      foto: 'fotos/IMG_4193.jpg',
    },
  ],

  // Galeria tipo polaroid. As legendas lidas por ordem formam uma frase.
  galeria: [
    { foto: 'fotos/IMG_4135.jpg', legenda: 'Desde o primeiro dia,' },
    { foto: 'fotos/IMG_4258.jpg', legenda: 'o teu sorriso' },
    { foto: 'fotos/IMG_4229.jpg', legenda: 'faz de mim' },
    { foto: 'fotos/IMG_4231.jpg', legenda: 'o homem mais feliz.' },
    { foto: 'fotos/IMG_4266.jpg', legenda: 'E eu só quero' },
    { foto: 'fotos/IMG_4488.jpg', legenda: 'viver tudo contigo' },
    { foto: 'fotos/IMG_4507.jpg', legenda: 'para sempre ❤' },
  ],

  // Carta — cada linha nova vira um parágrafo.
  carta: `Minha pessoa favorita,

Não sou muito bom com palavras, por isso fiz isto para ti.
Desde que entraste na minha vida, tudo ficou mais leve e mais bonito.
Amo-te de uma forma que não cabe numa mensagem — por isso precisei de uma página inteira.

Quero estar contigo nos dias bons e nos menos bons, e fazer-te sorrir sempre.`,

  // A pergunta só aparece depois de ela escrever a chave certa
  // (maiúsculas e acentos não contam).
  botaoAbrir: 'Clica aqui',
  pedidoChave: 'Escreve a chave para abrir',
  chave: 'pelas cabeças',
  chaveErrada: 'Chave errada… tenta outra vez ❤',

  pergunta: 'Queres namorar comigo?',
  botaoSim: 'Sim ❤',
  // O botão "Não" foge e vai mudando de texto…
  respostasNao: ['Não', 'Tens a certeza?', 'Pensa bem 🥺', 'Última chance!', 'Vá lá…', 'Não aceito isso 😤', 'Clica no Sim!'],

  // Ecrã final depois do "Sim".
  sim: {
    data: '2026-10-24', // data que aparece no ecrã final (vazio = dia de hoje)
    titulo: 'Dama do Augusto',
    texto: 'A partir de hoje és oficialmente a minha namorada. Prometo cuidar de ti todos os dias. Amo-te ❤',
    foto: 'fotos/IMG_4196.jpg',
  },

  // Opcional: música que toca quando ela clica "Sim" (ex.: 'musica.mp3' dentro de public/).
  musica: 'musica.mp3',
  // Segundo em que a música começa (e onde recomeça quando repete).
  musicaInicio: 19,
  // Crédito pequeno no rodapé (necessário para músicas CC BY, ex.: musica.mp3 do Kevin MacLeod).
  creditoMusica: '',
}
