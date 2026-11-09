import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Review from './Review';

const { handlers, socket } = vi.hoisted(() => {
  const handlers = {};
  const socket = {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
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

let livePrice;

function renderReview() {
  return render(
    <MemoryRouter initialEntries={['/review/1/location/2/price/100']}>
      <Routes>
        <Route
          path="/review/:productId/location/:locationId/price/:price"
          element={<Review />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
  sessionStorage.clear();
  sessionStorage.setItem('userId', '5');
  sessionStorage.setItem('token', 'test-token');
  livePrice = 80;

  axios.get.mockImplementation((url) => {
    if (url.includes('/api/products/details/')) {
      return Promise.resolve({ data: { product: { image_path: 'images/milk.jpg' } } });
    }
    if (url.includes('/api/reviews/product/')) {
      return Promise.resolve({ data: [] });
    }
    if (url.includes('/api/products/') && url.includes('locationId=')) {
      return Promise.resolve({ data: { data: { price: livePrice } } });
    }
    if (url.includes('/api/locations/')) {
      return Promise.resolve({ data: { location_name: 'Downtown' } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

test('loads the current price from the API, not the URL snapshot', async () => {
  renderReview();

  const priceHeading = await screen.findByText(/Current Price: HUF/);
  expect(priceHeading).toHaveTextContent('80');
  expect(axios.get).toHaveBeenCalledWith(
    `${import.meta.env.VITE_API_URL}/api/products/1?locationId=2`
  );
});

test('updates the displayed price on a priceUpdated socket event', async () => {
  renderReview();
  await screen.findByText(/Current Price: HUF/);

  act(() => {
    handlers.priceUpdated({ product_id: 1, location_id: 2, price: 70 });
  });

  expect(screen.getByText(/Current Price: HUF/)).toHaveTextContent('70');
});

test('joins the user room and refetches the price when a submission is approved', async () => {
  renderReview();
  await screen.findByText(/Current Price: HUF/);

  act(() => handlers.connect());
  expect(socket.emit).toHaveBeenCalledWith('join', '5');

  livePrice = 65;
  await act(async () => {
    await handlers.priceSubmissionApproved();
  });

  expect(screen.getByText(/Current Price: HUF/)).toHaveTextContent('65');
});
