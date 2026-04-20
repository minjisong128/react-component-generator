import { describe, it, expect, beforeEach } from 'bun:test';
import { resolveApiKey, stripCodeFences, ensureRenderCall } from '../utils/index.ts';

describe('resolveApiKey', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'env-anthropic-key';
    process.env.GOOGLE_API_KEY = 'env-google-key';
  });

  describe('clientKey priority', () => {
    it('returns clientKey when provided', () => {
      const result = resolveApiKey('anthropic', 'client-key');
      expect(result).toBe('client-key');
    });

    it('returns clientKey even when env key exists', () => {
      const result = resolveApiKey('anthropic', 'client-key');
      expect(result).toBe('client-key');
    });

    it('has higher priority than env key (clientKey > env)', () => {
      const withClient = resolveApiKey('anthropic', 'client-key');
      const withoutClient = resolveApiKey('anthropic', undefined);
      expect(withClient).not.toBe(withoutClient);
      expect(withClient).toBe('client-key');
    });
  });

  describe('env key fallback', () => {
    it('returns env key when clientKey is not provided', () => {
      const result = resolveApiKey('anthropic');
      expect(result).toBe('env-anthropic-key');
    });

    it('returns env key for anthropic provider', () => {
      const result = resolveApiKey('anthropic');
      expect(result).toBe('env-anthropic-key');
    });

    it('returns env key for google provider', () => {
      const result = resolveApiKey('google');
      expect(result).toBe('env-google-key');
    });
  });

  describe('null fallback', () => {
    it('returns null when clientKey and env key are both missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      const result = resolveApiKey('anthropic');
      expect(result).toBeNull();
    });

    it('returns null for anthropic when both missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      const result = resolveApiKey('anthropic');
      expect(result).toBeNull();
    });

    it('returns null for google when both missing', () => {
      delete process.env.GOOGLE_API_KEY;
      const result = resolveApiKey('google');
      expect(result).toBeNull();
    });
  });
});

describe('stripCodeFences', () => {
  describe('removing jsx/tsx/javascript/typescript fences', () => {
    it('removes jsx code fence', () => {
      const input = '```jsx\nconst Button = () => <button>Click</button>;\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });

    it('removes tsx code fence', () => {
      const input = '```tsx\nconst Button = () => <button>Click</button>;\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });

    it('removes javascript code fence', () => {
      const input = '```javascript\nfunction add(a, b) { return a + b; }\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('function add(a, b) { return a + b; }');
    });

    it('removes typescript code fence', () => {
      const input = '```typescript\nfunction add(a, b) { return a + b; }\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('function add(a, b) { return a + b; }');
    });
  });

  describe('uppercase fences (JSX, TSX)', () => {
    it('removes JSX (uppercase) code fence', () => {
      const input = '```JSX\nconst Button = () => <button>Click</button>;\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });

    it('removes TSX (uppercase) code fence', () => {
      const input = '```TSX\nconst Button = () => <button>Click</button>;\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });
  });

  describe('no fence handling', () => {
    it('returns original text when no fence present', () => {
      const input = 'const Button = () => <button>Click</button>;';
      const result = stripCodeFences(input);
      expect(result).toBe(input);
    });

    it('returns code as-is when no markdown fence', () => {
      const code = 'function test() {\n  return 42;\n}';
      const result = stripCodeFences(code);
      expect(result).toBe(code);
    });
  });

  describe('empty string handling', () => {
    it('returns empty string when input is empty', () => {
      const result = stripCodeFences('');
      expect(result).toBe('');
    });
  });

  describe('whitespace handling', () => {
    it('removes leading and trailing whitespace', () => {
      const input = '  \n```jsx\nconst Button = () => <button>Click</button>;\n```\n  ';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });

    it('trims before and after processing', () => {
      const input = '\n  ```jsx\nconst Button = () => <button>Click</button>;\n```  \n';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });
  });

  describe('mixed case handling', () => {
    it('removes fence with mixed case (case-insensitive)', () => {
      const input = '```JsX\nconst Button = () => <button>Click</button>;\n```';
      const result = stripCodeFences(input);
      expect(result).toBe('const Button = () => <button>Click</button>;');
    });
  });
});

describe('ensureRenderCall', () => {
  describe('render call already present', () => {
    it('returns code unchanged when render() exists', () => {
      const code = 'const Button = () => <button>Click</button>;\n\nrender(<Button />);';
      const result = ensureRenderCall(code);
      expect(result).toBe(code);
    });

    it('is idempotent - does not add duplicate render call', () => {
      const code = 'const Button = () => <button>Click</button>;\n\nrender(<Button />);';
      const result1 = ensureRenderCall(code);
      const result2 = ensureRenderCall(result1);
      expect(result1).toBe(result2);
    });

    it('detects render() with spaces and preserves code', () => {
      const code = 'const Button = () => <button>Click</button>;\n\nrender ( <Button /> );';
      const result = ensureRenderCall(code);
      expect(result).toBe(code);
    });
  });

  describe('adding render call for PascalCase component', () => {
    it('adds render call when function-style component exists without render', () => {
      const code = 'const GradientButton = () => { return <button>Click</button>; }';
      const result = ensureRenderCall(code);
      expect(result).toContain('render(<GradientButton />);');
    });

    it('adds render call for function declaration', () => {
      const code = 'function MyButton() { return <button>Click</button>; }';
      const result = ensureRenderCall(code);
      expect(result).toContain('render(<MyButton />);');
    });

    it('captures last PascalCase component name (for multiple components)', () => {
      const code = 'const MyComponent = () => <div></div>;\n\nconst AnotherComponent = () => <span></span>;';
      const result = ensureRenderCall(code);
      expect(result).toContain('render(<AnotherComponent />);');
    });

    it('appends render call with proper newlines', () => {
      const code = 'const Button = () => <button>Click</button>;';
      const result = ensureRenderCall(code);
      expect(result).toBe('const Button = () => <button>Click</button>;\n\nrender(<Button />);');
    });
  });

  describe('no PascalCase component', () => {
    it('returns code unchanged when no PascalCase component found', () => {
      const code = 'const button = () => <button>Click</button>;';
      const result = ensureRenderCall(code);
      expect(result).toBe(code);
    });

    it('does not add render call for lowercase component', () => {
      const code = 'const greet = () => "Hello";';
      const result = ensureRenderCall(code);
      expect(result).toBe(code);
    });

    it('does not modify code without component definition', () => {
      const code = 'const greeting = "Hello World";';
      const result = ensureRenderCall(code);
      expect(result).toBe(code);
    });
  });

  describe('edge cases', () => {
    it('handles multi-line component with render call added', () => {
      const code = `const ComplexButton = () => {
  const [state, setState] = React.useState(false);
  return <button>{state ? 'On' : 'Off'}</button>;
}`;
      const result = ensureRenderCall(code);
      expect(result).toContain('render(<ComplexButton />);');
    });

    it('handles component with trailing semicolon', () => {
      const code = 'const StyledDiv = () => <div style={{color: "blue"}}>Content</div>;';
      const result = ensureRenderCall(code);
      expect(result).toContain('render(<StyledDiv />);');
    });
  });
});
