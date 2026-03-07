import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { LoginPage } from './LoginPage';

// Mock AuthContext so we control login behavior
const mockLogin = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('renders login form with email, password, and sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /TeamHub/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('login-email')).toBeInTheDocument();
    expect(screen.getByTestId('login-password')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('renders links to forgot password and register', () => {
    render(<LoginPage />);

    expect(screen.getByRole('link', { name: /Forgot your password/i })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: /Sign up/i })).toHaveAttribute('href', '/register');
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'Test123!' } });
    fireEvent.click(screen.getByTestId('login-submit'));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Test123!');
  });

  it('shows error when login fails', async () => {
    // Simulate API error response so LoginPage shows server message
    const err = new Error('Invalid credentials') as Error & { response?: { data?: { message?: string } } };
    err.response = { data: { message: 'Invalid credentials' } };
    mockLogin.mockRejectedValueOnce(err);

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });
});
