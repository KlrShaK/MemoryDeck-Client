"use client";

import React, { useState, useEffect } from 'react';
import { Input, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { SearchOutlined } from '@ant-design/icons';

interface User {
  username: string;
  status: 'Online' | 'Offline';
}

const QuizInvitePage: React.FC = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Simulate fetching users
  useEffect(() => {
    setTimeout(() => {
      const mockUsers: User[] = [
        { username: 'Alice', status: 'Online' },
        { username: 'Bob', status: 'Online' },
        { username: 'Marc', status: 'Offline' },
        { username: 'Charlie', status: 'Online' },
        { username: 'Daisy', status: 'Online' },
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  const handleSendInvite = () => {
    if (selectedUser) {
      console.log(`Sending quiz invitation to ${selectedUser}`);
      // Future API call
      // apiService.post('/invitations', { username: selectedUser, quizType: 'flashcards' });
    }
  };

  const handleChooseRandom = () => {
    const onlineUsers = users.filter(user => user.status === 'Online');
    if (onlineUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * onlineUsers.length);
      const randomUser = onlineUsers[randomIndex];
      setSelectedUser(randomUser.username);
    } else {
      console.log('No online users available');
    }
  };

  const handleExit = () => {
    router.push('/home');
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchText.toLowerCase())
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
            background: '#1f1f1f', 
            color: 'white',
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
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.username}
                onClick={() => setSelectedUser(user.username)}
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
                    color: user.status === 'Online' ? '#4CAF50' : '#9e9e9e'
                  }}
                >
                  {user.status}
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
          disabled={!selectedUser}
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