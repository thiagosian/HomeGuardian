/**
 * HomeGuardian UI Debug Script
 * Cole este script no console do navegador (F12) quando estiver na lista de automações
 */

console.log('%c=== HomeGuardian UI Debug ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');

// 1. Check if script is loaded
console.log('\n%c1. Verificando se o script está carregado:', 'color: #2196F3; font-weight: bold;');
if (window.homeGuardianUI) {
  console.log('✅ Script carregado!');
  console.log('Versão:', window.homeGuardianUI.version);
  console.log('Injector:', window.homeGuardianUI.injector);
  console.log('API Client:', window.homeGuardianUI.apiClient);
} else {
  console.log('❌ Script NÃO carregado! O arquivo JS não está sendo incluído.');
}

// 2. Check current page
console.log('\n%c2. Página atual:', 'color: #2196F3; font-weight: bold;');
console.log('URL:', window.location.pathname);
console.log('Hash:', window.location.hash);

// 3. Look for automation rows
console.log('\n%c3. Procurando linhas de automação:', 'color: #2196F3; font-weight: bold;');

const selectors = [
  'ha-data-table tr[data-automation-id]',
  'ha-data-table .mdc-data-table__row',
  '.automation-row',
  'ha-data-table tbody tr',
  'mwc-list-item',
];

selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`Seletor "${selector}":`, elements.length, 'elementos');
  if (elements.length > 0) {
    console.log('  Primeiro elemento:', elements[0]);
  }
});

// 4. Check for ha-data-table
console.log('\n%c4. Verificando ha-data-table:', 'color: #2196F3; font-weight: bold;');
const dataTable = document.querySelector('ha-data-table');
if (dataTable) {
  console.log('✅ ha-data-table encontrado!');
  console.log('  Shadow DOM:', dataTable.shadowRoot ? 'Sim' : 'Não');

  if (dataTable.shadowRoot) {
    const rows = dataTable.shadowRoot.querySelectorAll('.mdc-data-table__row');
    console.log('  Linhas no Shadow DOM:', rows.length);
    if (rows.length > 0) {
      console.log('  Primeira linha:', rows[0]);
    }
  }
} else {
  console.log('❌ ha-data-table NÃO encontrado');
}

// 5. Check for automation picker
console.log('\n%c5. Verificando ha-automation-picker:', 'color: #2196F3; font-weight: bold;');
const picker = document.querySelector('ha-automation-picker');
if (picker) {
  console.log('✅ ha-automation-picker encontrado!');
  console.log('  Elemento:', picker);
  console.log('  Shadow DOM:', picker.shadowRoot ? 'Sim' : 'Não');
} else {
  console.log('❌ ha-automation-picker NÃO encontrado');
}

// 6. Check for injected icons
console.log('\n%c6. Verificando ícones injetados:', 'color: #2196F3; font-weight: bold;');
const icons = document.querySelectorAll('.homeguardian-icon-container');
console.log('Ícones encontrados:', icons.length);
icons.forEach((icon, i) => {
  console.log(`  Ícone ${i + 1}:`, icon);
});

// 7. Try to manually inject
console.log('\n%c7. Tentando injeção manual:', 'color: #2196F3; font-weight: bold;');
if (window.homeGuardianUI && window.homeGuardianUI.injector) {
  console.log('Executando checkCurrentPage()...');
  window.homeGuardianUI.injector.checkCurrentPage = function() {
    console.log('checkCurrentPage chamado!');
  };
}

// 8. Enable debug mode
console.log('\n%c8. Habilitando modo debug:', 'color: #2196F3; font-weight: bold;');
if (window.homeGuardianUI) {
  window.homeGuardianUI.enableDebug();
  console.log('✅ Debug habilitado!');
} else {
  console.log('❌ Não foi possível habilitar debug');
}

// 9. Check loaded scripts
console.log('\n%c9. Scripts carregados:', 'color: #2196F3; font-weight: bold;');
const scripts = Array.from(document.querySelectorAll('script[src*="homeguardian"]'));
console.log('Scripts HomeGuardian:', scripts.length);
scripts.forEach(script => {
  console.log('  -', script.src);
});

console.log('\n%c=== Fim do Debug ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('\n📋 Por favor, copie toda a saída acima e envie para análise.');
