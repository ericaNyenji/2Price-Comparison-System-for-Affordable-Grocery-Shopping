import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import Alerts from './Alerts';

const { handlers, socket } = vi.hoisted(() => {
  const handlers = {};
  const socket = {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  };
  return { handlers, socket };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socket),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const alerts = [
  {
    alert_id: 1,
    message: 'Milk price dropped by 20%',
    type: 'price_change',
    created_at: '2026-01-01T10:00:00.000Z',
    read_at: null,
  },
  {
    alert_id: 2,
    message: 'Deal on Bread expires in 3 hours',
    type: 'deal_expiration',
    created_at: '2026-01-01T09:00:00.000Z',
    read_at: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
  sessionStorage.clear();
  sessionStorage.setItem('userId', '5');
  sessionStorage.setItem('userType', 'customer');
  sessionStorage.setItem('token', 'test-token');
  axios.get.mockResolvedValue({ data: alerts });
  axios.put.mockResolvedValue({ status: 200 });
});

test('fetches and renders the current user alerts', async () => {
  render(<Alerts />);

  expect(await screen.findByText('Milk price dropped by 20%')).toBeInTheDocument();
  expect(screen.getByText('Deal on Bread expires in 3 hours')).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith(
    `${import.meta.env.VITE_API_URL}/api/alerts/5?userType=customer`
  );
});

test('joins the correct socket room and appends real-time alerts', async () => {
  render(<Alerts />);
  await screen.findByText('Milk price dropped by 20%');

  act(() => handlers.connect());
  expect(socket.emit).toHaveBeenCalledWith('join', '5');

  act(() => {
    handlers.newAlert({
      alert_id: 3,
      message: 'Butter price dropped by 10%',
      type: 'price_change',
      timestamp: '2026-01-01T11:00:00.000Z',
    });
  });

  expect(await screen.findByText('Butter price dropped by 10%')).toBeInTheDocument();
});

test('marks an unread alert as read', async () => {
  render(<Alerts />);
  const message = await screen.findByText('Milk price dropped by 20%');

  fireEvent.click(message);

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/api/alerts/1/read`,
      {},
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  await waitFor(() => {
    expect(screen.getAllByText('New')).toHaveLength(1);
  });
});
