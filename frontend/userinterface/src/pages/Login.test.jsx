import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/customer-dashboard" element={<div>Customer Dashboard</div>} />
        <Route path="/owner-dashboard" element={<div>Owner Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submitCredentials(email, password) {
  await userEvent.type(screen.getByPlaceholderText('Email adress...'), email);
  await userEvent.type(screen.getByPlaceholderText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

test('logs in a customer and redirects to the customer dashboard', async () => {
  axios.post.mockResolvedValueOnce({
    data: {
      token: 'customer-token',
      role: 'customer',
      userId: 7,
      name: 'Ava',
      locationId: 3,
      currency_code: 'HUF',
    },
  });

  renderLogin();
  await submitCredentials('ava@example.com', 'asd');

  await waitFor(() => {
    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
  });

  expect(axios.post).toHaveBeenCalledWith(
    `${import.meta.env.VITE_API_URL}/api/auth`,
    { email: 'ava@example.com', password: 'asd' }
  );
  expect(sessionStorage.getItem('token')).toBe('customer-token');
  expect(sessionStorage.getItem('role')).toBe('customer');
  expect(sessionStorage.getItem('userId')).toBe('7');
  expect(sessionStorage.getItem('locationId')).toBe('3');
  expect(sessionStorage.getItem('currencyCode')).toBe('HUF');
});

test('logs in an owner and redirects to the owner dashboard', async () => {
  axios.post.mockResolvedValueOnce({
    data: {
      token: 'owner-token',
      role: 'owner',
      userId: 9,
      name: 'Go',
      locationId: 4,
      currency_code: 'HUF',
    },
  });

  renderLogin();
  await submitCredentials('go@example.com', 'asd');

  await waitFor(() => {
    expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
  });

  expect(sessionStorage.getItem('role')).toBe('owner');
});

test('shows an error when credentials are rejected', async () => {
  axios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

  renderLogin();
  await submitCredentials('wrong@example.com', 'wrong');

  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  expect(sessionStorage.getItem('token')).toBeNull();
});
