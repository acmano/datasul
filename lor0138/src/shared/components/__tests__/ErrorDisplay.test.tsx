/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils/render';
import ErrorDisplay from '../ErrorDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock message from antd
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock env
jest.mock('../../utils/env', () => ({
  env: {
    IS_DEV: false,
  },
}));

describe('ErrorDisplay', () => {
  const mockError = new Error('Test error message');
  mockError.stack = 'Error stack trace here';

  const mockOnReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render error message', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<ErrorDisplay error={mockError} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render custom message instead of error message', () => {
      render(<ErrorDisplay error={mockError} customMessage="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    it('should render default message when error has no message', () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      render(<ErrorDisplay error={errorWithoutMessage} />);

      expect(screen.getByText('Ocorreu um erro inesperado')).toBeInTheDocument();
    });
  });

  describe('Correlation ID', () => {
    it('should display correlation ID when provided', () => {
      render(<ErrorDisplay error={mockError} correlationId="abc-123-def-456" />);

      expect(screen.getByText('ID de Rastreamento:')).toBeInTheDocument();
      expect(screen.getByText('abc-123-def-456')).toBeInTheDocument();
    });

    it('should not display correlation ID section when not provided', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.queryByText('ID de Rastreamento:')).not.toBeInTheDocument();
    });

    it('should show copy button when correlation ID provided', () => {
      render(<ErrorDisplay error={mockError} correlationId="abc-123-def-456" />);

      expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
    });

    it('should copy correlation ID to clipboard when copy button clicked', async () => {
      const { message } = require('antd');

      render(<ErrorDisplay error={mockError} correlationId="abc-123-def-456" />);

      const copyButton = screen.getByRole('button', { name: /copiar/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc-123-def-456');
      });
      expect(message.success).toHaveBeenCalledWith('ID copiado para a área de transferência');
    });
  });

  describe('Reload Button', () => {
    it('should show reload button by default', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByRole('button', { name: /recarregar página/i })).toBeInTheDocument();
    });

    it('should hide reload button when showReloadButton is false', () => {
      render(<ErrorDisplay error={mockError} showReloadButton={false} />);

      expect(screen.queryByRole('button', { name: /recarregar página/i })).not.toBeInTheDocument();
    });

    it('should call onReload when reload button clicked', () => {
      render(<ErrorDisplay error={mockError} onReload={mockOnReload} />);

      const reloadButton = screen.getByRole('button', { name: /recarregar página/i });
      fireEvent.click(reloadButton);

      expect(mockOnReload).toHaveBeenCalled();
    });

    it('should reload window when reload button clicked and no onReload provided', () => {
      // Mock window.location.reload correctly
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, reload: jest.fn() } as any;

      render(<ErrorDisplay error={mockError} />);

      const reloadButton = screen.getByRole('button', { name: /recarregar página/i });
      fireEvent.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalled();

      // Restore
      window.location = originalLocation;
    });
  });

  describe('Alert Type', () => {
    it('should render error alert by default', () => {
      const { container } = render(<ErrorDisplay error={mockError} />);

      const alert = container.querySelector('.ant-alert-error');
      expect(alert).toBeInTheDocument();
    });

    it('should render warning alert when type is warning', () => {
      const { container } = render(<ErrorDisplay error={mockError} type="warning" />);

      const alert = container.querySelector('.ant-alert-warning');
      expect(alert).toBeInTheDocument();
    });

    it('should render info alert when type is info', () => {
      const { container } = render(<ErrorDisplay error={mockError} type="info" />);

      const alert = container.querySelector('.ant-alert-info');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Stack Trace (Development)', () => {
    it('should not show stack trace in production', () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
    });

    it('should show stack trace in development', () => {
      // Mock development environment
      const env = require('../../utils/env');
      env.env.IS_DEV = true;

      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText(/stack trace \(desenvolvimento\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Error stack trace here/)).toBeInTheDocument();

      // Restore
      env.env.IS_DEV = false;
    });
  });
});
