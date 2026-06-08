import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '../src/hooks/useAuth';
import { PrivacyProvider } from '../src/hooks/usePrivacy';
import { WalletFilterProvider } from '../src/hooks/useWalletFilter';
import { MonthFilterProvider } from '../src/hooks/useMonthFilter';
import { NavigationProvider } from '../src/hooks/useNavigation';
import { mswHandlers } from './msw-handlers';

initialize({ onUnhandledRequest: 'bypass' });

const STORAGE_KEY = 'gajian_aman_user';
const TEST_USER = { userId: 1, name: 'Test User', email: 'test@example.com' };

const preview: Preview = {
  decorators: [
    (Story) => (
      <BrowserRouter>
        <AuthProvider>
          <PrivacyProvider>
            <WalletFilterProvider>
              <MonthFilterProvider>
                <NavigationProvider>
                  <Story />
                </NavigationProvider>
              </MonthFilterProvider>
            </WalletFilterProvider>
          </PrivacyProvider>
        </AuthProvider>
      </BrowserRouter>
    ),
  ],
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: mswHandlers },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
  },
  async beforeEach() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(TEST_USER));
  },
};

export default preview;