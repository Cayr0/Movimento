# Como publicar o app

## 1. GitHub (onde o app fica hospedado)
1. Crie uma conta gratuita em github.com, se ainda não tiver.
2. Conecte o GitHub ao Claude: https://claude.ai/connect-github
3. Avise no chat. O Claude cria o repositório, liga o GitHub Pages e devolve o endereço do app (algo como `https://SEU-USUARIO.github.io/emprestimos/`).

## 2. Google Cloud (para o login com Google e o backup no Drive)
Leva uns 10 minutos e é gratuito.
1. Entre em https://console.cloud.google.com com a sua conta Google e crie um projeto novo (ex.: "Controle de Empréstimos").
2. Menu › APIs e serviços › Biblioteca: procure **Google Drive API** e clique em **Ativar**.
3. Menu › APIs e serviços › **Tela de consentimento OAuth** (ou "Google Auth Platform"):
   - Tipo de usuário: **Externo**.
   - Nome do app, e-mail de suporte e e-mail de contato: os seus.
   - Escopos: adicione `.../auth/drive.file`, `openid` e `email`. Nenhum deles exige verificação do Google.
   - Público: clique em **Publicar app** (sai do modo "Teste"). Assim qualquer pessoa pode entrar.
4. Menu › APIs e serviços › **Credenciais** › Criar credenciais › **ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - Origens JavaScript autorizadas: o endereço do GitHub Pages do passo 1, só a parte `https://SEU-USUARIO.github.io` (sem barra no final).
   - Não precisa preencher "URIs de redirecionamento".
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e mande no chat. Ele é público, pode mandar sem problema. Não mande a "chave secreta do cliente": ela não é usada.

## Atualizações
Depois de instalado, o app busca a versão nova sozinho toda vez que abre com internet. Basta fechar e abrir de novo.
