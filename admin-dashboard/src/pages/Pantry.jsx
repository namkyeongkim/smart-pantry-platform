import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Pantry() {
  const [pantryItems, setPantryItems] = useState([]);

  useEffect(() => {
    fetchPantry();
  }, []);

  async function fetchPantry() {
    try {
      const res = await api.get('/admin/pantry');
      setPantryItems(res.data);
    } catch (error) {
      console.error('Pantry error:', error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Pantry</h1>
        <p>View ingredient usage and total pantry quantities across users.</p>
      </div>

      <div className="section-card">
        <h2>Pantry Overview</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Total Quantity</th>
              <th>Unit</th>
              <th>Users Holding Item</th>
            </tr>
          </thead>
          <tbody>
            {pantryItems.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.total_quantity}</td>
                <td>{item.unit || 'N/A'}</td>
                <td>{item.user_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pantry;