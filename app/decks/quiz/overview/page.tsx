// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { List, Avatar, Button, Input, Card, Spin, Modal, App } from 'antd';
// import { UserOutlined, SearchOutlined, UserSwitchOutlined, LoadingOutlined } from '@ant-design/icons';
// import { useApi } from '@/hooks/useApi';
// import { User } from '@/types/user';
// import { Invitation } from '@/types/invitation';

// const { Search } = Input;

// // Define interface for API response
// interface InvitationResponse {
//   id?: string;
//   invitationId?: string;
//   [key: string]: unknown; // Allow for other properties
// }

// const UserInvitationPage: React.FC = () => {
//   const router = useRouter();
//   const apiService = useApi();
//   // const { value: userId } = useLocalStorage<string>('userId', '');
//   const [userId, setUserId] = useState<string | null>(null)
//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [timeLimit, setTimeLimit] = useState(30); // Default time limit in seconds
//   const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
//   const [invitationModalVisible, setInvitationModalVisible] = useState(false);
//   const [sendingInvitation, setSendingInvitation] = useState(false);
//   const [waitingModalVisible, setWaitingModalVisible] = useState(false);
//   const [currentInvitationId, setCurrentInvitationId] = useState<string | null>(null);
//   const { message: antMessage } = App.useApp(); // Use the App context instead of direct message use

//   useEffect(() => {
//     const storedUserId = localStorage.getItem("userId");
//     if (storedUserId) {
//       // const parsedUserId = Number(storedUserId);
//       // if (!isNaN(parsedUserId)) {
//       setUserId(storedUserId);
//       // }
//     }
//   }, []);

//   // Effect to poll for invitation acceptance
//   useEffect(() => {
//     // Only run the polling if we have an invitation and are waiting
//     if (!currentInvitationId || !waitingModalVisible) return;
    
//     const checkInvitationStatus = async () => {
//       try {
//         // Handle userId properly by ensuring it's a string first
//         // const userIdString = String(userId);
//         // const cleanUserId = userIdString.replace(/^"|"$/g, '');
        
//         if (!userId) {
//           console.error("Invalid userId for checking invitation status");
//           return;
//         }
        
//         // Check if the current invitation has been accepted
//         const response = await apiService.get<Invitation>(`/quiz/invitation/accepted?fromUserId=${Number(userId)}`);

//         // If we get a response with an accepted invitation that matches our current invitation
//         if (Number(response.id) === Number(currentInvitationId) && response.isAccepted) {
//           // Get the quiz ID from the response
//           const quizId = response.quizId;
//           const invId = response.id;
      
//           if (quizId) {
//             // Close the waiting modal
//             setWaitingModalVisible(false);

//             // Navigate to the quiz play page
//             router.push(`/decks/quiz/play/${quizId}`);

//             if (invId){
//               apiService.delete(`/quiz/invitation/delete/${Number(invId)}`);
//             }
//           }

//         }
//       } catch (error) {
//         console.error("Error checking invitation status:", error);
//       }
//     };

//     checkInvitationStatus();

//     // Poll every 2 seconds
//     const intervalId = setInterval(checkInvitationStatus, 1000);
    
//     // Clean up interval on unmount or when waiting modal closes
//     return () => clearInterval(intervalId);
//   }, [currentInvitationId, waitingModalVisible, userId, apiService, router]);

//   useEffect(() => {
//     // if (!userId || userId.trim() === "" || userId === "1") return;
//     if (!currentInvitationId || !waitingModalVisible) return;

//     const checkIfInvitationRejected = async () => {
//       // if (!userId || userId.trim() === "" || userId === "1") return;
//       if (!userId) return;
//       try {
        
//         if (currentInvitationId) {        
//           // Try to enhance with sender info, but don't fail if this doesn't work
//           try {
//             await apiService.get<Invitation>(`/quiz/invitation/${currentInvitationId}`);
//           } catch (error) {
//             setCurrentInvitationId(null);
//             setWaitingModalVisible(false);
//             console.log("Could not fetch sender info, using default name", error);
//           }
//         }
//       } catch (error) {
//         console.error("Error checking for invitations:", error);
//         // Don't show error messages to user for background checks
//       }
//     };

//     // Initial check
//     checkIfInvitationRejected();
    
//     // Set interval for periodic checks
//     const intervalId = setInterval(checkIfInvitationRejected, 2000);
    
//     // Clean up interval on unmount
//     return () => clearInterval(intervalId);
//   }, [userId, apiService, currentInvitationId, waitingModalVisible]);

//   useEffect(() => {
//     if (!userId) return;

//     const fetchUsers = async () => {
//       // Convert userId to string first if it's not already
//       const userIdString = String(userId);
//       // Then clean it by removing quotes
//       const cleanUserId = userIdString.replace(/^"|"$/g, '');
      
//       if (!cleanUserId) {
//         antMessage.error("You must be logged in to access this page");
//         router.push("/login");
//         return;
//       }
      
//       // Retrieve the selected deck ID from localStorage
//       const deckId = localStorage.getItem('selected_quiz_deck_id');
//       if (!deckId) {
//         antMessage.error('No deck selected. Please select a deck first.');
//         router.push('/decks/quiz/select-decks');
//         return;
//       }
      
//       setSelectedDeckId(deckId);
      
//       try {
//         // Try to fetch from API
//         const response = await apiService.get<User[]>('/users');
        
//         // Filter out the current user - convert ids to strings for comparison
//         const filteredResponse = response.filter(user => 
//           String(user.id) !== cleanUserId
//         );
        
//         setUsers(filteredResponse);
//         setFilteredUsers(filteredResponse);
//       } catch (error) {
//         console.error('Failed to fetch users:', error);
//         antMessage.error('Failed to load users.');
        
//         // No fallback users - just set empty array
//         setUsers([]);
//         setFilteredUsers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [userId, apiService, router, antMessage]);

//   const handleSearch = (value: string) => {
//     setSearchQuery(value);
//     if (!value.trim()) {
//       setFilteredUsers(users);
//       return;
//     }

//     const filtered = users.filter(user => 
//       user.username?.toLowerCase().includes(value.toLowerCase()) ||
//       user.name?.toLowerCase().includes(value.toLowerCase())
//     );
//     setFilteredUsers(filtered);
//   };

//   const handleSelectUser = (user: User) => {
//     setSelectedUser(user);
//     setInvitationModalVisible(true);
//   };

//   const handleRandomUser = () => {
//     if (users.length === 0) return;
    
//     const onlineUsers = users.filter(user => user.status === "ONLINE");
//     const availableUsers = onlineUsers.length > 0 ? onlineUsers : users;
    
//     const randomIndex = Math.floor(Math.random() * availableUsers.length);
//     const randomUser = availableUsers[randomIndex];
//     setSelectedUser(randomUser);
//     setInvitationModalVisible(true);
//   };

//   const handleSendInvitation = async () => {
//     if (!selectedUser || !selectedDeckId) {
//       antMessage.error('Missing required information');
//       return;
//     }
    
//     setSendingInvitation(true);
//     try {
//       // Clean userId - remove any quotes if it's a string
//       // const cleanUserId = typeof userId === 'string' 
//       //   ? userId.replace(/^"|"$/g, '')
//       //   : userId;
      
//       // // For selectedUser.id, first convert to string if it's a number
//       // const selectedUserId = String(selectedUser.id);
//       // const cleanSelectedUserId = selectedUserId.replace(/^"|"$/g, '');
      
//       if (!userId || !selectedUser.id) {
//         antMessage.error('Invalid user information');
//         setSendingInvitation(false);
//         return;
//       }

//       const selectedDeckIds: string[] = [selectedDeckId];
      
//       // Make sure to convert types to match what backend expects
//       const invitationData = {
//         fromUserId: Number(userId),
//         toUserId: Number(selectedUser.id),
//         deckIds: selectedDeckIds,
//         timeLimit: timeLimit
//       };
      
//       console.log('Sending invitation data:', invitationData);
      
//       const response = await apiService.post<InvitationResponse>('/quiz/invitation', invitationData);
      
//       antMessage.success(`Invitation sent to ${selectedUser.username}`);
//       setInvitationModalVisible(false);
      
//       // Check if response has an id
//       // if (response && response.id) {
//       //   setCurrentInvitationId(String(response.id));
//       // } 
//       if (response && response.invitationId) {
//         setCurrentInvitationId(String(response.invitationId));
//         console.warn("Current invitation ID in response:", response.invitationId);
//       } 
//       // else if (response && response.quizId) {
//       //   setCurrentInvitationId(String(response.quizId));
//       // } 
//       else {
//         console.warn("Could not find invitation ID in response:", response);
//       }
      
//       // Mark invitation as sent and show waiting screen
//       setWaitingModalVisible(true);
      
//     } catch (error) {
//       console.error('Failed to send invitation:', error);
//       antMessage.error('Failed to send invitation. Please try again.');
//     } finally {
//       setSendingInvitation(false);
//     }
//   };

//   const handleCancelWaiting = async () => {
//     try {
//       // Delete the invitation if it exists
//       if (currentInvitationId) {
//         await apiService.delete(`/quiz/invitation/senders/cancel?invitationId=${Number(currentInvitationId)}`);
//       }
//     } catch (error) {
//       console.error('Error canceling invitation:', error);
//     } finally {
//       setWaitingModalVisible(false);
//       setCurrentInvitationId(null);
//       router.push('/decks');
//     }
//   };

//   const handleCancel = () => {
//     router.push('/decks');
//   };

//   return (
//     <App> {/* Wrap with App component for message context */}
//       <div style={{ backgroundColor: '#c3fad4', minHeight: '100vh', padding: '20px' }}>
//         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//           <h2 style={{ marginBottom: '20px', color: '#333' }}>Select a Player for Quiz</h2>
          
//           {loading ? (
//             <div style={{ textAlign: 'center', padding: '40px' }}>
//               <Spin size="large" />
//             </div>
//           ) : (
//             <Card>
//               <div style={{ marginBottom: '20px' }}>
//                 <Search
//                   placeholder="Search by username or name"
//                   prefix={<SearchOutlined />}
//                   style={{ width: '100%' }}
//                   onChange={e => handleSearch(e.target.value)}
//                   value={searchQuery}
//                 />
//               </div>
              
//               <div style={{ marginBottom: '20px' }}>
//                 <Button 
//                   icon={<UserSwitchOutlined />} 
//                   onClick={handleRandomUser}
//                   type="primary"
//                   style={{
//                     backgroundColor: '#285c28',
//                     borderColor: '#285c28',
//                   }}
//                   disabled={users.length === 0}
//                 >
//                   Choose Random Player
//                 </Button>
//               </div>
              
//               <List
//                 itemLayout="horizontal"
//                 dataSource={filteredUsers}
//                 locale={{ emptyText: 'No users found' }}
//                 renderItem={user => (
//                   <List.Item
//                     actions={[
//                       <Button 
//                         key="invite" 
//                         onClick={() => handleSelectUser(user)}
//                         disabled={user.status === "OFFLINE"}
//                       >
//                         Invite
//                       </Button>,
//                     ]}
//                     style={{ 
//                       cursor: user.status === "OFFLINE" ? 'default' : 'pointer',
//                       opacity: user.status === "OFFLINE" ? 0.7 : 1
//                     }}
//                     onClick={() => {
//                       if (user.status !== "OFFLINE") {
//                         handleSelectUser(user);
//                       }
//                     }}
//                   >
//                     <List.Item.Meta
//                       avatar={<Avatar icon={<UserOutlined />} />}
//                       title={
//                         <span>
//                           {user.username || 'Unknown'} 
//                           {user.status === "OFFLINE" && <span style={{ color: 'gray', marginLeft: '10px' }}>(Offline)</span>}
//                         </span>
//                       }
//                       description={user.name || 'No name provided'}
//                     />
//                     <div>{user.status === 'PLAYING' ? 
//                       <span style={{ color: 'red' }}>Playing</span> : 
//                       user.status === 'ONLINE' ?
//                       <span style={{ color: 'green' }}>Online</span> :
//                       <span style={{ color: 'gray' }}>Offline</span>}
//                     </div>
//                   </List.Item>
//                 )}
//               />
              
//               <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
//                 <Button onClick={handleCancel}>
//                   Cancel
//                 </Button>
//               </div>
//             </Card>
//           )}
          
//           {/* Invitation Confirmation Modal */}
//           <Modal
//             title="Send Quiz Invitation"
//             open={invitationModalVisible}
//             onOk={handleSendInvitation}
//             onCancel={() => setInvitationModalVisible(false)}
//             okText="Send Invitation"
//             confirmLoading={sendingInvitation}
//             okButtonProps={{ 
//               style: { backgroundColor: '#285c28', borderColor: '#285c28' }
//             }}
//           >
//             <p style={{ color: "black" }}>Send a quiz invitation to {selectedUser?.username}?</p>
//             <div style={{ marginBottom: '16px' }}>
//               <label style={{ display: 'block', marginBottom: '8px', color: "black" }}>
//                 Time limit (seconds):
//               </label>
//               <Input
//                 type="number"
//                 value={timeLimit}
//                 onChange={e => setTimeLimit(Number(e.target.value))}
//                 min={10}
//                 max={120}
//               />
//             </div>
//           </Modal>
          
//           {/* Waiting for Response Modal */}
//           <Modal
//             title={<span style={{ color: "black" }}>Waiting for Response</span>}
//             open={waitingModalVisible}
//             footer={[
//               <Button key="cancel" onClick={handleCancelWaiting}>
//                 Cancel Invitation
//               </Button>
//             ]}
//             closable={false}
//             centered
//           >
//             <div style={{ textAlign: 'center', padding: '20px 0' }}>
//               <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
//               <p style={{ marginTop: '15px' }}>
//                 Waiting for {selectedUser?.username} to accept your invitation...
//               </p>
//             </div>
//           </Modal>
//         </div>
//       </div>
//     </App>
//   );
// };

// export default UserInvitationPage;

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Spin, Modal, App, Row, Col, Typography, Space, Badge } from 'antd';
import { UserOutlined, SearchOutlined, UserSwitchOutlined, LoadingOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';
import { User } from '@/types/user';
import { Invitation } from '@/types/invitation';

const { Search } = Input;
const { Title, Text } = Typography;

// Design tokens matching your app
const TOKENS = {
  primary: '#2E8049',
  pageBg: '#aef5c4',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
  radius: 16,
  fontFamily: "'Poppins', sans-serif",
};

// Define interface for API response
interface InvitationResponse {
  id?: string;
  invitationId?: string;
  [key: string]: unknown;
}

const UserInvitationPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [invitationModalVisible, setInvitationModalVisible] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [waitingModalVisible, setWaitingModalVisible] = useState(false);
  const [currentInvitationId, setCurrentInvitationId] = useState<string | null>(null);
  const { message: antMessage } = App.useApp();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ant-message .ant-message-notice-content {
        color: #000000 !important;
        background-color: #ffffff !important;
      }
      .ant-message-success .ant-message-notice-content {
        color: #000000 !important;
        background-color: #f6ffed !important;
        border: 1px solid #b7eb8f !important;
      }
      .ant-message-error .ant-message-notice-content {
        color: #000000 !important;
        background-color: #fff2f0 !important;
        border: 1px solid #ffccc7 !important;
      }
      .ant-message-warning .ant-message-notice-content {
        color: #000000 !important;
        background-color: #fffbe6 !important;
        border: 1px solid #ffe58f !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Effect to poll for invitation acceptance
  useEffect(() => {
    if (!currentInvitationId || !waitingModalVisible) return;
    
    const checkInvitationStatus = async () => {
      try {
        if (!userId) {
          console.error("Invalid userId for checking invitation status");
          return;
        }
        
        const response = await apiService.get<Invitation>(`/quiz/invitation/accepted?fromUserId=${Number(userId)}`);

        if (Number(response.id) === Number(currentInvitationId) && response.isAccepted) {
          const quizId = response.quizId;
          const invId = response.id;
      
          if (quizId) {
            setWaitingModalVisible(false);
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
    const intervalId = setInterval(checkInvitationStatus, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentInvitationId, waitingModalVisible, userId, apiService, router]);

  useEffect(() => {
    if (!currentInvitationId || !waitingModalVisible) return;

    const checkIfInvitationRejected = async () => {
      if (!userId) return;
      try {
        if (currentInvitationId) {        
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
      }
    };

    checkIfInvitationRejected();
    const intervalId = setInterval(checkIfInvitationRejected, 2000);
    
    return () => clearInterval(intervalId);
  }, [userId, apiService, currentInvitationId, waitingModalVisible]);

  useEffect(() => {
    if (!userId) return;

    const fetchUsers = async () => {
      const userIdString = String(userId);
      const cleanUserId = userIdString.replace(/^"|"$/g, '');
      
      if (!cleanUserId) {
        antMessage.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }
      
      const deckId = localStorage.getItem('selected_quiz_deck_id');
      if (!deckId) {
        antMessage.error('No deck selected. Please select a deck first.');
        router.push('/decks/quiz/select-decks');
        return;
      }
      
      setSelectedDeckId(deckId);
      
      try {
        const response = await apiService.get<User[]>('/users');
        
        const filteredResponse = response.filter(user => 
          String(user.id) !== cleanUserId
        );
        
        setUsers(filteredResponse);
        setFilteredUsers(filteredResponse);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        antMessage.error('Failed to load users.');
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
      if (!userId || !selectedUser.id) {
        antMessage.error('Invalid user information');
        setSendingInvitation(false);
        return;
      }

      const selectedDeckIds: string[] = [selectedDeckId];
      
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
      
      if (response && response.invitationId) {
        setCurrentInvitationId(String(response.invitationId));
        console.warn("Current invitation ID in response:", response.invitationId);
      } else {
        console.warn("Could not find invitation ID in response:", response);
      }
      
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

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'ONLINE': return '#52c41a';
      case 'PLAYING': return '#fa8c16';
      case 'OFFLINE': return '#8c8c8c';
      default: return '#8c8c8c';
    }
  };

  const getStatusText = (status?: string | null) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'PLAYING': return 'Playing';
      case 'OFFLINE': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <App>
      <div 
        style={{ 
          background: TOKENS.pageBg, 
          minHeight: '100vh', 
          padding: '40px 20px',
          fontFamily: TOKENS.fontFamily,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <Title level={2} style={{ color: '#215F46', marginBottom: 8 }}>
              <UsergroupAddOutlined style={{ marginRight: 12 }} />
              Select a Player for Quiz
            </Title>
            <Text style={{ fontSize: 16, color: '#555' }}>
              Choose an opponent to challenge to a quiz battle!
            </Text>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16, fontSize: 16, color: '#555' }}>
                Loading players...
              </Text>
            </div>
          ) : (
            <Card
              style={{
                background: TOKENS.contentBg,
                borderRadius: TOKENS.radius,
                border: 'none',
                boxShadow: TOKENS.shadow,
              }}
              bodyStyle={{ padding: 32 }}
            >
              {/* Search and Random Button */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} md={16}>
                  <Search
                    placeholder="Search by username or name..."
                    prefix={<SearchOutlined style={{ color: '#999' }} />}
                    size="large"
                    style={{ 
                      width: '100%',
                    }}
                    styles={{
                      input: {
                        backgroundColor: '#ffffff',
                        color: '#000000',
                      },
                      affixWrapper: {
                        backgroundColor: '#ffffff',
                        border: '1px solid #d9d9d9',
                      }
                    }}
                    onChange={e => handleSearch(e.target.value)}
                    value={searchQuery}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Button 
                    icon={<UserSwitchOutlined />} 
                    onClick={handleRandomUser}
                    type="primary"
                    size="large"
                    block
                    style={{
                      backgroundColor: TOKENS.primary,
                      borderColor: TOKENS.primary,
                      fontWeight: 600,
                    }}
                    disabled={users.length === 0}
                  >
                    Random Player
                  </Button>
                </Col>
              </Row>

              {/* Users Grid */}
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#999', margin: 0 }}>
                    {searchQuery ? 'No users found' : 'No players available'}
                  </Title>
                  <Text style={{ color: '#999' }}>
                    {searchQuery ? 'Try a different search term' : 'Check back later for more players'}
                  </Text>
                </div>
              ) : (
                <Row gutter={[20, 20]}>
                  {filteredUsers.map(user => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={user.id}>
                      <Card
                        hoverable={user.status !== "OFFLINE"}
                        onClick={() => {
                          if (user.status !== "OFFLINE") {
                            handleSelectUser(user);
                          }
                        }}
                        style={{
                          height: 140,
                          borderRadius: 12,
                          background: TOKENS.cardBg,
                          border: user.status === "OFFLINE" ? '1px solid #f0f0f0' : '1px solid #e8e8e8',
                          opacity: user.status === "OFFLINE" ? 0.6 : 1,
                          cursor: user.status === "OFFLINE" ? 'default' : 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        bodyStyle={{ 
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                        }}
                      >
                        <div>
                          <Space size={12} style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#f0f8ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #e8f4fd',
                              }}
                            >
                              <UserOutlined style={{ fontSize: 18, color: TOKENS.primary }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ fontSize: 14, color: '#333', display: 'block' }}>
                                {user.username || 'Unknown'}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#999' }}>
                                {user.name || 'No name provided'}
                              </Text>
                            </div>
                          </Space>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge
                            color={getStatusColor(user.status)}
                            text={
                              <Text style={{ fontSize: 12, color: getStatusColor(user.status), fontWeight: 500 }}>
                                {getStatusText(user.status)}
                              </Text>
                            }
                          />
                          
                          <Button
                            size="small"
                            type={user.status === "ONLINE" ? "primary" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(user);
                            }}
                            disabled={user.status === "OFFLINE"}
                            style={{
                              backgroundColor: user.status === "ONLINE" ? TOKENS.primary : undefined,
                              borderColor: user.status === "ONLINE" ? TOKENS.primary : undefined,
                              fontSize: 12,
                              height: 28,
                              paddingLeft: 12,
                              paddingRight: 12,
                            }}
                          >
                            Invite
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
              
              {/* Cancel Button */}
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <Button 
                  onClick={handleCancel}
                  size="large"
                  style={{ minWidth: 120 }}
                >
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
              style: { backgroundColor: TOKENS.primary, borderColor: TOKENS.primary }
            }}
            styles={{
              mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
              content: { backgroundColor: '#ffffff' },
              header: { backgroundColor: '#ffffff' },
              body: { backgroundColor: '#ffffff' },
            }}
          >
            <div style={{ padding: '16px 0' }}>
              <Text style={{ color: "#000000", fontSize: 16 }}>
                Send a quiz invitation to <strong>{selectedUser?.username}</strong>?
              </Text>
              <div style={{ marginTop: 24 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: "#000000", fontWeight: 500 }}>
                  Total quiz time limit (seconds):
                </Text>
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  min={10}
                  max={120}
                  size="large"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #d9d9d9',
                  }}
                />
                <Text style={{ display: 'block', marginTop: 8, color: "#666666", fontSize: 12 }}>
                  Total time limit for the entire quiz (10-120 seconds)
                </Text>
              </div>
            </div>
          </Modal>
          
          {/* Waiting for Response Modal */}
          <Modal
            title={<span style={{ color: "black" }}>Waiting for Response</span>}
            open={waitingModalVisible}
            footer={[
              <Button key="cancel" onClick={handleCancelWaiting} size="large">
                Cancel Invitation
              </Button>
            ]}
            closable={false}
            centered
          >
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              <Title level={4} style={{ marginTop: 24, color: '#333' }}>
                Waiting for {selectedUser?.username}
              </Title>
              <Text style={{ color: '#666', fontSize: 16 }}>
                Your invitation has been sent. Waiting for them to accept...
              </Text>
            </div>
          </Modal>
        </div>
      </div>
    </App>
  );
};

export default UserInvitationPage;