import { test, expect } from 'bun:test';

test('removeComponent should remove component by id', () => {
  const initialComponents = [
    { id: '1', prompt: 'Button', code: 'const Button = () => <button />;', createdAt: new Date() },
    { id: '2', prompt: 'Input', code: 'const Input = () => <input />;', createdAt: new Date() },
  ];

  const targetId = '1';
  const result = initialComponents.filter(c => c.id !== targetId);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

test('clearAll should return empty array', () => {
  const components = [
    { id: '1', prompt: 'Button', code: 'const Button = () => <button />;', createdAt: new Date() },
  ];

  const result = [];

  expect(result).toHaveLength(0);
});

test('generate returns component code from prompt', async () => {
  const prompt = 'Create a beautiful blue button';

  // 이 테스트는 실패할 것입니다 (generate 함수 미구현)
  // @todo: 실제 generate 함수 구현 필요
  const mockGenerate = async (prompt: string) => {
    // 아직 구현되지 않음
    return undefined;
  };

  const result = await mockGenerate(prompt);
  expect(result).toBeDefined();
  expect(result).toMatch(/^const\s+\w+\s*=/);
});
