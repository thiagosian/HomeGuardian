# Análise Comparativa: Bibliotecas UI Modernas e Leves para HomeGuardian

**Data da Análise:** 2025-11-08
**Versão Atual:** HomeGuardian 1.3.0
**Stack Atual:** React 18.2 + Vite 5.0 + Material-UI 5.14 + Emotion
**Restrição Crítica:** 512MB RAM máximo (256MB reservado) no Docker

---

## 📊 SITUAÇÃO ATUAL - Material-UI v5

### Métricas Atuais
- **Bundle Size (minified):** ~350KB (MUI) + ~80KB (Emotion) + ~200KB (MUI Icons) = **~630KB**
- **Bundle Size (gzipped):** ~120KB (MUI) + ~25KB (Emotion) + ~60KB (MUI Icons) = **~205KB**
- **Impacto RAM (SSR):** Alto - Runtime CSS-in-JS consome ~40-60MB adicional
- **Tree-shaking:** Limitado devido ao runtime Emotion
- **Hydration Impact:** Alto devido ao CSS-in-JS runtime

### Problemas Identificados
1. ✗ Runtime CSS-in-JS (Emotion) aumenta consumo de memória
2. ✗ Importação completa de ícones (~2000+ ícones disponíveis)
3. ✗ Bundle grande mesmo com code splitting
4. ✗ Overhead de tema e contexto do MUI
5. ✗ Dependências pesadas (@emotion/react, @emotion/styled)

---

## 🎯 CATEGORIA 1: HEADLESS UI LIBRARIES

### 1.1 Radix UI + Tailwind CSS

**Bundle Size:**
- Radix primitives: ~15-20KB (apenas componentes usados)
- Tailwind CSS: ~8-10KB (purged, production)
- **Total estimado:** ~25-30KB gzipped

**Impacto em RAM (SSR):**
- Muito Baixo (~5-10MB)
- Zero runtime CSS-in-JS
- Purged CSS estático no build
- **Redução estimada: -75% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Totalmente customizável
- Design tokens via Tailwind
- Acessibilidade AAA (Radix é referência)
- Suporta dark mode nativo
- Animações via Tailwind/Framer Motion

**Facilidade de Migração:**
- Complexidade: Média-Alta
- Requer reescrita de componentes (não drop-in replacement)
- Tailwind precisa configuração inicial
- Estimativa: 20-30 horas de trabalho
- Componentes a migrar: ~15-20 componentes UI

**Empresas que usam:**
- Vercel (vercel.com)
- Linear (linear.app)
- Cal.com
- Raycast
- Prisma

**Prós:**
- ✓ Bundle mínimo (redução de ~85%)
- ✓ Zero runtime, CSS estático
- ✓ Máxima performance
- ✓ Acessibilidade nativa
- ✓ Controle total do design
- ✓ Excelente tree-shaking

**Contras:**
- ✗ Mais trabalhoso para setup inicial
- ✗ Necessita criar sistema de design próprio
- ✗ Curva de aprendizado do Tailwind
- ✗ Mais código boilerplate

**Score de Adequação: 9.5/10**

**Recomendação:** ALTAMENTE RECOMENDADO - Melhor opção para redução máxima de RAM e bundle size. Ideal para HomeGuardian considerando as restrições.

---

### 1.2 Headless UI (by Tailwind Labs)

**Bundle Size:**
- Headless UI: ~12-15KB gzipped
- Tailwind CSS: ~8-10KB (purged)
- **Total estimado:** ~20-25KB gzipped

**Impacto em RAM (SSR):**
- Muito Baixo (~5-8MB)
- CSS estático, zero runtime
- **Redução estimada: -80% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐☆ Boa customização
- Menos componentes que Radix (mais limitado)
- Boa acessibilidade
- Integração perfeita com Tailwind

**Facilidade de Migração:**
- Complexidade: Média-Alta
- Similar ao Radix UI
- Menos componentes disponíveis (pode precisar criar alguns)
- Estimativa: 25-35 horas

**Empresas que usam:**
- GitHub (partes do site)
- Tailwind Labs (obviamente)
- Algolia
- Transistor.fm

**Prós:**
- ✓ Bundle muito pequeno
- ✓ Zero runtime overhead
- ✓ Integração perfeita com Tailwind
- ✓ Acessibilidade boa
- ✓ Mantido pelos criadores do Tailwind

**Contras:**
- ✗ Menos componentes que Radix
- ✗ Menos flexível que Radix
- ✗ Comunidade menor que Radix
- ✗ Documentação menos detalhada

**Score de Adequação: 8.0/10**

**Recomendação:** BOA OPÇÃO - Mais simples que Radix, mas com menos componentes disponíveis.

---

### 1.3 React Aria (Adobe)

**Bundle Size:**
- React Aria: ~40-50KB gzipped (componentes necessários)
- Tailwind CSS: ~8-10KB
- **Total estimado:** ~50-60KB gzipped

**Impacto em RAM (SSR):**
- Baixo-Médio (~15-20MB)
- Mais overhead que Radix/Headless devido a hooks complexos
- **Redução estimada: -60% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excelente
- Adobe Spectrum como referência
- Acessibilidade excepcional (melhor do mercado)
- Internacionalização built-in

**Facilidade de Migração:**
- Complexidade: Alta
- API complexa com muitos hooks
- Curva de aprendizado íngreme
- Estimativa: 35-45 horas

**Empresas que usam:**
- Adobe (Adobe.com, Creative Cloud)
- Microsoft (partes do Office 365)
- Atlassian

**Prós:**
- ✓ Melhor acessibilidade do mercado
- ✓ Internacionalização robusta
- ✓ Bem documentado
- ✓ Componentes complexos (data grids, etc)
- ✓ Mantido pela Adobe

**Contras:**
- ✗ API complexa
- ✗ Bundle maior que Radix/Headless
- ✗ Curva de aprendizado
- ✗ Over-engineering para casos simples

**Score de Adequação: 7.0/10**

**Recomendação:** BOA, mas complexa demais para HomeGuardian. Melhor para apps enterprise grandes.

---

## 🎨 CATEGORIA 2: UTILITY-FIRST CSS

### 2.1 Tailwind CSS

**Bundle Size:**
- Production (purged): ~8-15KB gzipped
- Depende dos utilitários usados
- JIT mode: apenas o que você usa

**Impacto em RAM:**
- Praticamente zero (CSS estático)
- Compilado em build time
- **Ideal para restrições de RAM**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excelente
- Design tokens modernos
- Sistema de cores robusto
- Dark mode built-in
- Plugins para estender

**Facilidade de Migração:**
- Complexidade: Média
- Substitui Emotion completamente
- Precisa configurar PostCSS/Vite
- Estimativa: 15-25 horas (migração de estilos)

**Empresas que usam:**
- GitHub
- NASA
- Shopify
- OpenAI
- Laravel
- Vercel

**Prós:**
- ✓ Bundle mínimo
- ✓ Zero runtime
- ✓ Desenvolvimento rápido
- ✓ Design system consistente
- ✓ Comunidade gigante
- ✓ Plugins e ecosistema

**Contras:**
- ✗ HTML pode ficar verboso
- ✗ Curva de aprendizado inicial
- ✗ Necessita build step

**Score de Adequação: 10/10**

**Recomendação:** ESSENCIAL - Deve ser usado em combinação com qualquer solução headless.

---

### 2.2 UnoCSS

**Bundle Size:**
- Production: ~5-10KB gzipped
- Ainda menor que Tailwind (mais otimizado)
- Engine pura CSS

**Impacto em RAM:**
- Praticamente zero
- Mais performático que Tailwind no build
- **Ideal para RAM limitada**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Compatível com Tailwind
- Suporta presets Tailwind, WindiCSS
- Mais flexível e rápido
- Shortcuts customizáveis

**Facilidade de Migração:**
- Complexidade: Baixa (se já usa Tailwind)
- Drop-in replacement para Tailwind
- Configuração mais simples no Vite
- Estimativa: 2-5 horas (migração de Tailwind)

**Empresas que usam:**
- Nuxt (nuxt.com)
- Element Plus
- VueUse
- Anthony Fu (creator) projects

**Prós:**
- ✓ Mais leve que Tailwind
- ✓ Build time mais rápido
- ✓ Presets flexíveis
- ✓ Ótima integração Vite
- ✓ API simples
- ✓ Ícones built-in (via preset)

**Contras:**
- ✗ Comunidade menor que Tailwind
- ✗ Menos recursos/plugins
- ✗ Menos material educacional
- ✗ Documentação menos completa

**Score de Adequação: 9.0/10**

**Recomendação:** EXCELENTE alternativa ao Tailwind, especialmente com Vite. Mais leve e rápido.

---

## 🧩 CATEGORIA 3: COMPONENT LIBRARIES LEVES

### 3.1 shadcn/ui (Radix + Tailwind)

**Bundle Size:**
- ~20-30KB gzipped (componentes necessários)
- Copy-paste model: só o que você usa
- Sem package dependency

**Impacto em RAM (SSR):**
- Muito Baixo (~5-8MB)
- Usa Radix UI internamente
- CSS estático via Tailwind
- **Redução estimada: -80% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excepcional
- Design moderno e limpo
- Múltiplos temas prontos
- Dark mode nativo
- Animações suaves (Framer Motion opcional)

**Facilidade de Migração:**
- Complexidade: Média
- CLI para adicionar componentes
- Copy-paste no seu projeto
- Customização total (você possui o código)
- Estimativa: 20-30 horas

**Empresas/Projetos que usam:**
- Vercel (v0.dev)
- Cal.com
- Taxonomy (demo do shadcn)
- Supabase (partes da UI)
- Inúmeros projetos open-source

**Prós:**
- ✓ Bundle muito pequeno
- ✓ Você possui o código (não é dependency)
- ✓ Visual moderno premium
- ✓ Acessibilidade excelente (Radix)
- ✓ CLI conveniente
- ✓ Comunidade ativa
- ✓ Componentes prontos para copiar

**Contras:**
- ✗ Precisa manter código dos componentes
- ✗ Updates manuais (não via npm update)
- ✗ Dependência Tailwind obrigatória
- ✗ Framer Motion para animações (adiciona ~30KB)

**Score de Adequação: 10/10**

**Recomendação:** ALTAMENTE RECOMENDADO - Melhor equilíbrio entre qualidade visual, performance e DX. Ideal para HomeGuardian.

---

### 3.2 Mantine

**Bundle Size:**
- Core: ~45-60KB gzipped
- Hooks: ~15KB
- Form: ~20KB
- **Total típico:** ~80-100KB gzipped

**Impacto em RAM (SSR):**
- Médio (~25-35MB)
- Usa Emotion (runtime CSS-in-JS)
- Melhor optimizado que MUI
- **Redução estimada: -40% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excelente
- Design moderno e profissional
- 100+ componentes
- Dark mode built-in
- Temas customizáveis

**Facilidade de Migração:**
- Complexidade: Baixa-Média
- API similar ao MUI
- Migration path mais fácil
- Estimativa: 15-20 horas

**Empresas que usam:**
- Revolt.chat
- DocuSign (partes)
- Inúmeros dashboards e admin panels
- Comunidade forte na Europa

**Prós:**
- ✓ API similar ao MUI (migração mais fácil)
- ✓ Componentes ricos (100+)
- ✓ Hooks utilities excelentes
- ✓ Form management integrado
- ✓ Documentação excelente
- ✓ TypeScript first
- ✓ Dark mode nativo

**Contras:**
- ✗ Usa Emotion (runtime CSS-in-JS)
- ✗ Bundle maior que shadcn/Radix
- ✗ Ainda consome RAM (menos que MUI)
- ✗ Lock-in na biblioteca

**Score de Adequação: 7.5/10**

**Recomendação:** BOA opção se prioriza facilidade de migração, mas não resolve o problema de RAM completamente.

---

### 3.3 NextUI

**Bundle Size:**
- Core: ~50-70KB gzipped
- Theme system: ~15KB
- **Total típico:** ~65-85KB gzipped

**Impacto em RAM (SSR):**
- Médio-Alto (~30-40MB)
- Usa Stitches (CSS-in-JS)
- Melhor que Emotion, pior que zero runtime
- **Redução estimada: -35% vs MUI**

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excepcional (mais bonito)
- Design inspirado no macOS/iOS
- Animações premium
- Visual moderno e elegante
- Gradientes e glassmorphism

**Facilidade de Migração:**
- Complexidade: Média
- API própria (diferente de MUI)
- Bem documentado
- Estimativa: 25-30 horas

**Empresas que usam:**
- MIDUDEV (streamer tech espanhol)
- Vercel (algumas demos)
- Comunidade latina forte
- Startups modernas

**Prós:**
- ✓ Visual premium/moderno
- ✓ Animações suaves built-in
- ✓ Dark mode excelente
- ✓ TypeScript nativo
- ✓ Componentes ricos
- ✓ Bem documentado

**Contras:**
- ✗ Usa Stitches (CSS-in-JS runtime)
- ✗ Bundle médio-grande
- ✗ Consome RAM moderadamente
- ✗ Comunidade menor que MUI/Mantine
- ✗ Animações adicionam peso

**Score de Adequação: 7.0/10**

**Recomendação:** BOA se visual premium é prioridade, mas não ideal para restrições severas de RAM.

---

## 📈 CATEGORIA 4: CHART LIBRARIES LEVES

### 4.1 Recharts

**Bundle Size:**
- Core: ~45-55KB gzipped
- Depende dos charts usados
- Tree-shakeable

**Impacto em RAM:**
- Médio (~20-30MB para charts complexos)
- React-based, rendering via React
- Usa D3 internamente (seletivo)

**Qualidade Visual:**
- ⭐⭐⭐⭐☆ Boa
- Responsive
- Customizável
- Animações suaves

**Prós:**
- ✓ API React-friendly
- ✓ Composable (componentes React)
- ✓ Boa documentação
- ✓ Responsivo
- ✓ Comunidade ativa

**Contras:**
- ✗ Bundle médio-grande
- ✗ Performance degrada com muitos dados
- ✗ Não otimizado para grandes datasets

**Score: 7.5/10** - Bom para charts simples, não ideal para dados massivos.

---

### 4.2 Chart.js (com react-chartjs-2)

**Bundle Size:**
- Chart.js: ~35-45KB gzipped
- react-chartjs-2: ~5KB
- **Total:** ~40-50KB gzipped

**Impacto em RAM:**
- Médio-Baixo (~15-25MB)
- Canvas-based (mais eficiente que SVG)
- Melhor performance que Recharts

**Qualidade Visual:**
- ⭐⭐⭐⭐☆ Boa
- 8 tipos de charts
- Plugins disponíveis
- Customizável

**Prós:**
- ✓ Leve e performático
- ✓ Canvas rendering (eficiente)
- ✓ Maduro e estável
- ✓ Grande comunidade
- ✓ Plugins ricos

**Contras:**
- ✗ API menos React-friendly
- ✗ Customização menos intuitiva
- ✗ Imperativo (não declarativo)

**Score: 8.5/10** - Melhor performance/bundle ratio.

**Recomendação:** RECOMENDADO para HomeGuardian - Leve e eficiente.

---

### 4.3 Apache ECharts (com echarts-for-react)

**Bundle Size:**
- ECharts: ~80-120KB gzipped (full)
- ECharts (custom): ~30-50KB (apenas charts necessários)
- echarts-for-react: ~10KB

**Impacto em RAM:**
- Médio (~20-35MB)
- Canvas-based
- Muito otimizado para grandes datasets
- Suporta milhões de pontos

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excepcional
- Visual profissional
- Animações ricas
- Temas prontos
- Mais bonito que Chart.js/Recharts

**Prós:**
- ✓ Visual premium
- ✓ Performance excepcional (grandes dados)
- ✓ 20+ tipos de charts
- ✓ Muito customizável
- ✓ Canvas rendering eficiente
- ✓ Usado por empresas gigantes (Alibaba, Baidu)

**Contras:**
- ✗ Bundle grande (se não customizar)
- ✗ API complexa
- ✗ Curva de aprendizado
- ✗ Documentação em inglês limitada (melhor em chinês)

**Score: 8.0/10** - Melhor opção se precisa charts complexos/premium.

---

### 4.4 uPlot (ultra-leve)

**Bundle Size:**
- uPlot: ~12-18KB gzipped
- **Menor biblioteca de charts**

**Impacto em RAM:**
- Muito Baixo (~5-10MB)
- Canvas-based
- Extremamente otimizado
- Suporta milhões de pontos

**Qualidade Visual:**
- ⭐⭐⭐☆☆ Básica
- Visual simples/minimalista
- Menos customizável
- Focado em performance

**Prós:**
- ✓ MUITO leve (~15KB!)
- ✓ Performance excepcional
- ✓ Ideal para time series
- ✓ Zero dependencies
- ✓ Perfeito para restrições de RAM

**Contras:**
- ✗ Visual básico
- ✗ Menos tipos de charts
- ✗ Customização limitada
- ✗ API imperativa
- ✗ Comunidade pequena

**Score: 9.0/10** - IDEAL para HomeGuardian se charts são simples.

**Recomendação:** ALTAMENTE RECOMENDADO se não precisa charts complexos - redução massiva de bundle/RAM.

---

## 🎨 CATEGORIA 5: ICON LIBRARIES LEVES

### 5.1 Lucide React (fork do Feather Icons)

**Bundle Size:**
- Por ícone: ~0.5-1KB
- Tree-shakeable perfeito
- 10 ícones = ~5-10KB total
- **vs MUI Icons: -95% bundle**

**Impacto em RAM:**
- Praticamente zero
- SVG estático inline
- Sem runtime

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excepcional
- Design consistente
- 1000+ ícones
- Stroke-based (customizável)
- Moderno e limpo

**Prós:**
- ✓ Muito leve
- ✓ Tree-shaking perfeito
- ✓ Visual moderno
- ✓ Fácil customização (stroke, color, size)
- ✓ TypeScript types
- ✓ Comunidade ativa
- ✓ Update frequente

**Contras:**
- ✗ Menos ícones que MUI (1000 vs 2000+)
- ✗ Estilo único (stroke-based)

**Score: 10/10** - IDEAL para substituir MUI Icons.

**Recomendação:** ALTAMENTE RECOMENDADO - Redução massiva de bundle.

---

### 5.2 Phosphor Icons

**Bundle Size:**
- Por ícone: ~0.8-1.2KB
- Tree-shakeable
- 10 ícones = ~8-12KB
- 6 variantes por ícone (thin, light, regular, bold, fill, duotone)

**Impacto em RAM:**
- Praticamente zero
- SVG inline

**Qualidade Visual:**
- ⭐⭐⭐⭐⭐ Excepcional
- 6 variantes/ícone
- 1200+ ícones
- Design flexível

**Prós:**
- ✓ Muito leve
- ✓ 6 pesos diferentes
- ✓ Visual flexível
- ✓ Duotone variant único
- ✓ Bem documentado

**Contras:**
- ✗ Bundle ligeiramente maior que Lucide (6 variants)
- ✗ Pode ser overkill ter 6 variants

**Score: 9.5/10** - Excelente se precisa flexibilidade de peso.

---

### 5.3 Heroicons (by Tailwind Labs)

**Bundle Size:**
- Por ícone: ~0.4-0.8KB
- Tree-shakeable
- 10 ícones = ~4-8KB
- Solid + Outline variants

**Impacto em RAM:**
- Praticamente zero
- SVG inline

**Qualidade Visual:**
- ⭐⭐⭐⭐☆ Boa
- ~300 ícones (menor coleção)
- 2 variantes (outline, solid)
- Design limpo

**Prós:**
- ✓ Mais leve (menos ícones)
- ✓ Perfeita integração Tailwind
- ✓ Oficial Tailwind Labs
- ✓ Solid + Outline
- ✓ Design consistente

**Contras:**
- ✗ Menos ícones (300 vs 1000+)
- ✗ Pode faltar ícones específicos
- ✗ Apenas 2 variants

**Score: 8.5/10** - Bom se usa Tailwind e ícones disponíveis são suficientes.

---

### 5.4 React Icons (agregador)

**Bundle Size:**
- Variável (agrega Font Awesome, Material, etc)
- Por ícone: ~1-2KB
- 10 ícones = ~10-20KB

**Impacto em RAM:**
- Baixo
- Tree-shakeable (mas imports podem ser confusos)

**Qualidade Visual:**
- ⭐⭐⭐⭐☆ Variado (depende do pack)
- 40+ icon packs
- Inconsistente entre packs

**Prós:**
- ✓ Acesso a múltiplos packs
- ✓ Um package unificado
- ✓ Ícone que você precisa provavelmente existe

**Contras:**
- ✗ Bundle maior
- ✗ Fácil importar demais sem querer
- ✗ Design inconsistente
- ✗ Overhead de abstração

**Score: 7.0/10** - Conveniente mas não otimizado.

---

## 📊 RECOMENDAÇÃO FINAL PARA HOMEGUARDIAN

### 🥇 Stack Recomendado (Máxima Redução de RAM)

```
UI Framework: shadcn/ui (Radix UI + Tailwind CSS)
CSS Framework: Tailwind CSS (ou UnoCSS)
Charts: uPlot (ou Chart.js se precisa mais tipos)
Icons: Lucide React
```

**Redução Estimada de Bundle:**
- Atual: ~630KB (MUI) → Novo: ~60-80KB
- **Economia: ~85-87% bundle size**

**Redução Estimada de RAM:**
- Atual: ~50-70MB (runtime Emotion + MUI)
- Novo: ~5-10MB (zero runtime)
- **Economia: ~85-90% RAM usage**

**Esforço de Migração:**
- Tempo estimado: 25-35 horas
- Complexidade: Média
- ROI: Muito alto (considerando restrições de RAM)

---

### 🥈 Stack Alternativo (Migração Mais Fácil)

```
UI Framework: Mantine
CSS Framework: Emotion (built-in Mantine)
Charts: Chart.js
Icons: Lucide React
```

**Redução Estimada:**
- Bundle: ~40-50% menor
- RAM: ~40% menor

**Esforço de Migração:**
- Tempo estimado: 15-20 horas
- Complexidade: Baixa (API similar)
- ROI: Médio

---

### 🥉 Stack Intermediário (Equilíbrio)

```
UI Framework: Headless UI + Tailwind
CSS Framework: Tailwind CSS
Charts: Chart.js
Icons: Lucide React
```

**Redução Estimada:**
- Bundle: ~75-80% menor
- RAM: ~75-80% menor

**Esforço de Migração:**
- Tempo estimado: 20-25 horas
- Complexidade: Média
- ROI: Alto

---

## 📋 COMPARAÇÃO LADO A LADO

| Critério | MUI Atual | shadcn/ui | Mantine | NextUI | Headless UI |
|----------|-----------|-----------|---------|--------|-------------|
| **Bundle (gzip)** | ~205KB | ~25KB | ~100KB | ~85KB | ~25KB |
| **RAM Impact** | Alto (50MB+) | Muito Baixo (5MB) | Médio (30MB) | Médio-Alto (35MB) | Muito Baixo (5MB) |
| **Runtime CSS** | Sim (Emotion) | Não | Sim (Emotion) | Sim (Stitches) | Não |
| **Visual Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Accessibility** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Migration Effort** | - | Médio | Baixo | Médio | Médio-Alto |
| **Learning Curve** | - | Média | Baixa | Média | Média |
| **Components Count** | 80+ | ~40 | 100+ | 50+ | ~15 |
| **TypeScript** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dark Mode** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Score Global** | 6.5/10 | 10/10 | 7.5/10 | 7/10 | 8/10 |

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

### Fase 1: Proof of Concept (1 semana)
1. Setup Tailwind CSS no projeto
2. Migrar 2-3 componentes simples para shadcn/ui
3. Testar bundle size e RAM usage
4. Validar visual e DX

### Fase 2: Migração Gradual (3-4 semanas)
1. Migrar todos os componentes de página (Dashboard, Settings, etc)
2. Substituir MUI Icons por Lucide React
3. Migrar charts para uPlot/Chart.js
4. Testes de performance e RAM

### Fase 3: Otimização Final (1 semana)
1. Remover dependências antigas (MUI, Emotion)
2. Otimização de bundle (tree-shaking)
3. Testes finais de performance
4. Documentação

---

## 📖 RECURSOS E REFERÊNCIAS

### shadcn/ui
- Site: https://ui.shadcn.com/
- GitHub: https://github.com/shadcn-ui/ui
- Exemplos: https://ui.shadcn.com/examples

### Radix UI
- Site: https://www.radix-ui.com/
- Docs: https://www.radix-ui.com/primitives/docs/overview/introduction

### Tailwind CSS
- Site: https://tailwindcss.com/
- Docs: https://tailwindcss.com/docs

### Lucide React
- Site: https://lucide.dev/
- GitHub: https://github.com/lucide-icons/lucide

### uPlot
- GitHub: https://github.com/leeoniya/uPlot
- Demos: https://leeoniya.github.io/uPlot/demos/index.html

### Chart.js
- Site: https://www.chartjs.org/
- react-chartjs-2: https://react-chartjs-2.js.org/

---

**Conclusão:** Para HomeGuardian com restrições severas de RAM (512MB), a combinação **shadcn/ui + Tailwind CSS + uPlot + Lucide React** oferece a melhor relação entre qualidade visual enterprise e mínimo consumo de recursos, com redução estimada de 85-90% no uso de RAM comparado à stack atual.
