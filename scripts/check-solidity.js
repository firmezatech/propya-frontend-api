const fs = require('fs');
const path = require('path');

/**
 * Detecta se é um projeto de smart contracts ou Node.js puro
 */
function isSmartContractProject() {
  const projectRoot = process.cwd();
  
  // Verifica se existem arquivos .sol no projeto
  const hasSolidityFiles = findSolidityFiles(projectRoot).length > 0;
  
  // Verifica se tem estrutura típica de projeto de smart contracts
  const hasContractsDir = fs.existsSync(path.join(projectRoot, 'contracts'));
  const hasHardhatConfig = fs.existsSync(path.join(projectRoot, 'hardhat.config.js')) || 
                           fs.existsSync(path.join(projectRoot, 'hardhat.config.ts'));
  const hasTruffleConfig = fs.existsSync(path.join(projectRoot, 'truffle-config.js'));
  const hasFoundryConfig = fs.existsSync(path.join(projectRoot, 'foundry.toml'));
  
  return hasSolidityFiles || hasContractsDir || hasHardhatConfig || hasTruffleConfig || hasFoundryConfig;
}

/**
 * Verifica recursivamente se existem arquivos .sol no projeto
 */
function findSolidityFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      // Ignora node_modules, .git e outras pastas desnecessárias
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'build', 'dist', 'out'].includes(item)) {
        findSolidityFiles(fullPath, files);
      } else if (stat.isFile() && item.endsWith('.sol')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignora erros de acesso a diretórios
  }
  
  return files;
}

/**
 * Atualiza as configurações do VS Code para Wake
 */
function updateVSCodeSettings(isSmartContract) {
  const settingsPath = path.join(process.cwd(), '.vscode', 'settings.json');
  const srcSettingsPath = path.join(process.cwd(), 'src', '.vscode', 'settings.json');
  
  const settings = {
    "wake.compiler.solc.remappings": [],
    "wake.compiler.solc.enabled": isSmartContract,
    "wake.compiler.solc.autoDetect": isSmartContract
  };
  
  if (!isSmartContract) {
    settings["// Configurações do Wake"] = "Compilador desabilitado - projeto Node.js/frontend detectado";
  }
  
  // Atualiza o arquivo principal
  try {
    if (!fs.existsSync(path.dirname(settingsPath))) {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Erro ao atualizar .vscode/settings.json:', error.message);
  }
  
  // Atualiza o arquivo em src (se existir)
  try {
    if (fs.existsSync(path.dirname(srcSettingsPath))) {
      fs.writeFileSync(srcSettingsPath, JSON.stringify(settings, null, 2));
    }
  } catch (error) {
    // Ignora erro se diretório não existir
  }
}

/**
 * Função principal
 */
function main() {
  const isSmartContract = isSmartContractProject();
  
  if (isSmartContract) {
    console.log('🔧 Projeto de smart contracts detectado - Habilitando compilador Wake');
  } else {
    console.log('⚡ Projeto Node.js/frontend detectado - Desabilitando compilador Wake');
  }
  
  updateVSCodeSettings(isSmartContract);
  console.log('✅ Configurações atualizadas');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { isSmartContractProject, updateVSCodeSettings }; 