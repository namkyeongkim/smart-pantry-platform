import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Recipes() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await api.get('/admin/recipes');
      setRecipes(res.data);
    } catch (error) {
      console.error('Recipes error:', error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Recipes</h1>
        <p>View recipe popularity based on favorite counts.</p>
      </div>

      <div className="section-card">
        <h2>Recipe List</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Recipe ID</th>
              <th>Title</th>
              <th>Favorite Count</th>
              <th>Last Favorited</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe, index) => (
              <tr key={index}>
                <td>{recipe.recipe_id}</td>
                <td>{recipe.title || 'Untitled Recipe'}</td>
                <td>{recipe.favorite_count}</td>
                <td>
                  {recipe.last_favorited_at
                    ? new Date(recipe.last_favorited_at).toLocaleDateString()
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