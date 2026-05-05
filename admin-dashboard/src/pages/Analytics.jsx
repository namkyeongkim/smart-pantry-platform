import { useEffect, useState } from 'react';
import api from '../services/api.js';
import TopRecipesChart from '../components/Dashboard/TopRecipesChart.jsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function Analytics() {
  const [cookedRecipes, setCookedRecipes] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    fetchCookedRecipes();
    fetchGrowth();
  }, []);

  async function fetchCookedRecipes() {
    try {
      const res = await api.get('/admin/recipes/cooked');
      setCookedRecipes(res.data);
    } catch (error) {
      console.error('Analytics cooked recipes error:', error);
    }
  }

  async function fetchGrowth() {
    try {
      const res = await api.get('/admin/growth');

      const formatted = res.data.map((item) => ({
        date: item.signup_date,
        signups: parseInt(item.signup_count),
      }));

      setGrowthData(formatted);
    } catch (error) {
      console.error('Growth error:', error);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Analytics</h1>
        <p>View cooking activity and user growth insights across the system.</p>
      </div>

      <div className="section-grid">
        <div className="section-card">
          <h2>Most Cooked Recipes Chart</h2>
          <p>Recipes ranked based on actual cooking activity.</p>

          {cookedRecipes.length === 0 ? (
            <p>No cooking data available.</p>
          ) : (
            <TopRecipesChart data={cookedRecipes} />
          )}
        </div>

        <div className="section-card">
          <h2>User Growth</h2>

          {growthData.length === 0 ? (
            <p>No user growth data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={growthData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;