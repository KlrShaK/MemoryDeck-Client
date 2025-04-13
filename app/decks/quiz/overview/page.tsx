"use client";

import React, { useState, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { SearchOutlined } from '@ant-design/icons';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

interface UserWithStatus extends User {
  status: string;
}

// Sample users for testing
const sampleUsers: UserWithStatus[] = [
  { id: "1", username: "Alice", name: "Alice Smith", status: "ONLINE", token: null },
  { id: "2", username: "Bob", name: "Bob Johnson", status: "ONLINE", token: null },
  { id: "3", username: "Charlie", name: "Charlie Brown", status: "OFFLINE", token: null },
  { id: "4", username: "David", name: "David Miller", status: "ONLINE", token: null },
  { id: "5", username: "Eva", name: "Eva Wilson", status: "ONLINE", token: null },
  { id: "6", username: "Frank", name: "Frank Thomas", status: "OFFLINE", token: null },
  { id: "7", username: "Grace", name: "Grace Lee", status: "ONLINE", token: null },
  { id: "8", username: "Hannah", name: "Hannah Garcia", status: "OFFLINE", token: null },
  { id: "9", username: "Ian", name: "Ian Roberts", status: "ONLINE", token: null },
  { id: "10", username: "Julia", name: "Julia Chen", status: "ONLINE", token: null },
];

const QuizInvitePage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [searchText, setSearchText] = useState<string>('');
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { value: userId } = useLocalStorage<string>("user_id", "");

  // Fetch users from API or use sample data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Try to fetch users from API
        const fetchedUsers = await apiService.get<User[]>('/users');
        const usersWithStatus = fetchedUsers.map(user => ({
          ...user,
          status: user.status || 'OFFLINE'
        }));
        setUsers(usersWithStatus);
      } catch (error) {
        console.error('Failed to fetch users from API, using sample data:', error);
        // Use sample data if API call fails
        setUsers(sampleUsers);
        message.info('Using sample user data for testing');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [apiService]);

  const handleSendInvite = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      // Get the user ID of the selected user
      const selectedUserObject = users.find(user => user.username === selectedUser);
      
      if (!selectedUserObject || !selectedUserObject.id) {
        message.error('Selected user not found');
        return;
      }

      // API call
      await apiService.post('/invitations', {
        fromUserId: userId,
        toUserId: selectedUserObject.id,
        timeLimit: 60, // Default time limit in seconds
        isAccepted: false
      });
      
      message.success(`Invitation sent to ${selectedUser}!`);
      router.push('/decks');
    } catch (error) {
      console.error('Error sending invitation:', error);
      message.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseRandom = () => {
    const onlineUsers = users.filter(user => 
      user.status === 'ONLINE' && user.id?.toString() !== userId
    );
    
    if (onlineUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * onlineUsers.length);
      const randomUser = onlineUsers[randomIndex];
      setSelectedUser(randomUser.username || null);
    } else {
      message.info('No other online users available');
    }
  };

  const handleExit = () => {
    router.push('/decks');
  };

  const filteredUsers = users.filter(user => 
    user.id?.toString() !== userId &&
    (user.username?.toLowerCase() || "").includes(searchText.toLowerCase())
  );

  return (
    <div style={{ 
      backgroundColor: '#ccf0cc', 
      minHeight: '100vh', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center' 
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        Start a Quiz
      </h1>

      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <Button 
          onClick={handleExit}
          style={{ 
            backgroundColor: '#285c28',
            borderColor: '#285c28',
            color: 'white',
            borderRadius: '4px'
          }}
        >
          Exit
        </Button>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        width: '80%',
        maxWidth: '800px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <Input
          placeholder="Search by username..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ 
            marginBottom: '20px',
            color: 'black',
            background: '#f5f5f5', 
            borderRadius: '20px',
            padding: '10px 15px',
            border: 'none'
          }}
        />

        <div style={{ background: '#1f1f1f', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            padding: '12px 20px',
            borderBottom: '1px solid #333',
            fontWeight: 'bold',
            color: 'white'
          }}>
            <div style={{ flex: 1 }}>Username</div>
            <div style={{ width: '100px', textAlign: 'right' }}>Status</div>
          </div>

          {/* User List */}
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>No users found</div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id}
                onClick={() => setSelectedUser(user.username || null)}
                style={{ 
                  display: 'flex', 
                  padding: '16px 20px',
                  borderBottom: '1px solid #333',
                  cursor: 'pointer',
                  color: 'white',
                  backgroundColor: selectedUser === user.username ? '#2a4d2a' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ flex: 1 }}>{user.username}</div>
                <div 
                  style={{ 
                    width: '100px', 
                    textAlign: 'right',
                    color: user.status === 'ONLINE' ? '#4CAF50' : '#9e9e9e'
                  }}
                >
                  {user.status === 'ONLINE' ? 'Online' : 'Offline'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '20px',
        gap: '20px'
      }}>
        <Button 
          onClick={handleSendInvite}
          disabled={!selectedUser || loading}
          style={{ 
            backgroundColor: '#285c28',
            borderColor: '#285c28',
            color: 'white',
            padding: '0 30px',
            height: '40px',
            borderRadius: '4px'
          }}
        >
          Send Quiz invitation
        </Button>
        <Button 
          onClick={handleChooseRandom}
          disabled={loading}
          style={{ 
            backgroundColor: 'white',
            borderColor: '#285c28',
            color: '#285c28',
            padding: '0 30px',
            height: '40px',
            borderRadius: '4px'
          }}
        >
          Choose Random
        </Button>
      </div>
    </div>
  );
};

export default QuizInvitePage;