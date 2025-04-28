//"Quiz Invitation" to let a logged-in user invite another user to start a quiz
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, Avatar, Button, Input, message, Card, Spin, Modal } from 'antd';
import { UserOutlined, SearchOutlined, UserSwitchOutlined, LoadingOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { User } from '@/types/user';
import { Invitation } from '@/types/invitation';

const { Search } = Input;

// Define interface for API response
interface InvitationResponse {
  id?: string;
  invitationId?: string;
  quizId?: string;
  [key: string]: unknown; // Allow for other properties
}

const UserInvitationPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: currentUserId } = useLocalStorage<string>('user_id', '');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [timeLimit, setTimeLimit] = useState(30); // Default time limit in seconds
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [invitationModalVisible, setInvitationModalVisible] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [waitingModalVisible, setWaitingModalVisible] = useState(false);
  const [, setInvitationSent] = useState(false); // Using empty variable name to avoid unused var warning
  const [currentInvitationId, setCurrentInvitationId] = useState<string | null>(null);

  // Effect to poll for invitation acceptance
  useEffect(() => {
    // Only run the polling if we have an invitation and are waiting
    if (!currentInvitationId || !waitingModalVisible) return;
    
    const checkInvitationStatus = async () => {
      try {
        // Check if the current invitation has been accepted
        const response = await apiService.get<Invitation>(`/quiz/invitation/accepted?fromUserId=${currentUserId}`);
        
        // If we get a response with an accepted invitation that matches our current invitation
        if (response && response.id === currentInvitationId && response.isAccepted) {
          // Get the quiz ID from the response
          const quizId = response.quizId;
          
          if (quizId) {
            // Close the waiting modal
            setWaitingModalVisible(false);
            
            // Navigate to the quiz play page
            router.push(`/decks/quiz/play/${quizId}`);
          }
        }
      } catch (error) {
        console.error("Error checking invitation status:", error);
      }
    };
    
    // Poll every 2 seconds
    const intervalId = setInterval(checkInvitationStatus, 2000);
    
    // Clean up interval on unmount or when waiting modal closes
    return () => clearInterval(intervalId);
  }, [currentInvitationId, waitingModalVisible, currentUserId, apiService, router]);

  useEffect(() => {
    // Sample users for testing
    const sampleUsers = [
      { id: "1", username: "johndoe", name: "John Doe", status: "ONLINE", token: "sample-token-1"},
      { id: "2", username: "janedoe", name: "Jane Doe", status: "ONLINE", token: "sample-token-2"},
      { id: "3", username: "mikebrown", name: "Mike Brown", status: "OFFLINE", token: "sample-token-3"},
      { id: "4", username: "sarahsmith", name: "Sarah Smith", status: "ONLINE", token: "sample-token-4"},
      { id: "5", username: "alexwilson", name: "Alex Wilson", status: "OFFLINE", token: "sample-token-5"}
    ];
    // Retrieve the selected deck ID from localStorage
    const deckId = localStorage.getItem('selected_quiz_deck_id');
    if (!deckId) {
      message.error('No deck selected. Please select a deck first.');
      router.push('/decks/select-decks');
      return;
    }
    
    setSelectedDeckId(deckId);

    const fetchUsers = async () => {
      
      if (!currentUserId) {
        message.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }
      
      try {
        // Try to fetch from API first
        const response = await apiService.get<User[]>('/users');
        
        // Use sample data for now
        const filteredResponse = response.filter(user => user.id !== currentUserId);
        //const filteredResponse = sampleUsers.filter(user => user.id !== currentUserId);
        
        setUsers(filteredResponse);
        setFilteredUsers(filteredResponse);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        message.error('Failed to load users.');
        
        // Fallback to sample data if API call fails
        const filteredSampleUsers = sampleUsers.filter(user => user.id !== currentUserId);
        setUsers(filteredSampleUsers);
        setFilteredUsers(filteredSampleUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId, apiService, router]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.username?.toLowerCase().includes(value.toLowerCase()) ||
      user.name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setInvitationModalVisible(true);
  };

  const handleRandomUser = () => {
    if (users.length === 0) return;
    
    const onlineUsers = users.filter(user => user.status === "ONLINE");
    const availableUsers = onlineUsers.length > 0 ? onlineUsers : users;
    
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const randomUser = availableUsers[randomIndex];
    setSelectedUser(randomUser);
    setInvitationModalVisible(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedUser || !selectedDeckId || !currentUserId) {
      message.error('Missing required information');
      return;
    }
  
    setSendingInvitation(true);
    try {
      const response = await apiService.post<InvitationResponse>('/quiz/invitation', {
        fromUserId: currentUserId,
        toUserId: selectedUser.id,
        deckIds: [selectedDeckId],
        timeLimit: timeLimit
      });
      
      message.success(`Invitation sent to ${selectedUser.username}`);
      setInvitationModalVisible(false);
      
      // Check if response has an id
      if (response && response.id) {
        setCurrentInvitationId(response.id);
      } else if (response) {
        // Try to find id in common locations if the API structure is different
        const possibleId = response.id || response.invitationId;
        if (possibleId && typeof possibleId === 'string') {
          setCurrentInvitationId(possibleId);
        } else {
          console.warn("Could not find invitation ID in response:", response);
        }
      }
      
      // Mark invitation as sent and show waiting screen
      setInvitationSent(true);
      setWaitingModalVisible(true);
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      message.error('Failed to send invitation.');
    } finally {
      setSendingInvitation(false);
    }
  };

  const handleCancelWaiting = async () => {
    try {
      // Delete the invitation if it exists
      if (selectedUser && currentUserId && currentInvitationId) {
        await apiService.delete(`/quiz/invitation/delete/${currentInvitationId}`);
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    } finally {
      setWaitingModalVisible(false);
      setCurrentInvitationId(null);
      router.push('/decks');
    }
  };

  const handleCancel = () => {
    router.push('/decks');
  };

  return (
    <div style={{ backgroundColor: '#ccf0cc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Select a Player for Quiz</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card>
            <div style={{ marginBottom: '20px' }}>
              <Search
                placeholder="Search by username or name"
                prefix={<SearchOutlined />}
                style={{ width: '100%' }}
                onChange={e => handleSearch(e.target.value)}
                value={searchQuery}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Button 
                icon={<UserSwitchOutlined />} 
                onClick={handleRandomUser}
                type="primary"
                style={{
                  backgroundColor: '#285c28',
                  borderColor: '#285c28',
                }}
                disabled={users.length === 0}
              >
                Choose Random Player
              </Button>
            </div>
            
            <List
              itemLayout="horizontal"
              dataSource={filteredUsers}
              locale={{ emptyText: 'No users found' }}
              renderItem={user => (
                <List.Item
                  actions={[
                    <Button 
                      key="invite" 
                      onClick={() => handleSelectUser(user)}
                      disabled={user.status === "OFFLINE"}
                    >
                      Invite
                    </Button>,
                  ]}
                  style={{ 
                    cursor: user.status === "OFFLINE" ? 'default' : 'pointer',
                    opacity: user.status === "OFFLINE" ? 0.7 : 1
                  }}
                  onClick={() => {
                    if (user.status !== "OFFLINE") {
                      handleSelectUser(user);
                    }
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <span>
                        {user.username || 'Unknown'} 
                        {user.status === "OFFLINE" && <span style={{ color: 'gray', marginLeft: '10px' }}>(Offline)</span>}
                      </span>
                    }
                    description={user.name || 'No name provided'}
                  />
                  <div>{user.status === 'ONLINE' ? 
                    <span style={{ color: 'green' }}>Online</span> : 
                    <span style={{ color: 'gray' }}>Offline</span>}
                  </div>
                </List.Item>
              )}
            />
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
        
        {/* Invitation Confirmation Modal */}
        <Modal
          title="Send Quiz Invitation"
          open={invitationModalVisible}
          onOk={handleSendInvitation}
          onCancel={() => setInvitationModalVisible(false)}
          okText="Send Invitation"
          confirmLoading={sendingInvitation}
          okButtonProps={{ 
            style: { backgroundColor: '#285c28', borderColor: '#285c28' }
          }}
        >
          <p>Send a quiz invitation to {selectedUser?.username}?</p>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Time limit per question (seconds):
            </label>
            <Input
              type="number"
              value={timeLimit}
              onChange={e => setTimeLimit(Number(e.target.value))}
              min={10}
              max={120}
            />
          </div>
        </Modal>
        
        {/* Waiting for Response Modal */}
        <Modal
          title="Waiting for Response"
          open={waitingModalVisible}
          footer={[
            <Button key="cancel" onClick={handleCancelWaiting}>
              Cancel Invitation
            </Button>
          ]}
          closable={false}
          centered
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <p style={{ marginTop: '15px' }}>
              Waiting for {selectedUser?.username} to accept your invitation...
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UserInvitationPage;