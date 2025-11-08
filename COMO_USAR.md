# 🔍 Como Usar o HomeGuardian UI

## O que é o HomeGuardian UI?

O **HomeGuardian UI** é uma integração que adiciona **ícones de histórico de versões** diretamente nas páginas de edição do Home Assistant. Ele **NÃO** cria um novo menu ou painel - ele injeta ícones nas páginas existentes!

## 📍 Onde os ícones aparecem?

Os ícones aparecem automaticamente quando você está editando:

1. **Automações** - `/config/automation/edit/[id]`
2. **Scripts** - `/config/script/edit/[id]`
3. **Cenas (Scenes)** - `/config/scene/edit/[id]`
4. **Blueprints** - `/config/blueprint/edit/[id]`
5. **Dashboards** - Nos dashboards em modo de edição

## 🧪 Como Testar

### 1. Ative o modo debug

Abra o console do navegador (F12) e digite:

```javascript
window.homeGuardianUI.enableDebug()
```

Isso mostrará logs detalhados de o que a integração está fazendo.

### 2. Vá para uma página de edição

Navegue até qualquer automação existente:

1. Vá em **Configurações** → **Automações & Cenas**
2. Clique em qualquer automação para editá-la
3. **Procure por um ícone de histórico** (mdi:history) com um número ao lado

### 3. Verifique o console

No console do navegador você deve ver:

```
 HomeGuardian UI  v1.0.0 
[HomeGuardian UI] Initializing...
[HomeGuardian UI] Home Assistant ready, starting icon injection
[HomeGuardian IconInjector] Checking current page: /config/automation/edit/...
```

### 4. Se não vir nenhum ícone

Isso é **NORMAL** se você não tiver o **HomeGuardian Add-on** instalado! A integração UI é apenas a interface - ela precisa do add-on backend para funcionar completamente.

**Sem o add-on backend:**
- Os ícones não aparecem OU
- Os ícones aparecem com "0 versões"

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

1. Certifique-se de estar em uma página de **edição** (não na lista)
2. Tente adicionar `?debug=1` na URL
3. Verifique se o elemento DOM está carregado
