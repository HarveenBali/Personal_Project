import type { AppProps } from 'next/app';
import { useState } from 'react';
import { Provider } from 'react-redux';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AppLayout } from '../layout/AppLayout';
import { makeStore } from '../store';
import type { AppStore } from '../store';
import '../styles/globals.css';
import 'reactflow/dist/style.css';

export default function App({ Component, pageProps }: AppProps) {
  const [store] = useState<AppStore>(makeStore);

  return (
    <Provider store={store}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </Provider>
  );
}
