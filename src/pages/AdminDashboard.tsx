import React, { useState } from "react";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

// Create the client with your generated schema types
const client = generateClient<Schema>();

// Dummy list of users; in a real app, fetch this from your backend
interface User {
  id: string;
  email: string;
}

const dummyUsers: User[] = [
  { id: "5468d468-4061-70ed-8870-45c766d26225", email: "user1@example.com" },
  { id: "12345678-4061-70ed-8870-45c766d26225", email: "user2@example.com" },
  { id: "87654321-4061-70ed-8870-45c766d26225", email: "user3@example.com" },
];

const AdminDashboard: React.FC = () => {
  const [users] = useState<User[]>(dummyUsers);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Handler to call the mutation for adding a user to the admin group
  const handleMakeAdmin = async (userId: string) => {
    setLoading(true);
    setMessage("");
    try {
      // Call the mutation using the generated client.
      const response = await client.mutations.addUserToGroup({
        groupName: "Admin",
        userId,
      });
      setMessage(`User ${userId} has been added to the ADMINS group.`);
      console.log("Mutation response:", response);
    } catch (error) {
      console.error("Error adding user to admin group:", error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>
      {message && <p>{message}</p>}
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>
                <button
                  onClick={() => handleMakeAdmin(user.id)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Make Admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
