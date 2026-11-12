import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import OwnerCategoryPage from './OwnerCategoryPage';

const { socket } = vi.hoisted(() => ({
  socket: {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  },
}));

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/owner-category/1']}>
      <Routes>
        <Route path="/owner-category/:categoryId" element={<OwnerCategoryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('locationId', '2');
  sessionStorage.setItem('token', 'owner-token');
  sessionStorage.setItem('currencyCode', 'HUF');
  window.confirm = vi.fn(() => true);
  window.alert = vi.fn();

  axios.get.mockImplementation((url) => {
    if (url.includes('/api/productsbycategory/1')) {
      return Promise.resolve({
        data: {
          category_name: 'Dairy',
          products: [{
            product_id: 1,
            product_name: 'Milk',
            image_path: 'images/milk.jpg',
          }],
        },
      });
    }
    if (url.includes('/api/products/1?locationId=2')) {
      return Promise.resolve({ data: { data: { price: 80 } } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  axios.delete.mockResolvedValue({ status: 200 });
});

test('removes the product from the list after a successful delete', async () => {
  renderPage();

  expect(await screen.findByText('Milk')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/api/products/1`,
      { headers: { Authorization: 'Bearer owner-token' } }
    );
  });

  await waitFor(() => {
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
  });

  expect(window.alert).toHaveBeenCalledWith('Product deleted successfully');
});
