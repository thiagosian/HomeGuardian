# 🔍 Como Usar o HomeGuardian UI

## O que é o HomeGuardian UI?

O **HomeGuardian UI** é uma integração que adiciona **ícones de histórico de versões** nas listas e páginas de visualização do Home Assistant. Ele **NÃO** cria um novo menu ou painel - ele injeta ícones nas páginas existentes!

## 📍 Onde os ícones aparecem?

Os ícones aparecem automaticamente nas **listas** e **páginas de visualização** (não nas páginas de edição):

1. **Lista de Automações** - Configurações → Automações & Cenas
2. **Visualização de Automação** - `/config/automation/show/[id]` ou `/config/automation/info/[id]`
3. **Lista de Scripts** - Configurações → Scripts
4. **Visualização de Script** - `/config/script/show/[id]` ou `/config/script/info/[id]`
5. **Lista de Cenas** - Configurações → Cenas
6. **Lista de Dashboards** - Painéis configurados

**IMPORTANTE:** Os ícones **NÃO** aparecem nas páginas de edição!

## 🧪 Como Testar

### 1. Ative o modo debug

Abra o console do navegador (F12) e digite:

```javascript
window.homeGuardianUI.enableDebug()
```

Isso mostrará logs detalhados de o que a integração está fazendo.

### 2. Vá para a lista de automações

Navegue até a lista de automações:

1. Vá em **Configurações** → **Automações & Cenas**
2. Na lista de automações, **procure por ícones de histórico** (🕐) ao lado do nome de cada automação
3. Os ícones mostram um número indicando quantas versões existem
4. Você também pode clicar em uma automação para **visualizá-la** (não editar) e o ícone aparecerá no cabeçalho

### 3. Verifique o console

No console do navegador você deve ver:

```
 HomeGuardian UI  v1.0.0
[HomeGuardian UI] Initializing...
[HomeGuardian UI] Home Assistant ready, starting icon injection
[HomeGuardian IconInjector] Checking current page: /config/automation/...
[HomeGuardian IconInjector] Injecting automation list icons
```

### 4. Se não vir nenhum ícone

**Verifique se você está no lugar certo:**
- ❌ Páginas de **edição** não mostram ícones
- ✅ **Listas** de automações/scripts/cenas mostram ícones
- ✅ Páginas de **visualização** (info) mostram ícones

**Sem o add-on backend instalado:**
- Os ícones aparecem mas com "0 versões"
- Ao clicar, mostra "No version history available"

**Com o add-on backend instalado:**
- Os ícones aparecem com o número real de versões
- Você pode clicar para ver o histórico completo
- Você pode fazer rollback para versões anteriores

## 🎯 O que vem a seguir?

Se você quer a funcionalidade completa, você precisa:

1. ✅ **HomeGuardian UI** (integração HACS) - Já instalado!
2. ⚠️ **HomeGuardian Add-on** (backend) - Ainda não existe como add-on do Home Assistant

O backend é o que realmente faz o versionamento Git das suas automações. A UI apenas mostra as informações e permite interação.

## 🐛 Troubleshooting

### Console mostra erros de API

```
[HomeGuardian API] Request failed: Failed to fetch
```

Isso significa que o backend não está respondendo - é esperado se você não tem o add-on instalado.

### Nenhum log no console

A integração não foi carregada. Verifique:

1. Se a integração está ativada em **Configurações** → **Dispositivos e Serviços**
2. Se aparece em `/hacsfiles/homeguardian_ui/homeguardian-ui.js`
3. Recarregue a página com CTRL+F5

### Ícones não aparecem

1. Certifique-se de estar em uma **lista** ou página de **visualização** (não edição!)
2. Ative o modo debug: `window.homeGuardianUI.enableDebug()`
3. Verifique o console para ver quais elementos estão sendo encontrados
4. Se aparecer "No automation rows found", significa que os seletores não estão encontrando as automações

**Dica:** Os seletores procuram por:
- `ha-data-table .mdc-data-table__row` (linhas da tabela de dados)
- `.automation-row`, `.script-row`, `.scene-row` (linhas customizadas)
- Elementos com atributos `data-automation-id`, `data-script-id`, etc.

### Ícones aparecem mas não respondem ao clique

Verifique:
1. Se há erros no console do navegador
2. Se o backend está instalado e rodando
3. Se você pode acessar `/api/hassio_ingress/a0d7b954_homeguardian/status`
