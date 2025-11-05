/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { RateLimitProvider, useRateLimit } from '../RateLimitContext';

describe('RateLimitContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RateLimitProvider>{children}</RateLimitProvider>
  );

  describe('Initial State', () => {
    it('should provide initial state with no rate limit', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.retryAfter).toBeNull();
      expect(result.current.limit).toBeNull();
      expect(result.current.remaining).toBeNull();
      expect(result.current.reset).toBeNull();
    });
  });

  describe('updateFromHeaders', () => {
    it('should update rate limit info from headers', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '50',
          'x-ratelimit-reset': '1234567890',
        });
      });

      expect(result.current.limit).toBe(100);
      expect(result.current.remaining).toBe(50);
      expect(result.current.reset).toBe(1234567890);
      expect(result.current.isRateLimited).toBe(false);
    });

    it('should update remaining to 0 but not set isRateLimited', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890',
        });
      });

      // updateFromHeaders apenas atualiza os valores, não define isRateLimited
      // Apenas setRateLimitError define isRateLimited
      expect(result.current.remaining).toBe(0);
      expect(result.current.isRateLimited).toBe(false);
    });
  });

  describe('setRateLimitError', () => {
    it('should set rate limit error with retry after', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      const mockError = {
        message: 'Rate limit exceeded',
        response: { status: 429 },
      } as any;

      act(() => {
        result.current.setRateLimitError(
          {
            'retry-after': '60',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1234567890',
          },
          mockError
        );
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.retryAfter).toBe(60);
    });

    it('should use null retry after when not provided', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      const mockError = {
        message: 'Rate limit exceeded',
        response: { status: 429 },
      } as any;

      act(() => {
        result.current.setRateLimitError({}, mockError);
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.retryAfter).toBeNull();
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limit state', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      const mockError = {
        message: 'Rate limit exceeded',
        response: { status: 429 },
      } as any;

      // Set rate limit
      act(() => {
        result.current.setRateLimitError(
          {
            'retry-after': '60',
          },
          mockError
        );
      });

      expect(result.current.isRateLimited).toBe(true);

      // Clear
      act(() => {
        result.current.clearRateLimit();
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.retryAfter).toBeNull();
    });

    it('should clear rate limit but keep usage info', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      const mockError = {
        message: 'Rate limit exceeded',
        response: { status: 429 },
      } as any;

      // Set rate limit info first
      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890',
        });
      });

      expect(result.current.limit).toBe(100);

      // Then set error
      act(() => {
        result.current.setRateLimitError(
          {
            'retry-after': '60',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1234567890',
          },
          mockError
        );
      });

      expect(result.current.isRateLimited).toBe(true);

      // Clear rate limit state
      act(() => {
        result.current.clearRateLimit();
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.retryAfter).toBeNull();
      // Usage info is kept after clear
      expect(result.current.limit).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useRateLimit());
      }).toThrow('useRateLimit deve ser usado dentro de um RateLimitProvider');

      consoleError.mockRestore();
    });
  });

  describe('Multiple Updates', () => {
    it('should handle multiple updates correctly', () => {
      const { result } = renderHook(() => useRateLimit(), { wrapper });

      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '90',
          'x-ratelimit-reset': '1000',
        });
      });

      expect(result.current.remaining).toBe(90);

      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '80',
          'x-ratelimit-reset': '1000',
        });
      });

      expect(result.current.remaining).toBe(80);

      act(() => {
        result.current.updateFromHeaders({
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1000',
        });
      });

      expect(result.current.remaining).toBe(0);
      // updateFromHeaders não define isRateLimited
      expect(result.current.isRateLimited).toBe(false);
    });
  });
});
