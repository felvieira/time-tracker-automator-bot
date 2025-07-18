# 🤝 Contribuindo para o Clockify Automator

Obrigado por considerar contribuir para o Clockify Automator! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USERNAME/clockify-automator.git
cd clockify-automator

# Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL_USERNAME/clockify-automator.git
```

### 2. Configuração do Ambiente

```bash
# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Configure sua API key do Clockify no arquivo .env
# Execute o projeto
npm run dev
```

### 3. Criando uma Branch

```bash
# Crie uma branch para sua feature/fix
git checkout -b feature/nome-da-sua-feature
# ou
git checkout -b fix/nome-do-bug
```

### 4. Fazendo Mudanças

- Mantenha o código limpo e bem documentado
- Siga os padrões de código existentes
- Use TypeScript adequadamente
- Adicione comentários quando necessário

### 5. Testando

```bash
# Execute o linter
npm run lint

# Teste o build
npm run build

# Teste a aplicação manualmente
npm run dev
```

### 6. Commit e Push

```bash
# Adicione suas mudanças
git add .

# Faça commit com uma mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"

# Push para sua branch
git push origin feature/nome-da-sua-feature
```

### 7. Pull Request

1. Vá para o GitHub e crie um Pull Request
2. Descreva suas mudanças claramente
3. Referencie issues relacionadas se houver
4. Aguarde o review

## 📝 Padrões de Código

### Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` mudanças na documentação
- `style:` formatação, sem mudanças de código
- `refactor:` refatoração de código
- `test:` adição ou correção de testes
- `chore:` mudanças em ferramentas, configurações

### Estrutura de Componentes

```typescript
// Imports externos primeiro
import React, { useState, useEffect } from 'react';

// Imports de UI components
import { Button } from "@/components/ui/button";

// Imports locais
import { useToast } from "@/hooks/use-toast";

// Interfaces/Types
interface ComponentProps {
  // ...
}

// Componente
const Component = ({ prop }: ComponentProps) => {
  // Estados
  const [state, setState] = useState();
  
  // Hooks
  const { toast } = useToast();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleAction = () => {
    // ...
  };
  
  // Render
  return (
    // JSX
  );
};

export default Component;
```

### Estilo e Formatação

- Use 2 espaços para indentação
- Use aspas simples para strings
- Adicione vírgula final em objetos/arrays
- Use nomes descritivos para variáveis e funções

## 🐛 Reportando Bugs

Ao reportar bugs, inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir** o bug
3. **Comportamento esperado** vs **comportamento atual**
4. **Screenshots** se aplicável
5. **Informações do ambiente**:
   - Versão do navegador
   - Sistema operacional
   - Versão do Node.js

## 💡 Sugerindo Funcionalidades

Para sugerir novas funcionalidades:

1. Verifique se já não existe uma issue similar
2. Descreva claramente a funcionalidade
3. Explique por que seria útil
4. Forneça exemplos de uso se possível

## 🔍 Tipos de Contribuições

### 🆕 Novas Funcionalidades

- Melhorias na interface do usuário
- Novas integrações com a API do Clockify
- Funcionalidades de relatórios
- Automações adicionais

### 🐛 Correções de Bugs

- Correções de problemas existentes
- Melhorias de performance
- Correções de acessibilidade

### 📚 Documentação

- Melhorias no README
- Documentação de código
- Exemplos de uso
- Traduções

### 🎨 Design e UX

- Melhorias visuais
- Experiência do usuário
- Responsividade
- Acessibilidade

## 📋 Checklist para Pull Requests

Antes de submeter seu PR, verifique:

- [ ] O código compila sem erros (`npm run build`)
- [ ] O linter passa sem erros (`npm run lint`)
- [ ] A funcionalidade foi testada manualmente
- [ ] A documentação foi atualizada se necessário
- [ ] O commit segue as convenções
- [ ] O PR tem uma descrição clara

## 🤔 Dúvidas?

Se tiver dúvidas sobre como contribuir:

- Abra uma [Discussion](https://github.com/USERNAME/clockify-automator/discussions)
- Crie uma [Issue](https://github.com/USERNAME/clockify-automator/issues) com a tag `question`

## 🙏 Reconhecimento

Todos os contribuidores serão reconhecidos no README do projeto. Obrigado por ajudar a tornar o Clockify Automator melhor!

---

**Lembre-se**: Contribuições pequenas também são valiosas! Desde correções de typos até grandes funcionalidades, toda ajuda é bem-vinda. 🎉