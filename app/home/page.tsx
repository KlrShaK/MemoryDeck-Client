"use client";

import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Avatar, Dropdown, Spin, Popover } from 'antd';
import { EllipsisOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

// Simple Flashcard type
interface Flashcard {
  id: number;
  title: string;
  content: string;
}

const FlashcardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);

  // Load all flashcards at once
  useEffect(() => {
    setTimeout(() => {
      const dummyData: Flashcard[] = Array(24).fill(null).map((_, index) => ({
        id: index + 1,
        title: `Flashcard ${index + 1}`,
        content: `Content for flashcard ${index + 1}`
      }));
      setFlashcards(dummyData);
      setLoading(false);
    }, 500);
  }, []);

  // Navigation to quiz screen when clicking a flashcard
  const handleFlashcardClick = (id: number) => {
    router.push(`/flashcards/quiz/${id}`);
  };

  // Sidebar buttons
  const handleCreateClick = () => {
    router.push('/flashcards/create');
  };

  const handlePerformanceClick = () => {
    console.log("Performance button clicked");
  };

  const handleSetReminderClick = () => {
    console.log("Set Reminder button clicked");
  };

  const handleQuizClick = () => {
    router.push('/flashcards/invite');
  };

  const handleVersusClick = () => {
    console.log("Versus Mode button clicked");
  };

  const handleTutorialClick = () => {
    console.log("Tutorial button clicked");
  };

  const handleProfileClick = () => {
    setProfilePopoverVisible(!profilePopoverVisible);
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
    // Navigate to settings page when implemented
    // router.push('/settings');
  };

  const handleLogoutClick = () => {
    console.log("Logout clicked");
    // Implement logout functionality
    // Clear token from localStorage
    router.push('/login');
  };

  const profileMenu = (
    <div style={{ 
      backgroundColor: '#f9f9f9', 
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      width: '200px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '10px'
      }}>
        <Avatar 
          size={50} 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#285c28', color: 'white' }} 
        />
      </div>
      
      <div style={{ 
        borderBottom: '1px solid rgb(0, 0, 0)', 
        marginBottom: '12px'
      }}></div>
      
      <Button 
        icon={<SettingOutlined />} 
        onClick={handleSettingsClick}
        style={{ 
          textAlign: 'left', 
          border: 'none', 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px'
        }}
      >
        Settings and Profile
      </Button>
      
      <Button 
        icon={<LogoutOutlined />} 
        onClick={handleLogoutClick}
        danger
        style={{ 
          textAlign: 'left', 
          border: 'none', 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px'
        }}
      >
        Logout
      </Button>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ccf0cc', minHeight: '100vh', padding: '0' }}>
      {/* Header with user profile */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: '16px 24px',
        backgroundColor: '#ccf0cc',
        position: 'relative'
      }}>
        <Popover
          content={profileMenu}
          trigger="click"
          open={profilePopoverVisible}
          onOpenChange={setProfilePopoverVisible}
          placement="bottomRight"
          overlayStyle={{ padding: 0 }}
        >
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            style={{ 
              backgroundColor: '#285c28', 
              color: 'white', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} 
            onClick={handleProfileClick}
          />
        </Popover>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', padding: '0 20px' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', marginRight: '20px' }}>
          <Button 
            type="primary" 
            onClick={handleCreateClick}
            style={{ 
              width: '100%', 
              marginBottom: '20px', 
              height: '48px', 
              backgroundColor: '#285c28',
              borderColor: '#285c28',
              borderRadius: '24px',
              fontWeight: 'bold'
            }}
          >
            Create
          </Button>
          
          <div style={{ borderTop: '1px solid #a8e6a8', marginBottom: '20px' }}></div>
          
          <Button 
            type="default" 
            onClick={handlePerformanceClick}
            style={{ 
              width: '100%', 
              marginBottom: '10px',
              backgroundColor: 'white',
              borderColor: 'white',
              borderRadius: '24px'
            }}
          >
            Performance
          </Button>
          
          <Button 
            type="default" 
            onClick={handleSetReminderClick}
            style={{ 
              width: '100%', 
              marginBottom: '25px',
              backgroundColor: 'white',
              borderColor: 'white',
              borderRadius: '24px'
            }}
          >
            Set Reminder
          </Button>
          
          <div style={{ borderTop: '1px solid #a8e6a8', marginBottom: '20px' }}></div>
          
          <h3 style={{ margin: '20px 0px 30px 40px', color: '#333'}}>Gamemodes</h3>
          
          <Button 
            type="primary" 
            onClick={handleQuizClick}
            style={{ 
              width: '100%', 
              marginBottom: '15px',
              backgroundColor: '#285c28',
              borderColor: '#285c28',
              borderRadius: '24px',
              fontWeight: 'normal',
              fontSize: '14px'
            }}
          >
            Start a quiz together!
          </Button>
          
          <Button 
            type="primary" 
            onClick={handleVersusClick}
            style={{ 
              width: '100%', 
              marginBottom: '15px',
              backgroundColor: '#285c28',
              borderColor: '#285c28',
              borderRadius: '24px',
              fontWeight: 'normal',
              fontSize: '14px'
            }}
          >
            Versus Mode
          </Button>
          
          <div style={{ position: 'fixed', bottom: '20px' }}>
            <Button 
              type="default" 
              onClick={handleTutorialClick}
              style={{ 
                backgroundColor: 'white',
                borderColor: 'white',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Tutorial and FAQs
            </Button>
          </div>
        </div>

        {/* Flashcard Grid with natural scrolling */}
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Your Flashcards</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {flashcards.map(flashcard => (
                <Col xs={24} sm={12} md={8} key={flashcard.id}>
                  <Card 
                    style={{ 
                      height: '150px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    styles={{ 
                      body: { 
                        padding: '12px', 
                        height: '100%' 
                      } 
                    }}
                    onClick={() => handleFlashcardClick(flashcard.id)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{flashcard.title}</div>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end'
                      }}>
                        <Dropdown 
                          menu={{ 
                            items: [
                              { key: 'edit', label: <span style={{ color: '#000' }}>Edit</span> },
                              { key: 'delete', label: <span style={{ color: '#000' }}>Delete</span> }
                            ],
                            onClick: (e) => {
                              e.domEvent.stopPropagation();
                              console.log(`Clicked ${e.key} on card ${flashcard.id}`);
                              // Add navigation here:
                              if (e.key === 'edit') {
                                router.push(`/flashcards/edit/${flashcard.id}`);
                              } else if (e.key === 'delete') {
                                console.log(`Delete flashcard ${flashcard.id}`);
                              }
                            }
                          }} 
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button 
                            type="text" 
                            icon={<EllipsisOutlined style={{ fontSize: '20px', color: '#aaa' }} />} 
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardPage;