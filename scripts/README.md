# Configuração Automática do Compilador Wake

## check-solidity.js

Script que detecta automaticamente se o projeto é de **smart contracts** ou **Node.js/frontend** e configura o compilador Wake adequadamente.

### Detecção Automática

O script verifica:
- ✅ Presença de arquivos `.sol`
- ✅ Diretório `contracts/`
- ✅ Arquivo `hardhat.config.js/ts`
- ✅ Arquivo `truffle-config.js`
- ✅ Arquivo `foundry.toml`

### Como usar

```bash
npm run check-solidity
```

### Configurações aplicadas

#### Projeto de Smart Contracts:
```json
{
  "wake.compiler.solc.remappings": [],
  "wake.compiler.solc.enabled": true,
  "wake.compiler.solc.autoDetect": true
}
```

#### Projeto Node.js/Frontend:
```json
{
  "wake.compiler.solc.remappings": [],
  "wake.compiler.solc.enabled": false,
  "wake.compiler.solc.autoDetect": false,
  "// Configurações do Wake": "Compilador desabilitado - projeto Node.js/frontend detectado"
}
```

### Execução Automática

O script executa automaticamente nos comandos:
- `npm run dev` - Antes de iniciar o servidor
- `npm run build` - Antes de fazer o build

### Benefícios

⚡ **Performance**: Evita inicialização desnecessária do compilador  
🎯 **Automático**: Detecta o tipo de projeto automaticamente  
🔧 **Inteligente**: Reconhece diferentes estruturas de projetos  
✨ **Transparente**: Indica claramente o que foi detectado  

### Execução Automática

Para executar automaticamente sempre que necessário, você pode:

1. **Manualmente quando necessário**: `npm run check-solidity`
2. **Em scripts de setup**: Adicionar ao `npm run dev` ou `npm run build`
3. **Em hooks Git**: Adicionar a um pre-commit hook 