import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Pantry() {
  const [pantryItems, setPantryItems] = useState([]);

  useEffect(() => {
    fetchPantry();
  }, []);

  // Fetch aggregated pantry data from backend
  async function fetchPantry() {
    try {
      const res = await api.get('/admin/pantry');
      setPantryItems(res.data);
    } catch (error) {
      console.error('Pantry error:', error);
    }
  }

  // Show only top 15 items to avoid overwhelming UI
  const topPantryItems = pantryItems.slice(0, 15);

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Pantry Insights</h1>
        <p>
          Review the most common ingredients and compare personal pantry usage
          with shared pantry usage.
        </p>
      </div>

      <div className="section-card">
        <h2>Top Pantry Ingredients</h2>

        {/* Explanation for what this table represents */}
        <p>
          This table shows the highest-quantity pantry items across all users,
          helping identify commonly used ingredients and usage patterns.
        </p>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Total Quantity</th>
              <th>Unit</th>
              <th>Users</th>
              <th>Pantry Type</th>
            </tr>
          </thead>

          <tbody>
            {topPantryItems.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.total_quantity}</td>

                {/* Normalize unit display */}
                <td>{item.unit ? item.unit.toLowerCase() : 'N/A'}</td>

                <td>{item.user_count}</td>

                {/* Convert backend "private" → UI "personal" */}
                <td>
                  <span
                    className={
                      item.pantry_type === 'shared'
                        ? 'type-badge shared-badge'
                        : 'type-badge personal-badge'
                    }
                  >
                    {item.pantry_type === 'shared' ? 'shared' : 'personal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pantry;