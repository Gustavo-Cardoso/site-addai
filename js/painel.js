/* =====================================================================
   painel.js — painel de controle (informativos, carrossel, textos, dados)
   (depende de js/conteudo-padrao.js e do Bootstrap)

   O painel só abre com uma chave de acesso do GitHub (js/github.js).
   "Publicar no site" grava o conteudo.json direto no repositório.
   ===================================================================== */
(function () {
  var CAMPOS = ['navDoar', 'bemvindoTitulo', 'bemvindoTexto', 'sobreTitulo', 'sobreTexto', 'missao', 'visao', 'valores', 'chamadaDoacao',
                'telefone', 'email', 'endereco', 'pixChave', 'pixTitular', 'cnpj'];
  var CORES = [['slide-a', 'Azul'], ['slide-b', 'Verde'], ['slide-c', 'Laranja']];
  var LARGURA_SLIDE = 1920; // fotos maiores são reduzidas antes de embutir
  var LARGURA_SLIDE_CEL = 900;
  var LARGURA_INFO = 1000;

  var dados = ADDAI.completar(null);

  function $(id) { return document.getElementById(id); }

  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { n.appendChild(f); });
    return n;
  }

  function aviso(msg, tipo) {
    var t = $('toast');
    t.className = 'toast align-items-center border-0 text-bg-' + (tipo || 'success');
    $('toastMsg').textContent = msg;
    bootstrap.Toast.getOrCreateInstance(t, { delay: 4000 }).show();
  }

  function hoje() {
    var d = new Date();
    var dois = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
  }

  /* ---------- campos <-> modelo ---------- */
  function preencher() {
    CAMPOS.forEach(function (k) {
      var campo = $('t_' + k);
      if (campo) campo.value = dados.textos[k] || '';
    });
    desenharMarca();
    desenharSecoes();
    desenharFotoSobre();
    desenharInformativos();
    desenharImpacto();
    desenharParceiros();
    desenharExtras();
    desenharSlides();
  }

  function coletar() { // slides e informativos já atualizam o modelo enquanto você digita
    CAMPOS.forEach(function (k) {
      var campo = $('t_' + k);
      if (campo) dados.textos[k] = campo.value.trim();
    });
    return dados;
  }

  /* ---------- peças reutilizadas ---------- */
  function campo(item, chave, rotulo, dono, classe) {
    var inp = el('input', { 'class': classe || 'form-control mb-2', placeholder: rotulo, 'aria-label': rotulo + ' — ' + dono });
    inp.value = item[chave] || '';
    inp.addEventListener('input', function () { item[chave] = inp.value; });
    return inp;
  }

  function botao(texto, classe, rotulo, aoClicar, desabilitado) {
    var b = el('button', { type: 'button', 'class': 'btn btn-sm ' + classe, 'aria-label': rotulo, text: texto });
    if (desabilitado) b.disabled = true;
    b.addEventListener('click', aoClicar);
    return b;
  }

  function ehEmbutida(img) { return !!img && img.indexOf('data:') === 0; }

  /* Reduz e comprime a foto no próprio navegador (nada é enviado a servidor). */
  function comprimirFoto(arquivo, larguraMax, pronto, formato, quadrado) {
    var leitor = new FileReader();
    leitor.onerror = function () { pronto(null); };
    leitor.onload = function () {
      var img = new Image();
      img.onerror = function () { pronto(null); };
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var tela = document.createElement('canvas');
        if (quadrado) {                       // ícone: recorta o centro em quadrado
          var lado = Math.min(w, h);
          tela.width = tela.height = quadrado;
          tela.getContext('2d').drawImage(img, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, quadrado, quadrado);
        } else {
          if (w > larguraMax) { h = Math.round(h * larguraMax / w); w = larguraMax; }
          tela.width = w; tela.height = h;
          tela.getContext('2d').drawImage(img, 0, 0, w, h);
        }
        pronto(formato === 'png' ? tela.toDataURL('image/png') : tela.toDataURL('image/jpeg', 0.82));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  /* Miniatura + escolher arquivo + caminho + tirar foto (usado em slides e informativos). */
  function blocoFoto(item, cfg) {
    var previa = el('div', { 'class': 'slide-prev mb-2' + (cfg.classeExtra || '') });
    var tirar = botao('Remover imagem', 'btn-outline-secondary text-nowrap', 'Remover imagem — ' + cfg.dono, function () {
      item.img = ''; cfg.redesenhar();
    }, !item.img);

    function pintar() {
      var img = item.img;
      previa.className = 'slide-prev mb-2 ' + (img ? '' : cfg.classeVazia()) + (cfg.classeExtra || '');
      previa.style.backgroundImage = img ? 'url("' + String(img).replace(/"/g, '%22') + '")' : '';
      previa.textContent = img ? '' : cfg.textoVazio;
      tirar.disabled = !img;
    }

    var arquivo = el('input', { type: 'file', accept: 'image/*', 'class': 'form-control form-control-sm mb-2', 'aria-label': 'Escolher foto — ' + cfg.dono });
    arquivo.addEventListener('change', function () {
      var f = arquivo.files && arquivo.files[0];
      if (!f) return;
      comprimirFoto(f, cfg.larguraMax, function (dataUrl) {
        if (!dataUrl) { aviso('Não consegui ler essa imagem. Tente um JPG ou PNG.', 'danger'); return; }
        item.img = dataUrl;
        cfg.redesenhar();
        aviso('Foto adicionada (' + Math.round(dataUrl.length / 1024) + ' KB, já reduzida).');
      }, cfg.formato, cfg.quadrado);
    });

    var caminho = el('input', {
      'class': 'form-control form-control-sm mb-2',
      placeholder: ehEmbutida(item.img) ? 'Foto embutida ✓ (ou digite img/foto.jpg)' : 'ou caminho: img/foto.jpg',
      'aria-label': 'Caminho da foto — ' + cfg.dono
    });
    caminho.value = ehEmbutida(item.img) ? '' : (item.img || '');
    caminho.addEventListener('input', function () { item.img = caminho.value.trim(); pintar(); });

    pintar();
    return { previa: previa, arquivo: arquivo, caminho: caminho, tirar: tirar, pintar: pintar };
  }

  /* O item recém-criado fica em primeiro: rola até ele, pisca e foca o título. */
  function destacarNovo(idArea) {
    var card = $(idArea).querySelector('.info-card, .slide-card');
    if (!card) return;
    card.classList.add('recem-criado');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var titulo = card.querySelector('input:not([type=file]):not([type=checkbox])');
    if (titulo) { titulo.focus({ preventScroll: true }); titulo.select(); }
  }

  /* ---------- logo e ícone ---------- */
  function desenharMarca() {
    var logo = { img: dados.marca.logo };
    var fl = blocoFoto(logo, {
      dono: 'logo', larguraMax: 600, formato: 'png', classeExtra: ' logo-prev', textoVazio: 'sem logo (usa o símbolo padrão)',
      classeVazia: function () { return ''; },
      redesenhar: function () { dados.marca.logo = logo.img; desenharMarca(); }
    });
    fl.caminho.addEventListener('input', function () { dados.marca.logo = logo.img; });
    fl.previa.style.height = '90px';
    var areaLogo = $('logoWrap'); areaLogo.innerHTML = '';
    [fl.previa, fl.arquivo, fl.caminho, fl.tirar].forEach(function (n) { areaLogo.appendChild(n); });
    fl.tirar.textContent = 'Voltar ao padrão';

    var nome = $('logoNome');
    nome.checked = dados.marca.mostrarNome;
    nome.onchange = function () { dados.marca.mostrarNome = nome.checked; };

    var icone = { img: dados.marca.favicon };
    var fi = blocoFoto(icone, {
      dono: 'ícone da aba', larguraMax: 128, quadrado: 128, formato: 'png', classeExtra: ' logo-prev', textoVazio: 'padrão',
      classeVazia: function () { return ''; },
      redesenhar: function () { dados.marca.favicon = icone.img; desenharMarca(); }
    });
    fi.caminho.addEventListener('input', function () { dados.marca.favicon = icone.img; });
    fi.previa.style.width = '96px'; fi.previa.style.height = '96px';
    var areaIcone = $('faviconWrap'); areaIcone.innerHTML = '';
    [fi.previa, fi.arquivo, fi.caminho, fi.tirar].forEach(function (n) { areaIcone.appendChild(n); });
    fi.tirar.textContent = 'Voltar ao padrão';
  }

  /* ---------- foto de "Quem somos" ---------- */
  function desenharFotoSobre() {
    var area = $('sobreFotoWrap');
    area.innerHTML = '';
    var item = { img: dados.textos.sobreImg || '' };
    var foto = blocoFoto(item, {
      dono: 'Quem somos', larguraMax: 1200, textoVazio: 'sem foto',
      classeVazia: function () { return 'info-sem-foto'; },
      redesenhar: function () { dados.textos.sobreImg = item.img; desenharFotoSobre(); }
    });
    foto.caminho.addEventListener('input', function () { dados.textos.sobreImg = item.img; });
    foto.previa.style.height = '160px';
    var alt = el('input', { 'class': 'form-control form-control-sm mb-2', placeholder: 'Descrição da foto (para leitores de tela)', 'aria-label': 'Descrição da foto — Quem somos' });
    alt.value = dados.textos.sobreImgAlt || '';
    alt.addEventListener('input', function () { dados.textos.sobreImgAlt = alt.value; });
    [foto.previa, foto.arquivo, foto.caminho, alt, foto.tirar].forEach(function (n) { area.appendChild(n); });
  }

  /* ---------- seções personalizadas ---------- */
  function desenharExtras() {
    var area = $('extrasWrap');
    area.innerHTML = '';
    if (!dados.extras.length) {
      area.appendChild(el('p', { 'class': 'text-secondary small mb-0', text: 'Nenhuma seção personalizada.' }));
      return;
    }
    var total = dados.extras.length;
    dados.extras.forEach(function (s, i) {
      var dono = 'seção ' + (i + 1);

      var ativa = el('input', { type: 'checkbox', role: 'switch', 'class': 'form-check-input', id: 'extraAtiva' + i });
      ativa.checked = s.ativa;
      ativa.addEventListener('change', function () { s.ativa = ativa.checked; card.classList.toggle('extra-inativa', !s.ativa); });

      var cab = el('div', { 'class': 'd-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap' }, [
        el('div', { 'class': 'd-flex align-items-center gap-3' }, [
          el('strong', { text: 'Seção ' + (i + 1) }),
          el('div', { 'class': 'form-check form-switch mb-0' }, [ativa, el('label', { 'class': 'form-check-label small', 'for': 'extraAtiva' + i, text: 'Visível no site' })])
        ]),
        el('div', { 'class': 'btn-group' }, [
          botao('↑', 'btn-outline-secondary', 'Mover ' + dono + ' para cima', function () { dados.extras.splice(i - 1, 0, dados.extras.splice(i, 1)[0]); desenharExtras(); }, i === 0),
          botao('↓', 'btn-outline-secondary', 'Mover ' + dono + ' para baixo', function () { dados.extras.splice(i + 1, 0, dados.extras.splice(i, 1)[0]); desenharExtras(); }, i === total - 1),
          botao('Remover', 'btn-outline-danger', 'Remover ' + dono, function () { dados.extras.splice(i, 1); desenharExtras(); })
        ])
      ]);

      var texto = el('textarea', { 'class': 'form-control mb-2', rows: '6', 'aria-label': 'Texto — ' + dono,
        placeholder: 'Texto da seção. Deixe uma linha em branco entre os parágrafos; links (https://…) ficam clicáveis.' });
      texto.value = s.texto;
      texto.addEventListener('input', function () { s.texto = texto.value; });

      var onde = el('select', { 'class': 'form-select form-select-sm', 'aria-label': 'Onde a seção aparece — ' + dono });
      ADDAI.POSICOES.forEach(function (p) {
        var o = el('option', { value: p[0], text: 'Depois de: ' + p[1] });
        if (s.depoisDe === p[0]) o.selected = true;
        onde.appendChild(o);
      });
      onde.addEventListener('change', function () { s.depoisDe = onde.value; });

      var noMenu = el('input', { type: 'checkbox', 'class': 'form-check-input', id: 'extraMenu' + i });
      noMenu.checked = s.menu;
      var nomeMenu = campo(s, 'menuNome', 'Nome no menu (curto, ex.: Eventos)', dono, 'form-control form-control-sm mt-1');
      nomeMenu.classList.toggle('d-none', !s.menu);
      noMenu.addEventListener('change', function () { s.menu = noMenu.checked; nomeMenu.classList.toggle('d-none', !s.menu); });

      var colTextos = el('div', { 'class': 'col-md-7' }, [
        campo(s, 'etiqueta', 'Etiqueta pequena acima do título (opcional)', dono),
        campo(s, 'titulo', 'Título', dono),
        texto,
        el('div', { 'class': 'row g-2' }, [
          el('div', { 'class': 'col-6' }, [campo(s, 'botaoTexto', 'Texto do botão (opcional)', dono)]),
          el('div', { 'class': 'col-6' }, [campo(s, 'botaoLink', 'Link do botão (ex.: #contato)', dono)])
        ])
      ]);

      var foto = blocoFoto(s, {
        dono: dono, larguraMax: 1200, textoVazio: 'sem imagem (texto centralizado)',
        classeVazia: function () { return 'info-sem-foto'; },
        redesenhar: desenharExtras
      });
      var lado = el('select', { 'class': 'form-select form-select-sm', 'aria-label': 'Lado da imagem — ' + dono });
      [['direita', 'Imagem à direita'], ['esquerda', 'Imagem à esquerda']].forEach(function (o) {
        var op = el('option', { value: o[0], text: o[1] }); if (s.ladoImg === o[0]) op.selected = true; lado.appendChild(op);
      });
      lado.addEventListener('change', function () { s.ladoImg = lado.value; });

      var colLado = el('div', { 'class': 'col-md-5' }, [
        el('label', { 'class': 'form-label small mb-1', text: 'Posição na página' }), onde,
        el('div', { 'class': 'form-check mt-2' }, [noMenu, el('label', { 'class': 'form-check-label small', 'for': 'extraMenu' + i, text: 'Mostrar no menu' })]),
        nomeMenu,
        el('hr', { 'class': 'my-3' }),
        foto.previa, foto.arquivo, foto.caminho,
        campo(s, 'imgAlt', 'Descrição da imagem (para leitores de tela)', dono, 'form-control form-control-sm mb-2'),
        el('div', { 'class': 'd-flex gap-2' }, [lado, foto.tirar])
      ]);

      var card = el('div', { 'class': 'info-card p-3' + (s.ativa ? '' : ' extra-inativa') }, [cab, el('div', { 'class': 'row g-3' }, [colTextos, colLado])]);
      area.appendChild(card);
    });
  }

  /* ---------- seções ---------- */
  function desenharSecoes() {
    var area = $('secoesWrap');
    area.innerHTML = '';
    ADDAI.SECOES.forEach(function (s) {
      var id = 'sec_' + s[0];
      var chk = el('input', { type: 'checkbox', role: 'switch', 'class': 'form-check-input', id: id });
      chk.checked = !!dados.secoes[s[0]];
      chk.addEventListener('change', function () { dados.secoes[s[0]] = chk.checked; });
      area.appendChild(el('div', { 'class': 'form-check form-switch mb-2' }, [chk, el('label', { 'class': 'form-check-label', 'for': id, text: s[1] })]));
    });
  }

  /* ---------- números de impacto ---------- */
  function desenharImpacto() {
    var area = $('impactoWrap');
    area.innerHTML = '';
    if (!dados.impacto.length) {
      area.appendChild(el('p', { 'class': 'text-secondary small mb-0', text: 'Nenhum número. A faixa de impacto não aparece no site.' }));
      return;
    }
    dados.impacto.forEach(function (item, i) {
      var dono = 'número ' + (i + 1);
      area.appendChild(el('div', { 'class': 'item-linha p-2 d-flex gap-2 align-items-center' }, [
        el('div', { 'style': 'width:7.5rem;flex:none' }, [campo(item, 'valor', 'Valor (+120)', dono, 'form-control')]),
        el('div', { 'class': 'flex-grow-1' }, [campo(item, 'rotulo', 'Texto (famílias acolhidas)', dono, 'form-control')]),
        botao('✕', 'btn-outline-danger', 'Remover ' + dono, function () { dados.impacto.splice(i, 1); desenharImpacto(); })
      ]));
    });
  }

  /* ---------- parceiros ---------- */
  function desenharParceiros() {
    var area = $('parceirosWrap');
    area.innerHTML = '';
    if (!dados.parceiros.length) {
      area.appendChild(el('p', { 'class': 'text-secondary small mb-0', text: 'Nenhum parceiro cadastrado.' }));
      return;
    }
    dados.parceiros.forEach(function (p, i) {
      var dono = 'parceiro ' + (i + 1);
      var item = { img: p.logo }; // blocoFoto trabalha com "img"
      var foto = blocoFoto(item, {
        dono: dono, larguraMax: 400, formato: 'png', textoVazio: 'sem logo (mostra o nome)', classeExtra: ' logo-prev',
        classeVazia: function () { return ''; },
        redesenhar: function () { p.logo = item.img; desenharParceiros(); }
      });
      foto.caminho.addEventListener('input', function () { p.logo = item.img; });

      var cab = el('div', { 'class': 'd-flex justify-content-between align-items-center mb-3' }, [
        el('strong', { text: 'Parceiro ' + (i + 1) }),
        botao('Remover', 'btn-outline-danger', 'Remover ' + dono, function () { dados.parceiros.splice(i, 1); desenharParceiros(); })
      ]);
      var colTextos = el('div', { 'class': 'col-md-7' }, [
        campo(p, 'nome', 'Nome do parceiro', dono),
        campo(p, 'link', 'Site ou Instagram (https://…), opcional', dono)
      ]);
      var colLogo = el('div', { 'class': 'col-md-5' }, [foto.previa, foto.arquivo, foto.caminho, foto.tirar]);
      area.appendChild(el('div', { 'class': 'info-card p-3' }, [cab, el('div', { 'class': 'row g-3' }, [colTextos, colLogo])]));
    });
  }

  /* ---------- informativos ---------- */
  function desenharInformativos() {
    var area = $('infosWrap');
    area.innerHTML = '';
    if (!dados.informativos.length) {
      area.appendChild(el('p', { 'class': 'text-secondary mb-0', text: 'Nenhum informativo. Enquanto a lista estiver vazia, a seção não aparece no site.' }));
      return;
    }

    dados.informativos.forEach(function (inf, i) {
      var dono = 'informativo ' + (i + 1);

      var cabecalho = el('div', { 'class': 'd-flex justify-content-between align-items-center mb-3' }, [
        el('strong', { text: 'Informativo ' + (i + 1) }),
        botao('Remover', 'btn-outline-danger', 'Remover ' + dono, function () {
          dados.informativos.splice(i, 1); desenharInformativos();
        })
      ]);

      var data = el('input', { type: 'date', 'class': 'form-control mb-2', 'aria-label': 'Data — ' + dono });
      data.value = inf.data || '';
      data.addEventListener('input', function () { inf.data = data.value; });

      var texto = el('textarea', {
        'class': 'form-control', rows: '6', 'aria-label': 'Texto — ' + dono,
        placeholder: 'Texto completo. Deixe uma linha em branco entre os parágrafos; links (https://…) ficam clicáveis.'
      });
      texto.value = inf.texto || '';
      texto.addEventListener('input', function () { inf.texto = texto.value; });

      var foto = blocoFoto(inf, {
        dono: dono, larguraMax: LARGURA_INFO, textoVazio: 'sem foto',
        classeVazia: function () { return 'info-sem-foto'; },
        redesenhar: desenharInformativos
      });

      var colTextos = el('div', { 'class': 'col-md-7' }, [campo(inf, 'titulo', 'Título', dono), data, texto]);
      var colFoto = el('div', { 'class': 'col-md-5' }, [
        foto.previa, foto.arquivo, foto.caminho,
        campo(inf, 'imgAlt', 'Descrição da foto (para leitores de tela)', dono, 'form-control form-control-sm mb-2'),
        foto.tirar
      ]);

      area.appendChild(el('div', { 'class': 'info-card p-3' }, [cabecalho, el('div', { 'class': 'row g-3' }, [colTextos, colFoto])]));
    });
  }

  /* ---------- slides ---------- */
  function desenharSlides() {
    var area = $('slidesWrap');
    area.innerHTML = '';
    var total = dados.slides.length;

    dados.slides.forEach(function (s, i) {
      var dono = 'slide ' + (i + 1);

      var acoes = el('div', { 'class': 'btn-group' }, [
        botao('↑', 'btn-outline-secondary', 'Mover slide ' + (i + 1) + ' para cima', function () {
          dados.slides.splice(i - 1, 0, dados.slides.splice(i, 1)[0]); desenharSlides();
        }, i === 0),
        botao('↓', 'btn-outline-secondary', 'Mover slide ' + (i + 1) + ' para baixo', function () {
          dados.slides.splice(i + 1, 0, dados.slides.splice(i, 1)[0]); desenharSlides();
        }, i === total - 1),
        botao('Remover', 'btn-outline-danger', 'Remover slide ' + (i + 1), function () {
          dados.slides.splice(i, 1); desenharSlides();
        }, total === 1)
      ]);
      var cabecalho = el('div', { 'class': 'd-flex justify-content-between align-items-center mb-3' }, [
        el('strong', { text: 'Slide ' + (i + 1) }), acoes
      ]);

      var colTextos = el('div', { 'class': 'col-md-7' }, [
        campo(s, 'titulo', 'Título', dono),
        campo(s, 'subtitulo', 'Subtítulo', dono),
        el('p', { 'class': 'small text-secondary mb-2', text: 'Se a imagem já tem texto, deixe título e subtítulo vazios.' }),
        el('div', { 'class': 'row g-2' }, [
          el('div', { 'class': 'col-6' }, [campo(s, 'botaoTexto', 'Texto do botão', dono)]),
          el('div', { 'class': 'col-6' }, [campo(s, 'botaoLink', 'Link (ex.: #ajudar)', dono)])
        ])
      ]);

      var foto = blocoFoto(s, {
        dono: dono, larguraMax: LARGURA_SLIDE, textoVazio: 'sem foto (usa a cor de fundo)',
        classeVazia: function () { return s.cor || 'slide-a'; },
        redesenhar: desenharSlides
      });

      var cor = el('select', { 'class': 'form-select form-select-sm', 'aria-label': 'Cor de fundo (quando não há foto) — ' + dono });
      CORES.forEach(function (c) {
        var o = el('option', { value: c[0], text: 'Fundo ' + c[1] });
        if (s.cor === c[0]) o.selected = true;
        cor.appendChild(o);
      });
      cor.addEventListener('change', function () { s.cor = cor.value; foto.pintar(); });

      // como mostrar a foto
      var ajuste = el('select', { 'class': 'form-select form-select-sm mt-2', 'aria-label': 'Como mostrar a foto — ' + dono });
      [['cobrir', 'Preencher a área (pode cortar as bordas)'], ['inteira', 'Imagem inteira, sem cortar (banner com texto)']].forEach(function (o) {
        var op = el('option', { value: o[0], text: o[1] });
        if ((s.ajuste || 'cobrir') === o[0]) op.selected = true;
        ajuste.appendChild(op);
      });
      ajuste.addEventListener('change', function () { s.ajuste = ajuste.value; desenharSlides(); });
      if (s.ajuste === 'inteira') foto.previa.style.backgroundSize = 'contain';

      // foto alternativa para celular
      var cel = { img: s.imgCelular || '' };
      var fotoCel = blocoFoto(cel, {
        dono: dono + ' (celular)', larguraMax: LARGURA_SLIDE_CEL, textoVazio: 'usa a mesma foto',
        classeVazia: function () { return 'info-sem-foto'; },
        redesenhar: function () { s.imgCelular = cel.img; desenharSlides(); }
      });
      fotoCel.caminho.addEventListener('input', function () { s.imgCelular = cel.img; });
      if (s.ajuste === 'inteira') fotoCel.previa.style.backgroundSize = 'contain';
      var abrirCel = !!s.imgCelular;
      var detalhesCel = el('details', { 'class': 'mt-2 small' }, [
        el('summary', { 'class': 'text-secondary', text: 'Foto diferente para celular (opcional)' }),
        el('div', { 'class': 'mt-2' }, [
          el('p', { 'class': 'text-secondary mb-2', text: 'Use uma versão em pé (vertical) da arte, para não ficar pequena ou cortada no celular.' }),
          fotoCel.previa, fotoCel.arquivo, fotoCel.caminho, fotoCel.tirar
        ])
      ]);
      if (abrirCel) detalhesCel.open = true;

      var colFoto = el('div', { 'class': 'col-md-5' }, [
        foto.previa, foto.arquivo, foto.caminho, el('div', { 'class': 'd-flex gap-2' }, [cor, foto.tirar]),
        ajuste,
        campo(s, 'imgAlt', 'Descrição da imagem (para leitores de tela)', dono, 'form-control form-control-sm mt-2'),
        detalhesCel
      ]);

      area.appendChild(el('div', { 'class': 'slide-card p-3' }, [cabecalho, el('div', { 'class': 'row g-3' }, [colTextos, colFoto])]));
    });
  }

  /* ---------- publicar ---------- */
  function tamanhoKb(texto) { return Math.max(1, Math.round(new Blob([texto]).size / 1024)); }

  function baixarCopia() {
    coletar();
    var texto = JSON.stringify(dados, null, 2) + '\n';
    var kb = tamanhoKb(texto);
    $('jsonInfo').textContent = 'Tamanho: ' + kb + ' KB' +
      (kb > 900 ? ' — está grande. Para ficar leve, suba as fotos na pasta img/ do repositório e use o caminho (img/foto.jpg).' : '');
    try {
      var link = el('a', { href: URL.createObjectURL(new Blob([texto], { type: 'application/json' })), download: 'conteudo-' + hoje() + '.json' });
      document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { aviso('Não consegui baixar o arquivo neste navegador.', 'warning'); }
  }

  function publicar(mensagem) {
    coletar();
    var botao = $('publicar');
    botao.disabled = true; botao.textContent = 'Publicando…';
    return GitHub.publicar(dados, mensagem).then(function () {
      ADDAI.apagarRascunho();
      $('avisoRascunho').classList.add('d-none');
      aviso('Publicado! O site atualiza para todos em cerca de 1 minuto.');
    }).catch(function (e) {
      if (e.status === 401) { sairDoPainel(); }
      aviso(e.message, 'danger');
    }).then(function () { botao.disabled = false; botao.textContent = 'Publicar no site'; });
  }

  function salvar() {
    coletar();
    try {
      ADDAI.salvarRascunho(dados);
      $('avisoRascunho').classList.remove('d-none');
      return true;
    } catch (e) {
      aviso('Sem espaço para salvar o rascunho neste navegador. Use fotos menores ou caminhos img/…', 'danger');
      return false;
    }
  }

  /* ---------- ligações ---------- */
  /* ---------- login ---------- */
  function mostrarLogin(msg) {
    $('areaPainel').classList.add('d-none');
    $('telaLogin').classList.remove('d-none');
    $('usuario').classList.add('d-none');
    $('sair').classList.add('d-none');
    var caixa = $('erroLogin');
    caixa.textContent = msg || '';
    caixa.classList.toggle('d-none', !msg);
  }

  function sairDoPainel() { GitHub.sair(); mostrarLogin(); }

  /* Depois do login: mostra o painel e carrega o conteúdo do repositório. */
  function abrirPainel(info) {
    $('telaLogin').classList.add('d-none');
    $('areaPainel').classList.remove('d-none');
    if (info.usuario) { $('usuario').textContent = 'Conectado como ' + info.usuario; $('usuario').classList.remove('d-none'); }
    $('sair').classList.remove('d-none');

    var rascunho = ADDAI.lerRascunho();
    return GitHub.carregar().then(function (c) {
      if (rascunho) {
        dados = ADDAI.completar(rascunho);
        $('avisoRascunho').classList.remove('d-none');
      } else {
        dados = ADDAI.completar(c);
      }
      preencher();
    }).catch(function (e) {
      if (e.status === 401) { sairDoPainel(); mostrarLogin(e.message); return; }
      aviso(e.message, 'danger');
    });
  }

  function entrar(chave, lembrar) {
    var botao = $('btnEntrar');
    botao.disabled = true; botao.textContent = 'Entrando…';
    return GitHub.entrar(chave, lembrar)
      .then(abrirPainel)
      .catch(function (e) { mostrarLogin(e.message); })
      .then(function () { botao.disabled = false; botao.textContent = 'Entrar'; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ADDAI.sairDaPrevia(); // voltar ao painel encerra a prévia

    // abas: lembra a última aba aberta nesta sessão e mostra quantos itens cada lista tem
    try {
      var abaSalva = sessionStorage.getItem('addai_aba');
      var botaoAba = abaSalva && document.querySelector('[data-aba="' + abaSalva + '"]');
      if (botaoAba) bootstrap.Tab.getOrCreateInstance(botaoAba).show();
    } catch (e) {}
    document.querySelectorAll('[data-aba]').forEach(function (b) {
      b.addEventListener('shown.bs.tab', function () { try { sessionStorage.setItem('addai_aba', b.getAttribute('data-aba')); } catch (e) {} });
    });
    document.querySelectorAll('[data-conta]').forEach(function (badge) {
      var lista = $(badge.getAttribute('data-conta'));
      var contar = function () { badge.textContent = lista.querySelectorAll(':scope > .info-card, :scope > .slide-card').length; };
      new MutationObserver(contar).observe(lista, { childList: true });
      contar();
    });
    $('nomeRepo').textContent = GitHub.repositorio().split('/')[1];

    $('formLogin').addEventListener('submit', function (e) {
      e.preventDefault();
      entrar($('token').value, $('lembrar').checked).then(function () { $('token').value = ''; });
    });
    $('sair').addEventListener('click', function () { sairDoPainel(); aviso('Você saiu do painel.', 'secondary'); });

    var salvo = GitHub.lerTokenSalvo();
    if (salvo) entrar(salvo, !!(function () { try { return localStorage.getItem('addai_github_token'); } catch (e) { return null; } })());
    else mostrarLogin();

    $('addInfo').addEventListener('click', function () {
      dados.informativos.unshift({ id: 'i' + Date.now().toString(36), titulo: 'Novo informativo', data: hoje(), img: '', imgAlt: '', texto: '' });
      desenharInformativos();
      destacarNovo('infosWrap');
    });

    $('addExtra').addEventListener('click', function () {
      dados.extras.unshift({ id: 's' + Date.now().toString(36), ativa: true, etiqueta: '', titulo: 'Nova seção', texto: '', img: '', imgAlt: '',
        ladoImg: 'direita', botaoTexto: '', botaoLink: '', depoisDe: 'projetos', menu: false, menuNome: '' });
      desenharExtras();
      destacarNovo('extrasWrap');
    });

    $('addImpacto').addEventListener('click', function () {
      dados.impacto.push({ valor: '', rotulo: '' });
      desenharImpacto();
    });

    $('addParceiro').addEventListener('click', function () {
      dados.parceiros.push({ nome: '', link: '', logo: '' });
      desenharParceiros();
      var ultimo = $('parceirosWrap').querySelectorAll('.info-card');
      ultimo = ultimo[ultimo.length - 1];
      if (ultimo) ultimo.querySelector('input').focus();
    });

    $('addSlide').addEventListener('click', function () {
      dados.slides.unshift({ titulo: 'Novo slide', subtitulo: '', img: '', cor: 'slide-a', botaoTexto: '', botaoLink: '#ajudar' });
      desenharSlides();
      destacarNovo('slidesWrap');
    });

    $('salvar').addEventListener('click', function () {
      if (salvar()) aviso('Rascunho salvo neste navegador. Clique em "Ver prévia" para conferir.');
    });

    $('previa').addEventListener('click', function () {
      if (!salvar()) return;
      ADDAI.entrarNaPrevia();
      window.location.href = 'index.html#previa';
    });

    $('baixar').addEventListener('click', baixarCopia);

    var modalPublicar = new bootstrap.Modal($('modalPublicar'));
    $('publicar').addEventListener('click', function () { $('msgPublicar').value = ''; modalPublicar.show(); });
    $('confirmarPublicar').addEventListener('click', function () {
      var msg = $('msgPublicar').value.trim();
      modalPublicar.hide();
      publicar(msg ? msg + ' (painel)' : 'Atualiza conteúdo pelo painel');
    });

    // descartar rascunho (confirmação em janela do próprio painel)
    var modal = new bootstrap.Modal($('modalDescartar'));
    $('descartar').addEventListener('click', function () { modal.show(); });
    $('confirmarDescartar').addEventListener('click', function () {
      ADDAI.apagarRascunho();
      modal.hide();
      $('avisoRascunho').classList.add('d-none');
      $('jsonInfo').textContent = '';
      GitHub.carregar().then(function (c) {
        dados = ADDAI.completar(c); preencher();
        aviso('Rascunho descartado. Mostrando o conteúdo publicado.', 'secondary');
      });
    });
  });
})();
