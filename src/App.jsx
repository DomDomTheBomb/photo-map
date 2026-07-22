import { Routes, Route, BrowserRouter } from 'react-router-dom';

import Header from './components/layout/Header';
import MainView from './views/MainView';

export default function App() {

  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/admin" element={<MainView />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
