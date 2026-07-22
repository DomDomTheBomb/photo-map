import { Routes, Route, BrowserRouter } from 'react-router-dom';

import Header from './components/layout/Header';
import MainView from './views/MainView';

import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="/admin" element={<MainView />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
