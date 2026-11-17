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
      ADDAI.aplicarSecoes(c);
    });
  });
})();
