/* =====================================================================
   github.js — login do painel e publicação direto no repositório

   O login usa uma "chave de acesso" (fine-grained personal access token)
   do GitHub com permissão só para este repositório. Quem não tem a chave
   não consegue abrir o painel nem alterar o site: a segurança é do próprio
   GitHub, não de uma senha escrita no código.
   ===================================================================== */
var GitHub = (function () {
  // Usado quando o painel não está em *.github.io (ex.: testando no computador).
  var REPO_PADRAO = 'Gustavo-Cardoso/site-addai';
  var ARQUIVO = 'conteudo.json';
  var API = 'https://api.github.com';
  var CHAVE = 'addai_github_token';

  var token = null;
  var sha = null; // versão do conteudo.json que o painel carregou

  /* No GitHub Pages o repositório sai do endereço do site. */
  function repositorio() {
    var m = /^([^.]+)\.github\.io$/i.exec(location.hostname);
    if (!m) return REPO_PADRAO;
    var partes = location.pathname.split('/').filter(Boolean);
    var repo = (partes.length && !/\.html?$/i.test(partes[0])) ? partes[0] : location.hostname;
    return m[1] + '/' + repo;
  }

  function erro(msg, status) { var e = new Error(msg); e.status = status; return e; }

  function pedir(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = { 'Accept': opcoes.accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (opcoes.body) headers['Content-Type'] = 'application/json';
    return fetch(API + caminho, { method: opcoes.method || 'GET', headers: headers, body: opcoes.body, cache: 'no-store' })
      .catch(function () { throw erro('Sem conexão com o GitHub. Verifique a internet e tente de novo.', 0); });
  }

  /* texto <-> base64 sem estragar acentos */
  function paraBase64(texto) {
    var bytes = new TextEncoder().encode(texto), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function deBase64(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- sessão ---------- */
  function lerTokenSalvo() {
    try { return sessionStorage.getItem(CHAVE) || localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function guardarToken(t, lembrar) {
    try {
      sessionStorage.setItem(CHAVE, t);
      if (lembrar) localStorage.setItem(CHAVE, t); else localStorage.removeItem(CHAVE);
    } catch (e) {}
  }
  function sair() {
    token = null; sha = null;
    try { sessionStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE); } catch (e) {}
  }

  /* Confere a chave: precisa existir e ter permissão de escrita no repositório. */
  function entrar(chave, lembrar) {
    token = String(chave || '').trim();
    if (!token) return Promise.reject(erro('Cole sua chave de acesso.'));
    return pedir('/repos/' + repositorio()).then(function (r) {
      if (r.status === 401) throw erro('Chave inválida ou expirada. Gere uma nova no GitHub.', 401);
      if (r.status === 403 || r.status === 404) throw erro('Esta chave não tem acesso ao repositório ' + repositorio() + '.', r.status);
      if (!r.ok) throw erro('O GitHub respondeu com erro (' + r.status + '). Tente de novo em instantes.', r.status);
      return r.json();
    }).then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) {
        throw erro('Esta chave só pode ler. Ela precisa da permissão "Contents: Read and write".', 403);
      }
      guardarToken(token, lembrar);
      return pedir('/user').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    }).then(function (usuario) {
      return { usuario: usuario.login || '', repositorio: repositorio() };
    }).catch(function (e) { token = null; throw e; });
  }

  /* ---------- conteúdo ---------- */
  function carregar() {
    return pedir('/repos/' + repositorio() + '/contents/' + ARQUIVO).then(function (r) {
      if (r.status === 404) { sha = null; return null; } // ainda não existe no repositório
      if (r.status === 401) throw erro('Sua sessão expirou. Entre de novo.', 401);
      if (!r.ok) throw erro('Não consegui ler o conteúdo do site (' + r.status + ').', r.status);
      return r.json().then(function (info) {
        sha = info.sha;
        if (info.encoding === 'base64' && info.content) return JSON.parse(deBase64(info.content));
        // arquivos grandes (> 1 MB) vêm sem conteúdo: busca a versão bruta
        return pedir('/repos/' + repositorio() + '/contents/' + ARQUIVO, { accept: 'application/vnd.github.raw+json' })
          .then(function (r2) { if (!r2.ok) throw erro('Não consegui ler o conteúdo do site (' + r2.status + ').', r2.status); return r2.json(); });
      });
    });
  }

  function publicar(conteudo, mensagem) {
    var corpo = { message: mensagem || 'Atualiza conteúdo pelo painel', content: paraBase64(JSON.stringify(conteudo, null, 2) + '\n') };
    if (sha) corpo.sha = sha;
    return pedir('/repos/' + repositorio() + '/contents/' + ARQUIVO, { method: 'PUT', body: JSON.stringify(corpo) }).then(function (r) {
      if (r.status === 409 || r.status === 422) throw erro('O conteúdo do site foi alterado em outro lugar depois que você abriu o painel. Baixe uma cópia de segurança, recarregue a página e refaça as alterações.', r.status);
      if (r.status === 401) throw erro('Sua sessão expirou. Entre de novo.', 401);
      if (r.status === 403) throw erro('Esta chave não tem permissão para publicar.', 403);
      if (r.status === 413) throw erro('O conteúdo ficou grande demais. Use fotos menores ou caminhos img/…', 413);
      if (!r.ok) throw erro('O GitHub não aceitou a publicação (' + r.status + '). Tente de novo.', r.status);
      return r.json();
    }).then(function (res) {
      sha = res.content && res.content.sha;
      return res;
    });
  }

  return {
    repositorio: repositorio,
    lerTokenSalvo: lerTokenSalvo,
    entrar: entrar,
    sair: sair,
    carregar: carregar,
    publicar: publicar
  };
})();
