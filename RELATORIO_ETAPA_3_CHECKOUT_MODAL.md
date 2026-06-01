# Relatorio tecnico - Etapa 3: checkout-modal.tsx

## Arquivo analisado

`apps/web/components/public-menu/checkout-modal.tsx`

## Objetivo

Reduzir o arquivo para abaixo de 800 linhas mantendo o comportamento exatamente igual.

Este arquivo e sensivel porque envolve:

- dados do cliente;
- endereco;
- entrega e retirada;
- forma de pagamento;
- taxa de entrega;
- cupom;
- observacoes;
- total do pedido;
- envio do pedido;
- abertura do WhatsApp.

## Tamanho atual

O arquivo possui aproximadamente `820` linhas.

## Analise

O arquivo concentra muitas responsabilidades no mesmo lugar:

- Tipos do checkout:
  - props do modal;
  - tipo de entrega;
  - metodo de pagamento;
  - paleta visual;
  - zonas de entrega;
  - configuracoes de entrega;
  - retorno do ViaCEP.
- Helpers puros:
  - formatacao de dinheiro;
  - limpeza de numeros;
  - parsing de valor em dinheiro;
  - normalizacao de texto;
  - tratamento de mensagem de erro.
- Estado do formulario:
  - nome;
  - WhatsApp;
  - tipo de entrega;
  - endereco;
  - observacoes;
  - pagamento;
  - troco;
  - loading de CEP;
  - erro de CEP;
  - envio do pedido.
- Busca de CEP via ViaCEP.
- Seleção de bairro atendido.
- Calculo da taxa de entrega.
- Calculo do subtotal com desconto.
- Calculo do total final.
- Calculo de troco.
- Montagem da mensagem de WhatsApp.
- Validacoes antes do envio.
- Payload enviado para `/public-orders/${tenantSlug}`.
- JSX completo do checkout:
  - cabecalho;
  - dados do cliente;
  - entrega/retirada;
  - endereco;
  - pagamento;
  - observacoes;
  - resumo;
  - botao final.

## Responsabilidades misturadas

O arquivo mistura:

- regra derivada de checkout;
- apresentacao visual;
- montagem de payload;
- montagem de mensagem para WhatsApp;
- validacao;
- chamadas externas;
- formulario;
- resumo financeiro.

Isso aumenta o risco de regressao em qualquer ajuste visual simples.

## Plano de divisao seguro

### 1. `checkout.types.ts`

Mover apenas tipos:

- `CheckoutModalProps`
- `DeliveryType`
- `PaymentMethod`
- `MenuPalette`
- `DeliveryZone`
- `DeliverySettings`
- `CepResponse`

Risco: baixo.

### 2. `checkout-formatters.ts`

Mover apenas helpers puros:

- `formatMoney`
- `onlyNumbers`
- `parseMoneyInput`
- `normalizeText`
- `getErrorMessage`

Risco: baixo.

### 3. `checkout-summary.tsx`

Extrair apenas o bloco visual inferior:

- subtotal;
- cupom;
- desconto;
- taxa de entrega;
- total;
- aviso de loja fechada;
- botao de enviar pedido.

Importante:

- receber todos os valores ja calculados por props;
- nao recalcular nada;
- nao alterar texto;
- nao alterar classes CSS.

Risco: baixo/medio.

### 4. `checkout-observations-field.tsx`

Extrair o campo visual de observacoes:

- titulo;
- texto de ajuda;
- textarea;
- placeholder.

Importante:

- manter mesmo valor;
- manter mesmo setter;
- manter mesmo comportamento.

Risco: baixo.

### 5. `checkout-customer-form.tsx`

Extrair campos:

- nome;
- WhatsApp.

Importante:

- receber valor e setter por props;
- nao alterar validacao.

Risco: baixo/medio.

### 6. `checkout-payment-form.tsx`

Extrair:

- botoes Pix, Cartao e Dinheiro;
- campo "Vai pagar com quanto?";
- exibicao do troco.

Importante:

- receber `paymentMethod`, `setPaymentMethod`, `cashPaidAmount`, `setCashPaidAmount`, `changeAmount`, `theme` e `choiceStyle`;
- nao alterar calculo de troco.

Risco: medio.

### 7. `checkout-delivery-form.tsx`

Extrair por ultimo:

- selecao Entrega/Retirada;
- endereco de retirada;
- endereco de entrega;
- busca de CEP;
- erro de CEP;
- campos de rua, numero, bairro, complemento, cidade e UF.

Importante:

- manter `handleSearchCep` no arquivo principal no primeiro momento;
- passar handler e estados por props;
- nao alterar regra de bairro atendido;
- nao alterar taxa de entrega.

Risco: medio/alto.

## Subetapas seguras recomendadas

### Subetapa 3A - Tipos e helpers puros

Criar:

- `apps/web/components/public-menu/checkout.types.ts`
- `apps/web/components/public-menu/checkout-formatters.ts`

Mover apenas tipos e helpers puros.

Nao mover:

- JSX;
- hooks;
- `useState`;
- `useMemo`;
- `handleSearchCep`;
- `handleFinishOrder`;
- payload;
- mensagem de WhatsApp;
- calculos.

### Subetapa 3B - Componentes visuais simples

Criar:

- `apps/web/components/public-menu/checkout-summary.tsx`
- `apps/web/components/public-menu/checkout-observations-field.tsx`

Mover apenas blocos visuais simples.

### Subetapa 3C - Formulario de cliente e pagamento

Criar:

- `apps/web/components/public-menu/checkout-customer-form.tsx`
- `apps/web/components/public-menu/checkout-payment-form.tsx`

Manter calculos e handlers no arquivo principal.

### Subetapa 3D - Entrega e endereco

Criar:

- `apps/web/components/public-menu/checkout-delivery-form.tsx`

Mover por ultimo, pois e a area com mais risco.

## O que nao sera alterado

Nao alterar:

- payload do pedido;
- chamada de API;
- endpoint `/public-orders/${tenantSlug}`;
- calculo de subtotal;
- calculo de desconto;
- calculo de taxa de entrega;
- calculo de total;
- calculo de troco;
- regra de cupom;
- regra de bairro atendido;
- regra de entrega fechada;
- regra de loja fora do horario;
- validacoes;
- formas de pagamento;
- montagem da mensagem de WhatsApp;
- textos visiveis;
- layout;
- classes CSS;
- fluxo do checkout;
- comportamento do carrinho.

## Riscos

### Baixo risco

- mover tipos;
- mover helpers puros;
- extrair campo de observacoes.

### Medio risco

- extrair resumo inferior;
- extrair pagamento;
- extrair cliente.

### Medio/alto risco

- extrair entrega/endereco, porque envolve CEP, retirada, bairro, taxa e validacao.

## Testes manuais obrigatorios

Depois de cada subetapa:

1. Abrir checkout com carrinho preenchido.
2. Preencher nome e WhatsApp.
3. Alternar entre Entrega e Retirada.
4. Confirmar exibicao do endereco de retirada.
5. Buscar CEP valido.
6. Buscar CEP invalido.
7. Preencher endereco manualmente.
8. Testar bairro atendido.
9. Testar bairro nao atendido.
10. Testar Pix.
11. Testar Cartao.
12. Testar Dinheiro com valor menor que o total.
13. Testar Dinheiro com valor maior que o total.
14. Conferir troco.
15. Testar pedido com cupom.
16. Testar pedido sem cupom.
17. Conferir taxa de entrega no resumo.
18. Conferir total final.
19. Testar loja fora do horario.
20. Confirmar botao desabilitado quando pedidos estiverem bloqueados.
21. Enviar pedido.
22. Confirmar abertura do WhatsApp.
23. Confirmar que o payload enviado ao backend nao mudou.

## Ordem segura de execucao

1. Subetapa 3A - tipos e helpers puros.
2. Validar build e fluxo basico.
3. Subetapa 3B - resumo e observacoes.
4. Validar build e checkout visual.
5. Subetapa 3C - cliente e pagamento.
6. Validar pagamento, dinheiro e troco.
7. Subetapa 3D - entrega e endereco.
8. Validar CEP, bairro, retirada, taxa e envio.

## Recomendacao

Comecar pela Subetapa 3A.

Ela reduz o arquivo com risco minimo e prepara o checkout para as proximas extracoes sem tocar em regra de negocio, JSX, handlers, payload ou calculos.
