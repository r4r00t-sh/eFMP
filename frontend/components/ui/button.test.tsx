import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders as disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders as link when asChild and child is anchor', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link/i })
    expect(link).toHaveAttribute('href', '/test')
  })
})
