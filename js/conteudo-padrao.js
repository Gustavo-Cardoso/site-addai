/* =====================================================================
   conteudo-padrao.js — base compartilhada por todas as páginas

   De onde vem o conteúdo do site:
     1) conteudo.json  → o que está PUBLICADO (todo visitante vê)
     2) rascunho local → edições do painel guardadas só no SEU navegador
                         (aparece apenas na prévia aberta pelo painel)
     3) PADRAO abaixo  → reserva, caso o conteudo.json não carregue
   ===================================================================== */
var ADDAI = (function () {
  var CHAVE_RASCUNHO = 'addai_rascunho';
  var CHAVE_PREVIA = 'addai_previa';

  var PADRAO = {
    textos: {
      navDoar: 'Doe agora',
      bemvindoTitulo: 'Bem-vindo à ADDAI',
      bemvindoTexto: 'Somos uma associação sem fins lucrativos dedicada a acolher pessoas autistas e suas famílias, promovendo inclusão, informação e oportunidades.',
      sobreTitulo: 'Uma rede de apoio para a comunidade autista',
      sobreTexto: 'A ADDAI reúne famílias, profissionais e voluntários com um objetivo comum: construir uma sociedade mais acessível e acolhedora para pessoas autistas de todos os níveis de suporte.',
      chamadaDoacao: 'Como você pode ajudar',
      // dados da associação (vazio = o site mostra o marcador amarelo)
      telefone: '',
      email: '',
      endereco: '',
      pixChave: '',
      pixTitular: '',
      cnpj: ''
    },
    slides: [
      { titulo: 'Acolhimento e inclusão', subtitulo: 'Apoio a pessoas autistas e suas famílias', img: '', cor: 'slide-a', botaoTexto: 'Como ajudar', botaoLink: '#ajudar' },
      { titulo: 'Você também faz parte', subtitulo: 'Seja voluntário ou empresa parceira', img: '', cor: 'slide-b', botaoTexto: 'Participar', botaoLink: '#contato' },
      { titulo: 'Doe e transforme vidas', subtitulo: 'Cada contribuição mantém nossos projetos de pé', img: '', cor: 'slide-c', botaoTexto: 'Doar via PIX', botaoLink: '#ajudar' }
    ],
    // Informativos de exemplo: edite ou remova pelo painel.
    informativos: [
      { id: 'exemplo-1', titulo: '[Exemplo] Roda de conversa para famílias', data: '2026-11-10', img: '', imgAlt: '',
        texto: 'Este é um informativo de exemplo, para mostrar como a seção funciona.\n\nEscreva aqui o texto completo: o que vai acontecer, quando, onde e como participar. Deixe uma linha em branco entre os parágrafos.\n\nEdite ou remova este exemplo pelo painel de controle.' },
      { id: 'exemplo-2', titulo: '[Exemplo] Campanha de doações de fim de ano', data: '2026-11-03', img: '', imgAlt: '',
        texto: 'Este é um informativo de exemplo.\n\nUse este espaço para divulgar campanhas, prestar contas e agradecer a quem apoia a associação.' },
      { id: 'exemplo-3', titulo: '[Exemplo] Oficina de atividades sensoriais', data: '2026-10-20', img: '', imgAlt: '',
        texto: 'Este é um informativo de exemplo.\n\nConte como foi a atividade e coloque uma foto (sempre com autorização de quem aparece nela).' },
      { id: 'exemplo-4', titulo: '[Exemplo] Palestra sobre direitos da pessoa autista', data: '2026-10-05', img: '', imgAlt: '',
        texto: 'Este é um informativo de exemplo.\n\nLinks escritos por extenso viram clicáveis, por exemplo: https://www.instagram.com/addaiautistas0425' }
    ]
  };

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  /* Garante que o conteúdo tenha tudo o que as páginas esperam
     (o que faltar vem do PADRAO). */
  function completar(c) {
    c = c || {};
    var saida = { textos: {}, slides: [], informativos: [] };
    Object.keys(PADRAO.textos).forEach(function (k) {
      saida.textos[k] = (c.textos && c.textos[k] != null) ? c.textos[k] : PADRAO.textos[k];
    });
    saida.slides = (Array.isArray(c.slides) && c.slides.length) ? clonar(c.slides) : clonar(PADRAO.slides);
    // lista vazia é válida (sem informativos, a seção some do site)
    saida.informativos = clonar(Array.isArray(c.informativos) ? c.informativos : PADRAO.informativos).map(function (inf, i) {
      return {
        id: String(inf.id || ('i' + (i + 1))),
        titulo: String(inf.titulo || ''),
        data: String(inf.data || ''),      // AAAA-MM-DD
        img: String(inf.img || ''),
        imgAlt: String(inf.imgAlt || ''),
        texto: String(inf.texto || '')
      };
    });
    return saida;
  }

  /* ---------- rascunho (painel) ---------- */
  function lerRascunho() {
    try {
      var t = localStorage.getItem(CHAVE_RASCUNHO);
      return t ? JSON.parse(t) : null;
    } catch (e) { return null; }
  }
  function salvarRascunho(c) { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(c)); } // pode lançar erro (sem espaço)
  function apagarRascunho() { try { localStorage.removeItem(CHAVE_RASCUNHO); } catch (e) {} }

  /* ---------- prévia ----------
     O painel liga a prévia nesta aba; enquanto ligada, as páginas do site
     mostram o rascunho (com um aviso no topo) em vez do publicado. */
  function entrarNaPrevia() { try { sessionStorage.setItem(CHAVE_PREVIA, '1'); } catch (e) {} }
  function sairDaPrevia() { try { sessionStorage.removeItem(CHAVE_PREVIA); } catch (e) {} }
  function emPrevia() {
    try { return sessionStorage.getItem(CHAVE_PREVIA) === '1'; } catch (e) { return false; }
  }

  function mostrarAvisoPrevia() {
    var aviso = document.getElementById('previaBanner');
    if (!aviso) return;
    aviso.classList.remove('d-none');
    var sair = document.getElementById('previaSair');
    if (sair) sair.addEventListener('click', function () {
      sairDaPrevia();
      window.location.href = 'index.html';
    });
  }

  /* ---------- leitura ---------- */
  function carregarPublicado() {
    return fetch('conteudo.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(completar)
      .catch(function () { return completar(null); });
  }

  /* Usado pelas páginas do site: rascunho se a prévia estiver ligada, senão o publicado. */
  function carregar() {
    if (emPrevia()) {
      var rascunho = lerRascunho();
      if (rascunho) { mostrarAvisoPrevia(); return Promise.resolve(completar(rascunho)); }
    }
    return carregarPublicado();
  }

  /* Preenche todo elemento que tem data-key="chave".
     Valor vazio = mantém o marcador amarelo que está no HTML. */
  function aplicarTextos(c) {
    document.querySelectorAll('[data-key]').forEach(function (el) {
      var chave = el.getAttribute('data-key');
      var valor = c.textos[chave];
      if (valor == null || String(valor).trim() === '') return;
      el.textContent = valor;
      el.classList.remove('ph');
      if (chave === 'email' && el.tagName === 'A') el.href = 'mailto:' + valor;
    });
    var ano = document.getElementById('year');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  return {
    PADRAO: PADRAO,
    clonar: clonar,
    completar: completar,
    lerRascunho: lerRascunho,
    salvarRascunho: salvarRascunho,
    apagarRascunho: apagarRascunho,
    entrarNaPrevia: entrarNaPrevia,
    sairDaPrevia: sairDaPrevia,
    carregarPublicado: carregarPublicado,
    carregar: carregar,
    aplicarTextos: aplicarTextos
  };
})();
