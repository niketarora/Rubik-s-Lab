import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import CubeNet2D from '../components/cube/CubeNet2D';
import CubeViewToggle from '../components/cube/CubeViewToggle';
import { SOLVED_STATE } from '../utils/cube';

describe('Shared UI Components', () => {
  describe('Button Component', () => {
    it('renders with children text and correct base classes', () => {
      render(<Button>Solve Cube</Button>);
      const btn = screen.getByRole('button', { name: 'Solve Cube' });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('bg-accent-black'); // Default variant class
    });

    it('applies correct variant styles', () => {
      const { rerender } = render(<Button variant="primary-blue">Start Benchmark</Button>);
      let btn = screen.getByRole('button', { name: 'Start Benchmark' });
      expect(btn).toHaveClass('bg-accent-blue');

      rerender(<Button variant="secondary">Reset</Button>);
      btn = screen.getByRole('button', { name: 'Reset' });
      expect(btn).toHaveClass('bg-white');
      expect(btn).toHaveClass('border-subtle');
    });

    it('triggers onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const btn = screen.getByRole('button', { name: 'Disabled' });
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Card Component', () => {
    it('renders children and optional title/subtitle', () => {
      render(
        <Card title="Test Card" subtitle="Test Subtitle">
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });
  });

  describe('StatusBadge Component', () => {
    it('renders correct state labels and classes', () => {
      const { rerender } = render(<StatusBadge status="SOLVED" />);
      let badge = screen.getByText('SOLVED');
      expect(badge).toHaveClass('bg-accent-green-bg');
      expect(badge).toHaveClass('text-accent-green');

      rerender(<StatusBadge status="TIMEOUT" />);
      badge = screen.getByText('TIMED OUT');
      expect(badge).toHaveClass('bg-accent-red-bg');
      expect(badge).toHaveClass('text-accent-red');

      rerender(<StatusBadge status="RUNNING" />);
      badge = screen.getByText('RUNNING');
      expect(badge).toHaveClass('bg-accent-blue-bg');
      expect(badge).toHaveClass('text-accent-blue');
    });
  });

  describe('CubeNet2D Component', () => {
    it('renders the 2D cross layout grid net', () => {
      render(<CubeNet2D stickers={SOLVED_STATE} />);
      expect(screen.getByText('2D Cube Net Sticker Map')).toBeInTheDocument();
      expect(screen.getByText('Flat projection')).toBeInTheDocument();
      
      // Verify face indicators are present
      expect(screen.getByText('U (Yellow)')).toBeInTheDocument();
      expect(screen.getByText('F (Green)')).toBeInTheDocument();
      expect(screen.getByText('L (Orange)')).toBeInTheDocument();
      expect(screen.getByText('R (Red)')).toBeInTheDocument();
      expect(screen.getByText('B (Blue)')).toBeInTheDocument();
      expect(screen.getByText('D (White)')).toBeInTheDocument();
    });
  });

  describe('CubeViewToggle Component', () => {
    it('renders 2D and 3D toggle options and highlights active', () => {
      const handleToggle = vi.fn();
      const { rerender } = render(<CubeViewToggle view="2D" onViewChange={handleToggle} />);
      
      const btn2D = screen.getByRole('button', { name: '2D Net' });
      const btn3D = screen.getByRole('button', { name: '3D View' });
      
      expect(btn2D).toBeInTheDocument();
      expect(btn3D).toBeInTheDocument();
      expect(btn2D).toHaveClass('bg-white'); // Active state
      expect(btn3D).not.toHaveClass('bg-white'); // Inactive state

      fireEvent.click(btn3D);
      expect(handleToggle).toHaveBeenCalledWith('3D');

      rerender(<CubeViewToggle view="3D" onViewChange={handleToggle} />);
      expect(btn3D).toHaveClass('bg-white');
      expect(btn2D).not.toHaveClass('bg-white');
    });
  });
});
