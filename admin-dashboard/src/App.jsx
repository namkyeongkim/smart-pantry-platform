import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar.jsx';
import Header from './components/Layout/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Recipes from './pages/Recipes.jsx';
import Pantry from './pages/Pantry.jsx';
import Analytics from './pages/Analytics.jsx';
import './styles/dashboard.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />

        <div className="main-layout">
          <Header />

          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/pantry" element={<Pantry />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;