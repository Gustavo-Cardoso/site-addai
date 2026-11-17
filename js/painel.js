/* =====================================================================
   painel.js — painel de controle (informativos, carrossel, textos, dados)
   (depende de js/conteudo-padrao.js e do Bootstrap)

   O painel NÃO publica nada sozinho: ele monta o conteudo.json.
   Só quem tem acesso ao repositório no GitHub consegue publicar.
   ===================================================================== */
(function () {
  var CAMPOS = ['navDoar', 'bemvindoTitulo', 'bemvindoTexto', 'sobreTitulo', 'sobreTexto', 'chamadaDoacao',
                'telefone', 'email', 'endereco', 'pixChave', 'pixTitular', 'cnpj'];
  var CORES = [['slide-a', 'Azul'], ['slide-b', 'Verde'], ['slide-c', 'Laranja']];
  var LARGURA_SLIDE = 1600; // fotos maiores são reduzidas antes de embutir
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

  /* ---------- formulário <-> modelo ---------- */
  function preencher() {
    CAMPOS.forEach(function (k) {
      var campo = $('t_' + k);
      if (campo) campo.value = dados.textos[k] || '';
    });
    desenharInformativos();
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
  function comprimirFoto(arquivo, larguraMax, pronto) {
    var leitor = new FileReader();
    leitor.onerror = function () { pronto(null); };
    leitor.onload = function () {
      var img = new Image();
      img.onerror = function () { pronto(null); };
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (w > larguraMax) { h = Math.round(h * larguraMax / w); w = larguraMax; }
        var tela = document.createElement('canvas');
        tela.width = w; tela.height = h;
        tela.getContext('2d').drawImage(img, 0, 0, w, h);
        pronto(tela.toDataURL('image/jpeg', 0.82));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  /* Miniatura + escolher arquivo + caminho + tirar foto (usado em slides e informativos). */
  function blocoFoto(item, cfg) {
    var previa = el('div', { 'class': 'slide-prev mb-2' });
    var tirar = botao('Tirar foto', 'btn-outline-secondary text-nowrap', 'Remover a foto — ' + cfg.dono, function () {
      item.img = ''; cfg.redesenhar();
    }, !item.img);

    function pintar() {
      var img = item.img;
      previa.className = 'slide-prev mb-2 ' + (img ? '' : cfg.classeVazia());
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
      });
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

      var colFoto = el('div', { 'class': 'col-md-5' }, [foto.previa, foto.arquivo, foto.caminho, el('div', { 'class': 'd-flex gap-2' }, [cor, foto.tirar])]);

      area.appendChild(el('div', { 'class': 'slide-card p-3' }, [cabecalho, el('div', { 'class': 'row g-3' }, [colTextos, colFoto])]));
    });
  }

  /* ---------- publicar ---------- */
  function gerar() {
    coletar();
    var texto = JSON.stringify(dados, null, 2);
    $('jsonOut').value = texto;
    var kb = Math.max(1, Math.round(texto.length / 1024));
    $('jsonInfo').textContent = 'Tamanho do arquivo: ' + kb + ' KB' +
      (kb > 900 ? ' — está grande. Para ficar leve, suba as fotos na pasta img/ do repositório e use o caminho (img/foto.jpg).' : '');
    return texto;
  }

  function copiar(texto) {
    var ok = function () { aviso('Copiado! Agora cole no conteudo.json do repositório.'); };
    var reserva = function () {
      var area = $('jsonOut');
      area.focus(); area.select();
      try { document.execCommand('copy'); ok(); }
      catch (e) { aviso('Selecione o texto da caixa e copie com Ctrl+C.', 'warning'); }
    };
    try { navigator.clipboard.writeText(texto).then(ok).catch(reserva); } catch (e) { reserva(); }
  }

  /* No GitHub Pages dá para descobrir o repositório pelo endereço do site. */
  function repositorioGitHub() {
    var m = /^([^.]+)\.github\.io$/i.exec(location.hostname);
    if (!m) return null;
    var partes = location.pathname.split('/').filter(Boolean);
    var repo = (partes.length && !/\.html?$/i.test(partes[0])) ? partes[0] : location.hostname;
    return m[1] + '/' + repo;
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
  document.addEventListener('DOMContentLoaded', function () {
    ADDAI.sairDaPrevia(); // voltar ao painel encerra a prévia

    var rascunho = ADDAI.lerRascunho();
    if (rascunho) {
      dados = ADDAI.completar(rascunho);
      $('avisoRascunho').classList.remove('d-none');
      preencher();
    } else {
      preencher(); // mostra o padrão na hora…
      ADDAI.carregarPublicado().then(function (c) { dados = c; preencher(); }); // …e troca pelo publicado
    }

    $('addInfo').addEventListener('click', function () {
      dados.informativos.unshift({ id: 'i' + Date.now().toString(36), titulo: 'Novo informativo', data: hoje(), img: '', imgAlt: '', texto: '' });
      desenharInformativos();
      var primeiro = $('infosWrap').querySelector('input');
      if (primeiro) { primeiro.focus(); primeiro.select(); }
    });

    $('addSlide').addEventListener('click', function () {
      dados.slides.push({ titulo: 'Novo slide', subtitulo: '', img: '', cor: 'slide-a', botaoTexto: '', botaoLink: '#ajudar' });
      desenharSlides();
    });

    $('salvar').addEventListener('click', function () {
      if (salvar()) aviso('Rascunho salvo neste navegador. Clique em "Ver prévia" para conferir.');
    });

    $('previa').addEventListener('click', function () {
      if (!salvar()) return;
      ADDAI.entrarNaPrevia();
      window.location.href = 'index.html#previa';
    });

    $('gerar').addEventListener('click', function () { copiar(gerar()); });

    $('baixar').addEventListener('click', function () {
      var texto = gerar();
      try {
        var link = el('a', { href: URL.createObjectURL(new Blob([texto], { type: 'application/json' })), download: 'conteudo.json' });
        document.body.appendChild(link); link.click(); link.remove();
        aviso('Se o download não começar, use o botão "Gerar e copiar".', 'secondary');
      } catch (e) { aviso('Download indisponível aqui — use "Gerar e copiar".', 'warning'); }
    });

    var repo = repositorioGitHub();
    if (repo) {
      var abrir = $('abrirGitHub');
      abrir.href = 'https://github.com/' + repo + '/edit/main/conteudo.json';
      abrir.classList.remove('d-none');
    }

    // descartar rascunho (confirmação em janela do próprio painel)
    var modal = new bootstrap.Modal($('modalDescartar'));
    $('descartar').addEventListener('click', function () { modal.show(); });
    $('confirmarDescartar').addEventListener('click', function () {
      ADDAI.apagarRascunho();
      modal.hide();
      $('avisoRascunho').classList.add('d-none');
      $('jsonOut').value = '';
      $('jsonInfo').textContent = '';
      ADDAI.carregarPublicado().then(function (c) {
        dados = c; preencher();
        aviso('Rascunho descartado. Mostrando o conteúdo publicado.', 'secondary');
      });
    });
  });
})();
