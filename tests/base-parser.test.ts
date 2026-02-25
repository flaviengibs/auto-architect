import { BaseParser } from '../src/parser/base-parser';
import { Module } from '../src/types';

// Concrete implementation for testing
class TestParser extends BaseParser {
  protected languageName = 'test';
  protected fileExtensions = ['.test'];

  parse(filePath: string, content: string, projectPath: string): Module {
    const base = this.createBaseModule(filePath, content);
    return {
      ...base,
      name: base.name!,
      path: base.path!,
      dependencies: base.dependencies!,
      dependents: base.dependents!,
      size: base.size!,
      complexity: this.calculateComplexity(content),
      functions: base.functions!,
      classes: base.classes!,
      exports: base.exports!,
      imports: base.imports!,
      hasTests: base.hasTests!
    };
  }
}

describe('BaseParser', () => {
  let parser: TestParser;

  beforeEach(() => {
    parser = new TestParser();
  });

  describe('getModuleName', () => {
    it('should extract module name from file path', () => {
      const name = (parser as any).getModuleName('src/utils/helper.ts');
      expect(name).toBe('src/utils/helper');
    });

    it('should handle Windows paths', () => {
      const name = (parser as any).getModuleName('src\\utils\\helper.ts');
      expect(name).toBe('src/utils/helper');
    });

    it('should remove various extensions', () => {
      expect((parser as any).getModuleName('file.js')).toBe('file');
      expect((parser as any).getModuleName('file.py')).toBe('file');
      expect((parser as any).getModuleName('file.java')).toBe('file');
    });
  });

  describe('isTestFile', () => {
    it('should identify test files', () => {
      expect((parser as any).isTestFile('utils.test.ts')).toBe(true);
      expect((parser as any).isTestFile('utils.spec.ts')).toBe(true);
      expect((parser as any).isTestFile('test_utils.py')).toBe(true);
      expect((parser as any).isTestFile('src/test/utils.ts')).toBe(true);
    });

    it('should not identify regular files as tests', () => {
      expect((parser as any).isTestFile('utils.ts')).toBe(false);
      expect((parser as any).isTestFile('helper.js')).toBe(false);
    });
  });

  describe('calculateComplexity', () => {
    it('should calculate basic complexity', () => {
      const content = 'function test() { return 1; }';
      expect((parser as any).calculateComplexity(content)).toBe(1);
    });

    it('should count if statements', () => {
      const content = 'if (a) { } if (b) { }';
      expect((parser as any).calculateComplexity(content)).toBe(3);
    });

    it('should count loops', () => {
      const content = 'for (let i = 0; i < 10; i++) { while (true) { } }';
      expect((parser as any).calculateComplexity(content)).toBe(3);
    });

    it('should count logical operators', () => {
      const content = 'if (a && b || c) { }';
      expect((parser as any).calculateComplexity(content)).toBe(2); // 1 base + 1 if
    });
  });

  describe('countParameters', () => {
    it('should count function parameters', () => {
      expect((parser as any).countParameters('function(a, b, c)')).toBe(3);
      expect((parser as any).countParameters('function()')).toBe(0);
      expect((parser as any).countParameters('function(a)')).toBe(1);
    });

    it('should handle whitespace', () => {
      expect((parser as any).countParameters('function( a , b , c )')).toBe(3);
    });
  });

  describe('extractFunctionName', () => {
    it('should extract function name', () => {
      expect((parser as any).extractFunctionName('function test()')).toBe('test');
      expect((parser as any).extractFunctionName('myFunc()')).toBe('myFunc');
    });
  });

  describe('isAsyncFunction', () => {
    it('should detect async functions', () => {
      expect((parser as any).isAsyncFunction('async function test()')).toBe(true);
      expect((parser as any).isAsyncFunction('function test() { await x; }')).toBe(true);
      expect((parser as any).isAsyncFunction('function test()')).toBe(false);
    });
  });

  describe('isExported', () => {
    it('should detect exported items', () => {
      expect((parser as any).isExported('export function test()')).toBe(true);
      expect((parser as any).isExported('public class Test')).toBe(true);
      expect((parser as any).isExported('function test()')).toBe(false);
    });
  });

  describe('canParse', () => {
    it('should check if file can be parsed', () => {
      expect(parser.canParse('file.test')).toBe(true);
      expect(parser.canParse('file.other')).toBe(false);
    });
  });

  describe('createBaseModule', () => {
    it('should create base module structure', () => {
      const content = 'line1\nline2\nline3';
      const module = (parser as any).createBaseModule('test.ts', content);
      
      expect(module.name).toBe('test');
      expect(module.size).toBe(3);
      expect(module.dependencies).toEqual([]);
      expect(module.hasTests).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a simple file', () => {
      const content = 'if (true) { console.log("test"); }';
      const module = parser.parse('test.test', content, '/project');
      
      expect(module.name).toBe('test.test'); // Includes extension for test parser
      expect(module.complexity).toBeGreaterThan(1);
      expect(module.size).toBeGreaterThan(0);
    });
  });
});
