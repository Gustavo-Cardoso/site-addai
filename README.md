# Site ADDAI

Site institucional da **ADDAI**, associação sem fins lucrativos de acolhimento e inclusão de pessoas autistas e suas famílias.

> **Status:** em desenvolvimento — os trechos destacados em amarelo no site e os informativos marcados como "[Exemplo]" ainda aguardam o conteúdo oficial da associação.

**Site no ar:** `https://SEU-USUARIO.github.io/site-addai/` *(troque pelo seu endereço depois de publicar)*

## Funcionalidades

- Site responsivo (celular, tablet e computador)
- Carrossel de imagens com botão de pausar
- **Informativos:** os 4 mais recentes na página inicial e uma página com a lista completa e a leitura de cada um
- Painel de controle (`painel.html`) para ligar/desligar seções e editar informativos, parceiros, números de impacto, slides, textos e dados da associação — sem mexer no código
- Doação por PIX com botão de copiar a chave
- Cuidados de acessibilidade: navegação por teclado, foco visível, respeito à preferência de menos movimento

## Tecnologias

HTML5 · CSS3 · JavaScript puro · [Bootstrap 5.3](https://getbootstrap.com/) (incluído em `vendor/`, o site não depende de CDN)

## Estrutura

```
site-addai/
├── index.html              página inicial
├── informativos.html       lista de informativos e leitura de cada um
├── painel.html             painel de controle
├── conteudo.json           conteúdo publicado (textos, dados, slides, informativos)
├── css/
│   ├── estilo.css          identidade visual do site
│   └── painel.css          estilos do painel
├── js/
│   ├── conteudo-padrao.js  conteúdo padrão, leitura do conteudo.json e prévia
│   ├── informativos.js     seção e página de informativos
│   ├── app.js              página inicial (carrossel, PIX)
│   └── painel.js           painel de controle
├── vendor/                 Bootstrap (css + js)
└── img/                    fotos do site
```

## Rodar no computador

O site lê o `conteudo.json`, e o navegador só permite isso por um servidor local (abrindo o `index.html` com dois cliques ele funciona, mas mostra o conteúdo padrão).

- **VS Code:** instale a extensão *Live Server*, clique com o botão direito em `index.html` → **Open with Live Server**.
- **Terminal:** `npx serve` dentro da pasta do projeto.

## Editar o conteúdo

1. Abra o painel: `painel.html` (no site publicado: `.../site-addai/painel.html`).
2. Edite e clique em **Ver prévia** para conferir (a prévia fica só no seu navegador).
3. Clique em **Gerar e copiar conteudo.json**.
4. No GitHub, abra `conteudo.json` → ✏️ → apague tudo, cole → **Commit changes**.
5. Em cerca de 1 minuto o site atualiza para todos.

O painel não publica nada sozinho: qualquer pessoa pode abri-lo, mas só quem tem acesso a este repositório consegue alterar o site.

### Seções

Em **Seções do site** dá para desligar Quem somos, Informativos, O que fazemos, Números de impacto e Parceiros. O link do menu some junto.
Informativos, Números de impacto e Parceiros também ficam escondidos enquanto estiverem vazios — por isso a seção de parceiros só aparece depois do primeiro parceiro cadastrado.

### Informativos

No painel, clique em **+ Novo informativo** e preencha título, data, texto e (se quiser) uma foto.

- O site ordena pela data, do mais recente para o mais antigo.
- A página inicial mostra os 4 primeiros; os demais ficam em `informativos.html`.
- Cada informativo tem um endereço próprio (`informativos.html#identificador`), bom para compartilhar.
- No texto, deixe uma linha em branco entre os parágrafos. Endereços `https://…` viram links.
- Com a lista vazia, a seção some da página inicial.

### Fotos (carrossel e informativos)

- **Pelo painel:** escolha a foto do computador. Ela é reduzida automaticamente e fica embutida no `conteudo.json`.
- **Pela pasta `img/`** (melhor para muitas fotos): envie a foto para `img/` no repositório e informe no painel o caminho, por exemplo `img/evento-2026.jpg`.

Use apenas fotos com autorização das pessoas que aparecem (no caso de crianças, dos responsáveis).

## Publicar no GitHub Pages

1. No repositório: **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Branch **main**, pasta **/ (root)** → **Save**.
4. Aguarde 1–2 minutos e acesse `https://SEU-USUARIO.github.io/site-addai/`.

O arquivo `.nojekyll` avisa o GitHub para publicar os arquivos como estão.

## Antes de divulgar

- [ ] Preencher no painel: telefone, e-mail, endereço, PIX e CNPJ
- [ ] Trocar os informativos de exemplo por informativos reais
- [ ] Preencher os números de impacto (ou desligar a seção) e cadastrar parceiros, se houver
- [ ] Trocar a foto da equipe em `index.html`
- [ ] Revisar os textos com a diretoria da ADDAI
- [ ] Colocar o endereço do site no campo **About** do repositório

## Créditos

Desenvolvido por voluntários para a ADDAI. Bootstrap é distribuído sob licença MIT.
