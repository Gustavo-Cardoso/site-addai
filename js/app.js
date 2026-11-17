/* =====================================================================
   app.js — página inicial: textos, carrossel, informativos em destaque
   (depende de js/conteudo-padrao.js, js/informativos.js e do Bootstrap)
   ===================================================================== */
(function () {
  function $(id) { return document.getElementById(id); }

  /* ---------- carrossel ---------- */
  function montarCarrossel(c) {
    var raiz = $('carrossel');
    var inner = $('carrosselInner');
    var indicadores = $('carrosselIndicadores');
    if (!raiz || !inner) return;
    inner.innerHTML = '';
    indicadores.innerHTML = '';

    c.slides.forEach(function (s, i) {
      var ind = document.createElement('button');
      ind.type = 'button';
      ind.setAttribute('data-bs-target', '#carrossel');
      ind.setAttribute('data-bs-slide-to', String(i));
      ind.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
      if (i === 0) { ind.className = 'active'; ind.setAttribute('aria-current', 'true'); }
      indicadores.appendChild(ind);

      var item = document.createElement('div');
      item.className = 'carousel-item' + (i === 0 ? ' active' : '');

      var inteira = s.ajuste === 'inteira' && !!s.img;
      var fundo = document.createElement('div');

      if (inteira) {
        // Banner: mostra a imagem inteira, sem cortar (bom para artes com texto).
        fundo.className = 'slide-inteira';
        var pic = document.createElement('picture');
        if (s.imgCelular) {
          var fonte = document.createElement('source');
          fonte.media = '(max-width: 767.98px)';
          fonte.srcset = s.imgCelular;
          pic.appendChild(fonte);
        }
        var foto = document.createElement('img');
        foto.className = 'slide-banner';
        foto.src = s.img;
        foto.alt = s.imgAlt || s.titulo || '';
        if (i > 0) foto.loading = 'lazy';
        pic.appendChild(foto);
        fundo.appendChild(pic);
      } else {
        // Foto de fundo preenchendo a área (pode cortar as bordas) ou cor.
        fundo.className = 'slide-bg ' + (s.cor || 'slide-a');
        if (s.img) {
          fundo.style.backgroundImage = 'url("' + String(s.img).replace(/"/g, '%22') + '")';
          if (s.imgAlt) { fundo.setAttribute('role', 'img'); fundo.setAttribute('aria-label', s.imgAlt); }
        }
        if (s.imgCelular) {
          fundo.classList.add('tem-celular');
          fundo.style.setProperty('--img-celular', 'url("' + String(s.imgCelular).replace(/"/g, '%22') + '")');
        }
      }

      // Legenda só quando há texto ou botão (banners com texto na arte ficam limpos).
      if (s.titulo || s.subtitulo || s.botaoTexto) {
        var legenda = document.createElement('div');
        legenda.className = 'carousel-caption';
        if (s.titulo) { var h = document.createElement('h2'); h.textContent = s.titulo; legenda.appendChild(h); }
        if (s.subtitulo) { var p = document.createElement('p'); p.textContent = s.subtitulo; legenda.appendChild(p); }
        if (s.botaoTexto) {
          var a = document.createElement('a');
          a.className = 'btn btn-marca btn-lg mt-2';
          a.href = s.botaoLink || '#ajudar';
          a.textContent = s.botaoTexto;
          legenda.appendChild(a);
        }
        fundo.appendChild(legenda);
      }
      item.appendChild(fundo);
      inner.appendChild(item);
    });

    // Quem prefere menos movimento não recebe troca automática de slides.
    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var carrossel = new bootstrap.Carousel(raiz, { interval: 6000, ride: menosMovimento ? false : 'carousel' });

    // Botão pausar/continuar (acessibilidade: o visitante controla o movimento)
    var btnPausa = $('carrosselPausa');
    if (btnPausa) {
      var rodando = !menosMovimento;
      var pintar = function () {
        btnPausa.textContent = rodando ? '❚❚' : '▶';
        btnPausa.setAttribute('aria-label', rodando ? 'Pausar a troca automática de slides' : 'Retomar a troca automática de slides');
      };
      pintar();
      btnPausa.addEventListener('click', function () {
        rodando = !rodando;
        if (rodando) carrossel.cycle(); else carrossel.pause();
        pintar();
      });
    }
  }

  /* ---------- Quem somos ---------- */
  function montarSobre(c) {
    var tx = c.textos;
    var temFoto = !!tx.sobreImg;
    $('sobreFotoCol').classList.toggle('d-none', !temFoto);
    $('sobreTextoCol').className = temFoto ? 'col-lg-6' : 'col-lg-9';
    var foto = $('sobreFoto');
    if (temFoto) { foto.src = tx.sobreImg; foto.alt = tx.sobreImgAlt || ''; } else { foto.removeAttribute('src'); }

    Informativos.textoParaDom(tx.sobreTexto, $('sobreTexto'));

    var cartoes = [['🎯 Missão', tx.missao, false], ['🌱 Visão', tx.visao, false], ['💙 Valores', tx.valores, true]]
      .filter(function (x) { return String(x[1] || '').trim(); });
    var grade = $('mvvGrid');
    grade.innerHTML = '';
    cartoes.forEach(function (x, i) {
      var classe = cartoes.length === 1 ? 'col-12'
        : cartoes.length === 2 ? 'col-sm-6'
        : (temFoto ? (i === 2 ? 'col-12' : 'col-sm-6') : 'col-md-4');
      var col = document.createElement('div'); col.className = classe;
      var card = document.createElement('div'); card.className = 'mini-card';
      var h = document.createElement('h3'); h.textContent = x[0]; card.appendChild(h);
      var linhas = String(x[1]).split('\n').map(function (l) { return l.replace(/^[-•*]\s*/, '').trim(); }).filter(Boolean);
      if (x[2] && linhas.length > 1) {          // valores: um por linha vira lista
        var ul = document.createElement('ul');
        linhas.forEach(function (l) { var li = document.createElement('li'); li.textContent = l; ul.appendChild(li); });
        card.appendChild(ul);
      } else {
        var p = document.createElement('p'); p.textContent = linhas.join(' '); card.appendChild(p);
      }
      col.appendChild(card); grade.appendChild(col);
    });
    grade.classList.toggle('d-none', !cartoes.length);
  }

  /* ---------- seções personalizadas (criadas no painel) ---------- */
  function montarExtras(c) {
    document.querySelectorAll('section[data-extra-secao]').forEach(function (s) { s.remove(); });
    var ultimoDepois = {}; // mantém a ordem quando várias entram no mesmo lugar
    c.extras.forEach(function (s) {
      if (!s.ativa) return;
      var ancora = ultimoDepois[s.depoisDe] || $(s.depoisDe);
      if (!ancora) return;

      var sec = document.createElement('section');
      sec.id = 'sec-' + s.id;
      sec.className = 'py-5 bg-white secao-alterna secao-extra';
      sec.setAttribute('data-extra-secao', '');
      var box = document.createElement('div'); box.className = 'container';

      var texto = document.createElement('div');
      if (s.etiqueta) { var e = document.createElement('span'); e.className = 'eyebrow'; e.textContent = s.etiqueta; texto.appendChild(e); }
      if (s.titulo) { var h = document.createElement('h2'); h.className = 'fw-bold mt-2 mb-3'; h.textContent = s.titulo; texto.appendChild(h); }
      var corpo = document.createElement('div'); corpo.className = 'texto-extra text-secondary';
      Informativos.textoParaDom(s.texto, corpo);
      texto.appendChild(corpo);
      if (s.botaoTexto) {
        var a = document.createElement('a');
        a.className = 'btn btn-marca mt-2';
        a.href = s.botaoLink || '#contato';
        if (/^https?:\/\//i.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
        a.textContent = s.botaoTexto;
        texto.appendChild(a);
      }

      if (s.img) {
        var linha = document.createElement('div'); linha.className = 'row align-items-center g-4 g-lg-5';
        var colImg = document.createElement('div'); colImg.className = 'col-lg-6' + (s.ladoImg === 'direita' ? ' order-lg-2' : '');
        var img = document.createElement('img'); img.className = 'img-extra'; img.src = s.img; img.alt = s.imgAlt || ''; img.loading = 'lazy';
        colImg.appendChild(img);
        var colTxt = document.createElement('div'); colTxt.className = 'col-lg-6';
        colTxt.appendChild(texto);
        linha.appendChild(colImg); linha.appendChild(colTxt);
        box.appendChild(linha);
      } else {
        texto.className = 'text-center mx-auto texto-centro';
        box.appendChild(texto);
      }
      sec.appendChild(box);
      ancora.parentNode.insertBefore(sec, ancora.nextSibling);
      ultimoDepois[s.depoisDe] = sec;
    });
  }

  /* ---------- copiar chave PIX ---------- */
  function ligarPix() {
    var copiar = $('copyPix');
    if (!copiar) return;
    copiar.addEventListener('click', function () {
      var chave = ($('pixKey').textContent || '').trim();
      var ok = function () { copiar.textContent = 'Copiado!'; setTimeout(function () { copiar.textContent = 'Copiar'; }, 1600); };
      var falhou = function () { copiar.textContent = 'Copie manualmente'; };
      try { navigator.clipboard.writeText(chave).then(ok).catch(falhou); } catch (e) { falhou(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // index.html#previa (aberto pelo painel) liga a prévia nesta aba
    if (location.hash === '#previa') ADDAI.entrarNaPrevia();
    ligarPix();
    ADDAI.carregar().then(function (c) {
      ADDAI.aplicarTextos(c);
      montarCarrossel(c);
      Informativos.mostrarDestaques(c);
      montarSobre(c);
      montarExtras(c);
      ADDAI.aplicarSecoes(c);
    });
  });
})();
