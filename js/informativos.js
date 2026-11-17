/* =====================================================================
   informativos.js — seção de informativos
     • index.html        → os 4 mais recentes (miniatura + título)
     • informativos.html → lista completa e leitura de cada informativo
                           (informativos.html#id-do-informativo)
   (depende de js/conteudo-padrao.js)
   ===================================================================== */
var Informativos = (function () {
  var DESTAQUES = 4;
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CORES = ['slide-a', 'slide-b', 'slide-c'];
  var ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8A3 3 0 0 1 6 15"/></svg>';

  function $(id) { return document.getElementById(id); }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  /* "2026-11-10" → "10 de novembro de 2026" */
  function dataPorExtenso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m || !MESES[+m[2] - 1]) return '';
    return (+m[3]) + ' de ' + MESES[+m[2] - 1] + ' de ' + m[1];
  }

  /* mais recentes primeiro; sem data ficam no fim */
  function ordenar(lista) {
    return lista.slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
  }

  function resumo(texto, limite) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    if (t.length <= limite) return t;
    return t.slice(0, limite).replace(/\s+\S*$/, '') + '…';
  }

  function urlFundo(img) { return 'url("' + String(img).replace(/"/g, '%22') + '")'; }

  /* capa do cartão: foto ou, sem foto, um fundo colorido com ícone */
  function capa(inf, i) {
    var c = el('div', 'info-capa ' + (inf.img ? '' : CORES[i % CORES.length]));
    if (inf.img) {
      c.style.backgroundImage = urlFundo(inf.img);
      if (inf.imgAlt) { c.setAttribute('role', 'img'); c.setAttribute('aria-label', inf.imgAlt); }
    } else {
      c.innerHTML = ICONE; // ícone fixo, não vem do conteúdo
    }
    return c;
  }

  function cartao(inf, i, comResumo) {
    var a = el('a', 'card card-info h-100');
    a.href = 'informativos.html#' + encodeURIComponent(inf.id);
    a.appendChild(capa(inf, i));
    var corpo = el('div', 'card-body');
    var data = dataPorExtenso(inf.data);
    if (data) corpo.appendChild(el('div', 'info-data', data));
    corpo.appendChild(el('h3', 'info-titulo', inf.titulo || 'Sem título'));
    if (comResumo && inf.texto) corpo.appendChild(el('p', 'info-resumo', resumo(inf.texto, 130)));
    a.appendChild(corpo);
    return a;
  }

  function grade(destino, lista, classeColuna, comResumo) {
    destino.innerHTML = '';
    lista.forEach(function (inf, i) {
      var col = el('div', classeColuna);
      col.appendChild(cartao(inf, i, comResumo));
      destino.appendChild(col);
    });
  }

  /* Texto simples → parágrafos. Quebras de linha são mantidas e
     endereços http(s) viram links. Nada do texto é tratado como HTML. */
  function textoParaDom(texto, destino) {
    destino.innerHTML = '';
    String(texto || '').split(/\n\s*\n/).forEach(function (bloco) {
      if (!bloco.trim()) return;
      var p = el('p');
      bloco.trim().split('\n').forEach(function (linha, n) {
        if (n) p.appendChild(document.createElement('br'));
        linha.split(/(https?:\/\/[^\s<>"']+)/g).forEach(function (parte) {
          if (/^https?:\/\//.test(parte)) {
            var fim = (parte.match(/[.,;:!?)]+$/) || [''])[0]; // pontuação colada no fim não faz parte do link
            var url = fim ? parte.slice(0, -fim.length) : parte;
            var a = el('a', null, url);
            a.href = url; a.target = '_blank'; a.rel = 'noopener';
            p.appendChild(a);
            if (fim) p.appendChild(document.createTextNode(fim));
          } else if (parte) {
            p.appendChild(document.createTextNode(parte));
          }
        });
      });
      destino.appendChild(p);
    });
  }

  /* ---------- página inicial ---------- */
  function mostrarDestaques(c) {
    var secao = $('informativos');
    if (!secao) return;
    var lista = ordenar(c.informativos);  // mostrar/ocultar fica em ADDAI.aplicarSecoes
    grade($('informativosGrid'), lista.slice(0, DESTAQUES), 'col-sm-6 col-lg-3', false);
  }

  /* ---------- informativos.html ---------- */
  function mostrarPagina(c) {
    var lista = c.secoes.informativos ? ordenar(c.informativos) : []; // seção desligada no painel
    var id = (location.hash || '').slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* endereço malformado: usa como veio */ }
    var areaLista = $('infoLista'), areaDetalhe = $('infoDetalhe');
    var inf = id ? lista.filter(function (x) { return x.id === id; })[0] : null;

    if (!id || id === 'previa') {              // lista completa
      areaDetalhe.classList.add('d-none');
      areaLista.classList.remove('d-none');
      grade($('infoGrade'), lista, 'col-sm-6 col-lg-4', true);
      $('infoVazio').classList.toggle('d-none', lista.length > 0);
      document.title = 'Informativos — ADDAI';
      return;
    }

    areaLista.classList.add('d-none');
    areaDetalhe.classList.remove('d-none');
    var foto = $('infoFoto');
    if (!inf) {                                // link antigo ou informativo removido
      $('infoTitulo').textContent = 'Informativo não encontrado';
      $('infoData').textContent = '';
      foto.classList.add('d-none');
      textoParaDom('Este informativo pode ter sido removido. Veja a lista completa no link abaixo.', $('infoTexto'));
      document.title = 'Informativo não encontrado — ADDAI';
    } else {
      $('infoTitulo').textContent = inf.titulo || 'Sem título';
      $('infoData').textContent = dataPorExtenso(inf.data);
      foto.classList.toggle('d-none', !inf.img);
      if (inf.img) { foto.src = inf.img; foto.alt = inf.imgAlt || ''; } else { foto.removeAttribute('src'); }
      textoParaDom(inf.texto, $('infoTexto'));
      document.title = (inf.titulo || 'Informativo') + ' — ADDAI';
    }
    window.scrollTo(0, 0);
  }

  function ligarPagina() {
    if (!$('paginaInformativos')) return;
    var conteudo = null;
    ADDAI.carregar().then(function (c) {
      conteudo = c;
      ADDAI.aplicarTextos(c);
      ADDAI.aplicarSecoes(c);
      mostrarPagina(c);
    });
    window.addEventListener('hashchange', function () { if (conteudo) mostrarPagina(conteudo); });

    var copiar = $('infoCopiar');
    if (copiar) copiar.addEventListener('click', function () {
      var ok = function () { copiar.textContent = 'Link copiado!'; setTimeout(function () { copiar.textContent = 'Copiar link'; }, 1800); };
      var falhou = function () { copiar.textContent = 'Copie o endereço da barra do navegador'; };
      try { navigator.clipboard.writeText(window.location.href).then(ok).catch(falhou); } catch (e) { falhou(); }
    });
  }

  document.addEventListener('DOMContentLoaded', ligarPagina);

  return { mostrarDestaques: mostrarDestaques, dataPorExtenso: dataPorExtenso, textoParaDom: textoParaDom };
})();
