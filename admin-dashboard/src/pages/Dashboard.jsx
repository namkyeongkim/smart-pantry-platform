import { useEffect, useState } from 'react';
import api from '../services/api.js';
import StatCard from '../components/Dashboard/StatCard.jsx';
import TopRecipesChart from '../components/Dashboard/TopRecipesChart.jsx';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalPantryItems: 0,
    totalPrivatePantryItems: 0,
    totalSharedPantryItems: 0,
    totalSharedPantries: 0,
    totalFavorites: 0,
  });

  const [topRecipes, setTopRecipes] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTopRecipes();
    fetchLowStock();
  }, []);

  async function fetchStats() {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  }

  async function fetchTopRecipes() {
    try {
      const res = await api.get('/admin/recipes/top');
      setTopRecipes(res.data);
    } catch (error) {
      console.error('Top recipes error:', error);
    }
  }

  async function fetchLowStock() {
    try {
      const res = await api.get('/admin/pantry/low-stock');
      setLowStockItems(res.data);
    } catch (error) {
      console.error('Low stock error:', error);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Dashboard Overview</h1>
        <p>Track system usage, recipe engagement, and pantry status.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Recipes" value={stats.totalRecipes} />
        <StatCard title="Total Pantry Items" value={stats.totalPantryItems} />
        <StatCard title="Private Pantry Items" value={stats.totalPrivatePantryItems} />
        <StatCard title="Shared Pantry Items" value={stats.totalSharedPantryItems} />
        <StatCard title="Shared Pantries" value={stats.totalSharedPantries} />
        <StatCard title="Total Favorites" value={stats.totalFavorites} />
      </div>

      <div className="section-grid">
        <div className="section-card">
          <h2>Popular Recipes</h2>
          {topRecipes.length === 0 ? (
            <p>No recipe data available.</p>
          ) : (
            <TopRecipesChart data={topRecipes} />
          )}
        </div>

        <div className="section-card">
          <h2>Low Stock Items</h2>
          {lowStockItems.length === 0 ? (
            <p>No low stock items.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Quantity</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td className="low-stock-warning">
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.pantry_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;