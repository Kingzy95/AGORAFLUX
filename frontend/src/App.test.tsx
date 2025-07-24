import React from 'react';
import { render, screen } from '@testing-library/react';

// Test simple pour vérifier que React fonctionne
describe('App Tests', () => {
  test('React environment is working', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
  
  test('Basic JavaScript functionality', () => {
    expect(1 + 1).toBe(2);
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
  
  test('Array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
  
  test('Object operations', () => {
    const obj = { name: 'AgoraFlux', version: '1.0' };
    expect(obj.name).toBe('AgoraFlux');
    expect(Object.keys(obj)).toEqual(['name', 'version']);
  });
  
  test('Promise handling', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});
