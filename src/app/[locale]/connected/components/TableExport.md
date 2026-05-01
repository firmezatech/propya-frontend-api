# TableExport Component

Componente reutilizável para exportação de dados de tabelas em diferentes formatos (CSV, Excel, PDF).

## Funcionalidades

- ✅ Exportação para CSV com codificação UTF-8
- ✅ Exportação para Excel (formato .xls)
- ✅ Exportação para PDF (via impressão do navegador)
- ✅ Interface intuitiva com dropdown de opções
- ✅ Limpeza automática de dados (remove HTML tags, formatação)
- ✅ Tratamento de caracteres especiais
- ✅ Estados de loading durante exportação

## Uso Básico

```tsx
import TableExport from './TableExport';

const MyComponent = () => {
  const [data, setData] = useState([
    { "Nome": "João Silva", "Email": "joao@email.com", "Idade": "30" },
    { "Nome": "Maria Santos", "Email": "maria@email.com", "Idade": "25" }
  ]);

  const headers = ["Nome", "Email", "Idade"];
  const filename = "usuarios_2024-01-15";

  return (
    <div>
      <h2>Lista de Usuários</h2>
      <TableExport
        data={data}
        headers={headers}
        filename={filename}
        title="Lista de Usuários"
      />
      {/* Sua tabela aqui */}
    </div>
  );
};
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `data` | `any[]` | ✅ | Array de objetos com os dados para exportação |
| `headers` | `string[]` | ✅ | Array com os nomes das colunas |
| `filename` | `string` | ✅ | Nome base do arquivo (sem extensão) |
| `title` | `string` | ❌ | Título para o PDF (padrão: "Exportar Dados") |
| `className` | `string` | ❌ | Classes CSS adicionais |

## Exemplos de Uso

### 1. Exportação de Recebimentos

```tsx
const exportData = [
  {
    "Data": "2024-01-15",
    "Valor Total": "R$ 1.500,00",
    "Valor Co-proprietário": "R$ 150,00",
    "Tokens Recomprados": "R$ 50,00",
    "Taxa": "R$ 15,00",
    "Status": "Recebido"
  }
];

<TableExport
  data={exportData}
  headers={["Data", "Valor Total", "Valor Co-proprietário", "Tokens Recomprados", "Taxa", "Status"]}
  filename={`recebimentos_${new Date().toISOString().split('T')[0]}`}
  title="Relatório de Recebimentos"
/>
```

### 2. Exportação de Tokens

```tsx
const tokenData = [
  {
    "Data": "2024-01-15",
    "Tokens Comprados": "100",
    "Tokens Recomprados": "10",
    "Perfil": "Investidor",
    "Valor Transação": "R$ 1.000,00",
    "Tokens Restantes": "90",
    "Percentual Atual": "5.2%"
  }
];

<TableExport
  data={tokenData}
  headers={["Data", "Tokens Comprados", "Tokens Recomprados", "Perfil", "Valor Transação", "Tokens Restantes", "Percentual Atual"]}
  filename={`seus_tokens_${new Date().toISOString().split('T')[0]}`}
  title="Histórico de Tokens"
/>
```

### 3. Exportação de Pagamentos

```tsx
const paymentData = [
  {
    "Data": "2024-01-15",
    "Valor": "R$ 2.500,00",
    "Status": "Pago",
    "Descrição": "Boleto 12345"
  }
];

<TableExport
  data={paymentData}
  headers={["Data", "Valor", "Status", "Descrição"]}
  filename={`pagamentos_${new Date().toISOString().split('T')[0]}`}
  title="Histórico de Pagamentos"
/>
```

## Integração com Componentes de Lista

Para integrar com componentes de lista existentes, adicione um callback:

```tsx
// No componente pai
const [exportData, setExportData] = useState([]);
const [exportHeaders, setExportHeaders] = useState([]);

const handleExportDataUpdate = (data) => {
  setExportData(data);
};

// No componente de lista
useEffect(() => {
  if (onExportDataUpdate && data.length > 0) {
    const formattedData = data.map(item => ({
      "Data": item.date,
      "Valor": item.value,
      "Status": item.status
    }));
    onExportDataUpdate(formattedData);
  }
}, [data, onExportDataUpdate]);
```

## Formatação de Dados

O componente automaticamente:
- Remove tags HTML dos dados
- Escapa aspas duplas para CSV
- Trata valores nulos/vazios
- Formata datas e valores monetários

## Limitações

- PDF: Usa a funcionalidade de impressão do navegador
- Excel: Gera arquivo .xls (formato legado)
- Tamanho: Não há limite específico, mas arquivos muito grandes podem causar lentidão

## Estilização

O componente usa classes Tailwind CSS e pode ser customizado:

```tsx
<TableExport
  data={data}
  headers={headers}
  filename={filename}
  className="my-custom-class"
/>
```

## Troubleshooting

### Problema: Caracteres especiais não aparecem corretamente no CSV
**Solução**: O componente adiciona BOM UTF-8 automaticamente. Certifique-se de que o programa que abre o CSV suporte UTF-8.

### Problema: PDF não abre
**Solução**: Verifique se o navegador permite pop-ups. O PDF é gerado via impressão do navegador.

### Problema: Dados não aparecem na exportação
**Solução**: Verifique se o array `data` não está vazio e se as chaves dos objetos correspondem aos `headers`.
