import { useEffect, useState } from 'react';
import api from '../services/api.js';

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Users error:', error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <h1>Users</h1>
        <p>View registered users and basic account activity.</p>
      </div>

      <div className="section-card">
        <h2>User List</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Created At</th>
              <th>Pantry Items</th>
              <th>Favorites</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>{user.pantry_count}</td>
                <td>{user.favorite_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;