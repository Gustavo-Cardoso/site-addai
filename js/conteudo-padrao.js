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

  // Seções que podem ser ligadas/desligadas no painel
  var SECOES = [
    ['sobre', 'Quem somos'],
    ['informativos', 'Informativos'],
    ['projetos', 'O que fazemos'],
    ['impacto', 'Números de impacto'],
    ['parceiros', 'Parceiros']
  ];

  // Onde uma seção personalizada pode entrar (id da seção que vem antes dela)
  var POSICOES = [
    ['boasvindas', 'Boas-vindas'],
    ['sobre', 'Quem somos'],
    ['informativos', 'Informativos'],
    ['projetos', 'O que fazemos'],
    ['impacto', 'Números de impacto'],
    ['ajudar', 'Como ajudar'],
    ['parceiros', 'Parceiros']
  ];

  var PADRAO = {
    secoes: { sobre: true, informativos: true, projetos: true, impacto: true, parceiros: true },
    // valor vazio = o site mostra o marcador amarelo
    impacto: [
      { valor: '', rotulo: 'famílias acolhidas' },
      { valor: '', rotulo: 'voluntários' },
      { valor: '', rotulo: 'ações por ano' },
      { valor: '', rotulo: 'ano de fundação' }
    ],
    // vazio = a seção de parceiros não aparece no site
    parceiros: [],
    // seções criadas pelo painel
    extras: [],
    // logo do topo e ícone da aba (vazios = símbolo padrão)
    marca: { logo: '', mostrarNome: true, favicon: '' },
    textos: {
      navDoar: 'Doe agora',
      bemvindoTitulo: 'Bem-vindo à ADDAI',
      bemvindoTexto: 'Somos uma associação sem fins lucrativos dedicada a acolher pessoas autistas e suas famílias, promovendo inclusão, informação e oportunidades.',
      sobreTitulo: 'Uma rede de apoio para a comunidade autista',
      sobreTexto: 'A ADDAI reúne famílias, profissionais e voluntários com um objetivo comum: construir uma sociedade mais acessível e acolhedora para pessoas autistas de todos os níveis de suporte.',
      missao: 'Acolher, incluir e defender os direitos de pessoas autistas e suas famílias.',
      visao: 'Ser referência em acolhimento e inclusão na nossa região.',
      valores: '',           // um valor por linha; vazio = o cartão não aparece
      sobreImg: '',          // foto de "Quem somos"; vazio = sem foto
      sobreImgAlt: '',
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
    var saida = { secoes: {}, impacto: [], parceiros: [], extras: [], textos: {}, slides: [], informativos: [] };
    Object.keys(PADRAO.secoes).forEach(function (k) {
      saida.secoes[k] = (c.secoes && typeof c.secoes[k] === 'boolean') ? c.secoes[k] : PADRAO.secoes[k];
    });
    saida.impacto = clonar(Array.isArray(c.impacto) ? c.impacto : PADRAO.impacto).map(function (x) {
      return { valor: String(x.valor || ''), rotulo: String(x.rotulo || '') };
    });
    saida.parceiros = clonar(Array.isArray(c.parceiros) ? c.parceiros : PADRAO.parceiros).map(function (x) {
      return { nome: String(x.nome || ''), link: String(x.link || ''), logo: String(x.logo || '') };
    });
    var mc = c.marca || {};
    saida.marca = { logo: String(mc.logo || ''), mostrarNome: mc.mostrarNome !== false, favicon: String(mc.favicon || '') };
    saida.extras = clonar(Array.isArray(c.extras) ? c.extras : []).map(function (x, i) {
      return {
        id: String(x.id || ('s' + (i + 1))).replace(/[^a-z0-9-]/gi, '') || ('s' + (i + 1)),
        ativa: x.ativa !== false,
        etiqueta: String(x.etiqueta || ''),
        titulo: String(x.titulo || ''),
        texto: String(x.texto || ''),
        img: String(x.img || ''),
        imgAlt: String(x.imgAlt || ''),
        ladoImg: x.ladoImg === 'esquerda' ? 'esquerda' : 'direita',
        botaoTexto: String(x.botaoTexto || ''),
        botaoLink: String(x.botaoLink || ''),
        depoisDe: POSICOES.some(function (p) { return p[0] === x.depoisDe; }) ? x.depoisDe : 'projetos',
        menu: !!x.menu,
        menuNome: String(x.menuNome || '')
      };
    });
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
  /* Logo da barra de navegação e ícone da aba (favicon). */
  function aplicarMarca(c) {
    var m = c.marca || {};
    document.querySelectorAll('.navbar-brand').forEach(function (a) {
      var img = a.querySelector('.logo-img'), simbolo = a.querySelector('.logo-simbolo'), nome = a.querySelector('.logo-text');
      if (!img) return;
      var temLogo = !!m.logo;
      img.classList.toggle('d-none', !temLogo);
      if (temLogo) { img.src = m.logo; img.alt = m.mostrarNome ? '' : 'ADDAI'; } else { img.removeAttribute('src'); }
      if (simbolo) simbolo.classList.toggle('logo-oculto', temLogo); // fica no DOM: o rodapé usa o degradê dele
      if (nome) nome.classList.toggle('d-none', temLogo && !m.mostrarNome);
    });
    var icone = document.getElementById('favicon');
    if (icone && m.favicon) { icone.href = m.favicon; icone.type = 'image/png'; }
  }

  function aplicarTextos(c) {
    aplicarMarca(c);
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

  /* ---------- seções ---------- */
  function mostrar(elem, visivel) { if (elem) elem.classList.toggle('d-none', !visivel); }

  function linkSeguro(url) { return /^https?:\/\//i.test(String(url || '').trim()); }

  function montarImpacto(c) {
    var grade = document.getElementById('impactoGrid');
    if (!grade) return;
    grade.innerHTML = '';
    c.impacto.forEach(function (item) {
      var col = document.createElement('div');
      col.className = 'col-6 col-lg-3';
      var valor = document.createElement('div');
      valor.className = 'stat' + (item.valor ? '' : ' ph');
      valor.textContent = item.valor || '[000]';
      var rotulo = document.createElement('p');
      rotulo.className = 'mb-0';
      rotulo.textContent = item.rotulo;
      col.appendChild(valor); col.appendChild(rotulo);
      grade.appendChild(col);
    });
  }

  function montarParceiros(c) {
    var grade = document.getElementById('parceirosGrid');
    if (!grade) return;
    grade.innerHTML = '';
    c.parceiros.forEach(function (p) {
      var col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';
      var caixa = document.createElement(linkSeguro(p.link) ? 'a' : 'div');
      caixa.className = 'parceiro';
      if (linkSeguro(p.link)) { caixa.href = p.link.trim(); caixa.target = '_blank'; caixa.rel = 'noopener'; }
      if (p.logo) {
        var img = document.createElement('img');
        img.src = p.logo; img.alt = p.nome || 'Parceiro';
        caixa.appendChild(img);
      } else {
        caixa.classList.add('parceiro-nome');
        caixa.textContent = p.nome || 'Parceiro';
      }
      if (p.nome) caixa.title = p.nome;
      col.appendChild(caixa);
      grade.appendChild(col);
    });
  }

  /* Liga/desliga seções e os links que apontam para elas (data-secao).
     Informativos, impacto e parceiros também somem quando estão vazios. */
  /* Links das seções personalizadas no menu e no rodapé (todas as páginas). */
  function linksExtras(c) {
    var naInicial = !!document.getElementById('carrossel');
    document.querySelectorAll('[data-extra]').forEach(function (el) { el.remove(); });
    var botaoDoar = document.querySelector('#menu .nav-item.ms-lg-2');
    var rodape = document.querySelector('footer [data-secao="informativos"]');
    c.extras.forEach(function (s) {
      if (!s.ativa || !s.menu || !(s.menuNome || s.titulo)) return;
      var href = (naInicial ? '' : 'index.html') + '#sec-' + s.id;
      if (botaoDoar) {
        var li = document.createElement('li'); li.className = 'nav-item'; li.setAttribute('data-extra', '');
        var a = document.createElement('a'); a.className = 'nav-link'; a.href = href; a.textContent = s.menuNome || s.titulo;
        li.appendChild(a); botaoDoar.parentNode.insertBefore(li, botaoDoar);
      }
      if (rodape) {
        var li2 = document.createElement('li'); li2.setAttribute('data-extra', '');
        var a2 = document.createElement('a'); a2.href = href; a2.textContent = s.menuNome || s.titulo;
        li2.appendChild(a2); rodape.parentNode.insertBefore(li2, rodape.nextSibling);
        rodape = li2;
      }
    });
  }

  function aplicarSecoes(c) {
    linksExtras(c);
    var visivel = {
      sobre: c.secoes.sobre,
      projetos: c.secoes.projetos,
      impacto: c.secoes.impacto && c.impacto.length > 0,
      informativos: c.secoes.informativos && c.informativos.length > 0,
      parceiros: c.secoes.parceiros && c.parceiros.length > 0
    };
    Object.keys(visivel).forEach(function (k) {
      mostrar(document.getElementById(k), visivel[k]);
      document.querySelectorAll('[data-secao="' + k + '"]').forEach(function (el) { mostrar(el, visivel[k]); });
    });
    montarImpacto(c);
    montarParceiros(c);
    // mantém o fundo alternado (branco / azul-claro) entre as seções visíveis
    var n = 0;
    document.querySelectorAll('.secao-alterna').forEach(function (s) {
      if (s.classList.contains('d-none')) return;
      s.classList.toggle('bg-white', n % 2 === 0);
      s.classList.toggle('secao-clara', n % 2 === 1);
      n++;
    });
    return visivel;
  }

  return {
    PADRAO: PADRAO,
    SECOES: SECOES,
    POSICOES: POSICOES,
    aplicarSecoes: aplicarSecoes,
    clonar: clonar,
    completar: completar,
    lerRascunho: lerRascunho,
    salvarRascunho: salvarRascunho,
    apagarRascunho: apagarRascunho,
    entrarNaPrevia: entrarNaPrevia,
    sairDaPrevia: sairDaPrevia,
    carregarPublicado: carregarPublicado,
    carregar: carregar,
    aplicarTextos: aplicarTextos,
    aplicarMarca: aplicarMarca
  };
})();
