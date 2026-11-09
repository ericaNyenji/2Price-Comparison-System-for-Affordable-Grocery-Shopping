import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from './TopNav';

function renderTopNav(userType = 'customer') {
  return render(
    <MemoryRouter>
      <TopNav userType={userType} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('name', 'Ava');
});

test('opens and closes the profile menu when clicking outside', () => {
  const { container } = renderTopNav();

  expect(screen.queryByText('My Profile')).not.toBeInTheDocument();

  fireEvent.click(container.querySelector('.avatar-wrapper'));
  expect(screen.getByText('My Profile')).toBeInTheDocument();
  expect(screen.getByText('Logout')).toBeInTheDocument();

  fireEvent.click(document.body);
  expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
});

test('shows the greeting from session storage', () => {
  renderTopNav();
  expect(screen.getByText('Hello, Ava')).toBeInTheDocument();
});
