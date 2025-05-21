"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, Avatar, Button, Input, Card, Spin, Modal, App } from 'antd';
import { UserOutlined, SearchOutlined, UserSwitchOutlined, LoadingOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';
import { User } from '@/types/user';
import { Invitation } from '@/types/invitation';

const { Search } = Input;

// Define interface for API response
interface InvitationResponse {
  id?: string;
  invitationId?: string;
  [key: string]: unknown; // Allow for other properties
}

const UserInvitationPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  // const { value: userId } = useLocalStorage<string>('userId', '');
  const [userId, setUserId] = useState<string | null>(null)
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
  const [currentInvitationId, setCurrentInvitationId] = useState<string | null>(null);
  const { message: antMessage } = App.useApp(); // Use the App context instead of direct message use

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // const parsedUserId = Number(storedUserId);
      // if (!isNaN(parsedUserId)) {
      setUserId(storedUserId);
      // }
    }
  }, []);

  // Effect to poll for invitation acceptance
  useEffect(() => {
    // Only run the polling if we have an invitation and are waiting
    if (!currentInvitationId || !waitingModalVisible) return;
    
    const checkInvitationStatus = async () => {
      try {
        // Handle userId properly by ensuring it's a string first
        // const userIdString = String(userId);
        // const cleanUserId = userIdString.replace(/^"|"$/g, '');
        
        if (!userId) {
          console.error("Invalid userId for checking invitation status");
          return;
        }
        
        // Check if the current invitation has been accepted
        const response = await apiService.get<Invitation>(`/quiz/invitation/accepted?fromUserId=${Number(userId)}`);

        // If we get a response with an accepted invitation that matches our current invitation
        if (Number(response.id) === Number(currentInvitationId) && response.isAccepted) {
          // Get the quiz ID from the response
          const quizId = response.quizId;
          const invId = response.id;
      
          if (quizId) {
            // Close the waiting modal
            setWaitingModalVisible(false);

            // Navigate to the quiz play page
            router.push(`/decks/quiz/play/${quizId}`);

            if (invId){
              apiService.delete(`/quiz/invitation/delete/${Number(invId)}`);
            }
          }

        }
      } catch (error) {
        console.error("Error checking invitation status:", error);
      }
    };

    checkInvitationStatus();

    // Poll every 2 seconds
    const intervalId = setInterval(checkInvitationStatus, 1000);
    
    // Clean up interval on unmount or when waiting modal closes
    return () => clearInterval(intervalId);
  }, [currentInvitationId, waitingModalVisible, userId, apiService, router]);

  useEffect(() => {
    // if (!userId || userId.trim() === "" || userId === "1") return;
    if (!currentInvitationId || !waitingModalVisible) return;

    const checkIfInvitationRejected = async () => {
      // if (!userId || userId.trim() === "" || userId === "1") return;
      if (!userId) return;
      try {
        
        if (currentInvitationId) {        
          // Try to enhance with sender info, but don't fail if this doesn't work
          try {
            await apiService.get<Invitation>(`/quiz/invitation/${currentInvitationId}`);
          } catch (error) {
            setCurrentInvitationId(null);
            setWaitingModalVisible(false);
            console.log("Could not fetch sender info, using default name", error);
          }
        }
      } catch (error) {
        console.error("Error checking for invitations:", error);
        // Don't show error messages to user for background checks
      }
    };

    // Initial check
    checkIfInvitationRejected();
    
    // Set interval for periodic checks
    const intervalId = setInterval(checkIfInvitationRejected, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, apiService, currentInvitationId, waitingModalVisible]);

  useEffect(() => {
    if (!userId) return;

    const fetchUsers = async () => {
      // Convert userId to string first if it's not already
      const userIdString = String(userId);
      // Then clean it by removing quotes
      const cleanUserId = userIdString.replace(/^"|"$/g, '');
      
      if (!cleanUserId) {
        antMessage.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }
      
      // Retrieve the selected deck ID from localStorage
      const deckId = localStorage.getItem('selected_quiz_deck_id');
      if (!deckId) {
        antMessage.error('No deck selected. Please select a deck first.');
        router.push('/decks/quiz/select-decks');
        return;
      }
      
      setSelectedDeckId(deckId);
      
      try {
        // Try to fetch from API
        const response = await apiService.get<User[]>('/users');
        
        // Filter out the current user - convert ids to strings for comparison
        const filteredResponse = response.filter(user => 
          String(user.id) !== cleanUserId
        );
        
        setUsers(filteredResponse);
        setFilteredUsers(filteredResponse);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        antMessage.error('Failed to load users.');
        
        // No fallback users - just set empty array
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, apiService, router, antMessage]);

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
    if (!selectedUser || !selectedDeckId) {
      antMessage.error('Missing required information');
      return;
    }
    
    setSendingInvitation(true);
    try {
      // Clean userId - remove any quotes if it's a string
      // const cleanUserId = typeof userId === 'string' 
      //   ? userId.replace(/^"|"$/g, '')
      //   : userId;
      
      // // For selectedUser.id, first convert to string if it's a number
      // const selectedUserId = String(selectedUser.id);
      // const cleanSelectedUserId = selectedUserId.replace(/^"|"$/g, '');
      
      if (!userId || !selectedUser.id) {
        antMessage.error('Invalid user information');
        setSendingInvitation(false);
        return;
      }

      const selectedDeckIds: string[] = [selectedDeckId];
      
      // Make sure to convert types to match what backend expects
      const invitationData = {
        fromUserId: Number(userId),
        toUserId: Number(selectedUser.id),
        deckIds: selectedDeckIds,
        timeLimit: timeLimit
      };
      
      console.log('Sending invitation data:', invitationData);
      
      const response = await apiService.post<InvitationResponse>('/quiz/invitation', invitationData);
      
      antMessage.success(`Invitation sent to ${selectedUser.username}`);
      setInvitationModalVisible(false);
      
      // Check if response has an id
      // if (response && response.id) {
      //   setCurrentInvitationId(String(response.id));
      // } 
      if (response && response.invitationId) {
        setCurrentInvitationId(String(response.invitationId));
        console.warn("Current invitation ID in response:", response.invitationId);
      } 
      // else if (response && response.quizId) {
      //   setCurrentInvitationId(String(response.quizId));
      // } 
      else {
        console.warn("Could not find invitation ID in response:", response);
      }
      
      // Mark invitation as sent and show waiting screen
      setWaitingModalVisible(true);
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      antMessage.error('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvitation(false);
    }
  };

  const handleCancelWaiting = async () => {
    try {
      // Delete the invitation if it exists
      if (currentInvitationId) {
        await apiService.delete(`/quiz/invitation/senders/cancel?invitationId=${Number(currentInvitationId)}`);
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
    <App> {/* Wrap with App component for message context */}
      <div style={{ backgroundColor: '#c3fad4', minHeight: '100vh', padding: '20px' }}>
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
                    <div>{user.status === 'PLAYING' ? 
                      <span style={{ color: 'red' }}>Playing</span> : 
                      user.status === 'ONLINE' ?
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
            <p style={{ color: "black" }}>Send a quiz invitation to {selectedUser?.username}?</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: "black" }}>
                Time limit (seconds):
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
            title={<span style={{ color: "black" }}>Waiting for Response</span>}
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
    </App>
  );
};

export default UserInvitationPage;