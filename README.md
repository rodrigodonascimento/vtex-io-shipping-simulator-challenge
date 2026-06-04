# Desafio Técnico VTEX IO - Simulador de Frete Customizado (Growdev / Veste)

Este repositório contém a solução do desafio técnico para desenvolvedor VTEX IO da Growdev em parceria com a Veste. O objetivo do projeto é construir um componente personalizado de simulação de frete em TypeScript e integrá-lo à Página de Detalhes do Produto (PDP) de uma loja VTEX IO.

## 📁 Estrutura do Projeto

O repositório está estruturado com duas aplicações VTEX IO independentes:
*   `shipping-simulator-app/`: Aplicativo contendo o componente React desenvolvido em TypeScript usando o builder `react@3.x`.
*   `store-theme/`: Tema da loja utilizando o builder `store@0.x`, responsável por consumir e posicionar o bloco customizado na PDP, logo abaixo do botão de adicionar ao carrinho.

---

## 🚀 Funcionalidades Implementadas & Casos de Borda Tratados

*   **Validação e Máscara de Entrada**: O campo de CEP possui uma máscara dinâmica que formata a digitação no padrão `00000-000` em tempo real, bloqueando caracteres não numéricos e limitando o envio a exatamente 8 dígitos.
*   **Simulação Combinada de Produtos**: O componente recupera com precisão a lista de itens ativos no carrinho do usuário através do escopo global injetado pela plataforma, somando-os ao SKU e à quantidade selecionada na PDP para realizar o cálculo logístico consolidado através da API de Checkout da VTEX.
*   **Tratamento de Estoque Regional**: A aplicação analisa a resposta logística do servidor da VTEX para separar cenários e fornecer feedbacks claros na tela para o usuário caso o produto esteja indisponível para a região informada ou sem estoque geral.
*   **Acessibilidade e Interatividade (Bônus)**: A lista de opções de frete retornada foi construída utilizando elementos HTML semânticos e propriedades WAI-ARIA (`role="radiogroup"`), permitindo que o usuário selecione as opções de entrega de forma totalmente interativa e acessível.
*   **Reset de Estados Dinâmico**: Implementação de ganchos de efeito (`useEffect`) que limpam os resultados e mensagens de erro anteriores da tela caso o usuário altere a variação do produto (SKU) na PDP.

---

## 🛠️ Tecnologias e Dependências Utilizadas

*   **VTEX IO CLI**
*   **React** (Hooks e Contextos)
*   **TypeScript**
*   **CSS Modules** (Estilização isolada e responsiva)
*   `vtex.product-context` (Para leitura de SKUs e quantidades da PDP)

---

## 📦 Como Rodar o Projeto Localmente

1.  Faça o clone deste repositório e acesse a pasta raiz:
    ```bash
    git clone LINK_DO_REPOSITORIO
    cd NOME_DA_PASTA
    ```
2.  Faça login na conta VTEX pelo terminal e selecione a sua workspace de desenvolvimento:
    ```bash
    vtex login nome-da-conta
    vtex use sua-workspace-de-desenvolvimento
    ```
3.  Acesse a pasta do componente e faça o link na nuvem da VTEX:
    ```bash
    cd shipping-simulator-app
    vtex link
    ```
4.  Abra um novo terminal, acesse a pasta do tema e execute o link do layout:
    ```bash
    cd store-theme
    vtex link
    ```
5.  Acesse a URL da workspace gerada no terminal para testar o componente integrado na página de produto em tempo real.
