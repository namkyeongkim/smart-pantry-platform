import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Recipes() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    try {
      const res = await api.get('/admin/recipes/cooked');
      setRecipes(res.data);
    } catch (error) {
      console.error('Cooked recipes error:', error);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Recipes</h1>
        <p>View recipe popularity based on actual cooking activity.</p>
      </div>

      <div className="section-card">
        <h2>Most Cooked Recipes</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Recipe ID</th>
              <th>Title</th>
              <th>Cook Count</th>
              <th>Last Cooked</th>
            </tr>
          </thead>

          <tbody>
            {recipes.map((recipe, index) => (
              <tr key={index}>
                <td>{recipe.recipe_id}</td>
                <td>{recipe.title || 'Untitled Recipe'}</td>
                <td>{recipe.cook_count || recipe.value || 0}</td>
                <td>
                  {recipe.last_cooked_at
                    ? new Date(recipe.last_cooked_at).toLocaleDateString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Recipes;