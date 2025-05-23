"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Row,
  Col,
  Avatar,
  Dropdown,
  Spin,
  message,
  Typography,
  Space,
  Divider,
  Badge,
  Tooltip,
} from "antd";
import { 
  EllipsisOutlined, 
  UserOutlined, 
  PlusOutlined,
  BarChartOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  BookOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import { Deck } from "@/types/deck";
import { User } from "@/types/user"; // Import the User type
import useLocalStorage from "@/hooks/useLocalStorage";

const { Title, Text } = Typography;

// Design tokens consistent with other pages
const TOKENS = {
  primary: '#2E8049',
  secondary: '#215F46',
  pageBg: '#aef5c4',
  sidebarBg: '#cffadd',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  shadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
  radius: 20,
  fontFamily: "'Poppins', sans-serif",
};

type GroupedDecks = Record<string, { 
  title: string; 
  flashcards: Flashcard[]; 
  deckCategory: string; 
  isPublic: boolean; 
  user: User; // Changed from 'any' to 'User'
}>;

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  questionImageUrl?: string;
  answerImageUrl?: string;
  deckId: number;
  deckTitle: string;
}

const DeckPage = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [decks, setDecks] = useState<GroupedDecks | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGroupedDecks = useCallback(async () => {
    if (!userId) return;

    try {
      const deckList = await apiService.get<Deck[]>(`/decks?userId=${userId}`);
      const grouped: GroupedDecks = {};
      
      for (const deck of deckList) {
        grouped[String(deck.id)] = {
          title: deck.title ?? "Untitled",
          deckCategory: deck.deckCategory,
          isPublic: deck.isPublic,
          user: deck.user,
          flashcards: [],
        };
        
        const flashcards = await apiService
          .get<Flashcard[]>(`/decks/${deck.id}/flashcards`)
          .catch((err) => {
            if (err instanceof Error && err.message.includes("404")) {
              return [];
            }
            throw err;
          });
        grouped[String(deck.id)].flashcards = flashcards;
      }
      setDecks(grouped);
    } catch (error) {
      console.log(error);
      message.error("Failed to load decks.");
      setDecks({});
    }
  }, [userId, apiService]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    (async () => {
      await fetchGroupedDecks();
    })();
  }, [userId, fetchGroupedDecks]);

  const handleDeckClick = (deckId: number) => router.push(`/decks/${deckId}/edit/flashcards`);
  const handleEditDeck = (deckId: number) => router.push(`/decks/${deckId}/edit`);
  
  const handleDeleteDeck = async (deckId: number) => {
    try {
      await apiService.delete(`/decks/${deckId}`);
      message.success(`Deck deleted successfully`);
      fetchGroupedDecks();
    } catch {
      message.error("Failed to delete deck.");
    }
  };

  const handleCreateClick = () => router.push("/decks/create");
  const handlePerformanceClick = () => router.push(`/statistics`);
  const handleQuizClick = () => router.push("/decks/quiz/select-decks");
  const handleSoloQuizClick = () => router.push("/decks/solo-quiz/select-decks");
  const handleTutorialClick = () => router.push("/tutorials");
  
  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    } else {
      console.warn("User ID not found.");
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchGroupedDecks().finally(() => setLoading(false));
  }, [userId, fetchGroupedDecks]);

  const handleLogout = async () => {
    try {
      await apiService.delete(`/users/logout/${Number(userId)}`);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      message.error("An error occurred while logging out.");
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      MOMENTS: '#ff9f43',
      SPORTS: '#10ac84',
      ANIMALS: '#ee5a24',
      PLACES: '#0984e3',
      FOODS: '#a29bfe',
      SCIENCE: '#6c5ce7',
      MATH: '#fd79a8',
      HISTORY: '#fdcb6e',
      LANGUAGE: '#e17055',
      TECHNOLOGY: '#00b894',
      OTHERS: '#636e72',
      MIXED: '#74b9ff',
    };
    return colors[category] || '#74b9ff';
  };

  return (
    <div style={{ 
      backgroundColor: TOKENS.pageBg, 
      minHeight: "100vh", 
      fontFamily: TOKENS.fontFamily 
    }}>
      {/* Header */}
      <div style={{
        background: TOKENS.contentBg,
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: TOKENS.shadow,
        position: "relative",
        zIndex: 10,
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: TOKENS.secondary, fontWeight: 700 }}>
            Memory Deck
          </Title>
          <Text style={{ color: '#555', fontSize: 16 }}>
            Your personal flashcard learning hub
          </Text>
        </div>
        
        <Tooltip title="View Profile">
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{
              backgroundColor: TOKENS.cardBg,
              color: TOKENS.primary,
              border: `2px solid ${TOKENS.primary}`,
              cursor: "pointer",
              boxShadow: TOKENS.shadow,
            }}
            onClick={handleProfileClick}
          />
        </Tooltip>
      </div>

      <div style={{ display: "flex", padding: "24px", gap: 24 }}>
        {/* Sidebar */}
        <Card
          style={{
            width: "280px",
            height: "fit-content",
            borderRadius: TOKENS.radius,
            boxShadow: TOKENS.shadow,
            border: 'none',
            background: "#edfef2",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          {/* Create Button */}
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
            style={{
              width: "100%",
              height: "56px",
              backgroundColor: TOKENS.primary,
              borderColor: TOKENS.primary,
              borderRadius: 16,
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: 24,
              boxShadow: '0 4px 12px rgba(46, 128, 73, 0.3)',
            }}
          >
            Create New Deck
          </Button>

          <Divider style={{ margin: "24px 0", borderColor: "#ccc" }} />

          {/* Navigation Buttons */}
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Button
              icon={<BarChartOutlined />}
              onClick={handlePerformanceClick}
              style={navButtonStyle}
              size="large"
            >
              Performance Analytics
            </Button>

            <Divider style={{ margin: "16px 0", borderColor: "#ccc" }} />

            <Divider style={{ margin: "16px 0", borderColor: "black" }}>
              <Text style={{ 
                color: TOKENS.secondary, 
                fontWeight: 700,
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Game Modes
              </Text>
            </Divider>

            <Button
              icon={<TeamOutlined />}
              onClick={handleQuizClick}
              style={{
                ...navButtonStyle,
                backgroundColor: TOKENS.primary,
                color: 'white',
                border: 'none',
              }}
              size="large"
            >
              Multiplayer Quiz
            </Button>

            <Button
              icon={<PlayCircleOutlined />}
              onClick={handleSoloQuizClick}
              style={{
                ...navButtonStyle,
                backgroundColor: TOKENS.primary,
                color: 'white',
                border: 'none',
              }}
              size="large"
            >
              Solo Practice
            </Button>

            <Divider style={{ margin: "16px 0", borderColor: "#ccc" }} />

            <Button
              icon={<BookOutlined />}
              onClick={handleTutorialClick}
              style={navButtonStyle}
              size="large"
            >
              Help & Tutorials
            </Button>

            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                ...navButtonStyle,
                marginTop: 16,
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
              }}
              size="large"
            >
              Logout
            </Button>
          </Space>
        </Card>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <Card
            style={{
              borderRadius: TOKENS.radius,
              boxShadow: TOKENS.shadow,
              border: 'none',
              background: "#edfef2",
              minHeight: 'calc(100vh - 140px)',
            }}
            bodyStyle={{ padding: "32px" }}
          >
            <div style={{ marginBottom: 32 }}>
              <Title level={3} style={{ margin: 0, color: TOKENS.secondary }}>
                Your Flashcard Decks
              </Title>
              <Text style={{ color: '#666', fontSize: 16 }}>
                {Object.keys(decks || {}).length} deck{Object.keys(decks || {}).length !== 1 ? 's' : ''} available
              </Text>
            </div>

            {loading ? (
              <div style={{ 
                textAlign: "center", 
                padding: "80px 0",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}>
                <Spin size="large" />
                <Text style={{ fontSize: "16px", color: "#555" }}>
                  Loading your decks...
                </Text>
              </div>
            ) : decks === null ? (
              <Card
                style={{
                  textAlign: "center",
                  padding: "60px 40px",
                  borderRadius: TOKENS.radius,
                  border: '1px solid #f0f0f0',
                  background: '#fafafa',
                }}
              >
                <Text style={{ fontSize: "16px", color: "#555" }}>
                  Failed to load decks. Please try again later.
                </Text>
              </Card>
            ) : Object.keys(decks).length > 0 ? (
              <Row gutter={[24, 24]}>
                {Object.entries(decks).map(([deckIdStr, { title, flashcards, deckCategory, isPublic, user }]) => {
                  const deckId = parseInt(deckIdStr);
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={deckId}>
                      <Card
                        hoverable
                        style={{
                          height: "220px",
                          borderRadius: TOKENS.radius,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          border: "1px solid #f0f0f0",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          background: TOKENS.cardBg,
                        }}
                        onClick={() => handleDeckClick(deckId)}
                        bodyStyle={{ 
                          padding: "20px",
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                      >
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: 12 
                          }}>
                            <Title 
                              level={4} 
                              style={{ 
                                margin: 0, 
                                color: TOKENS.secondary,
                                fontSize: 25,
                                fontWeight: 700,
                                lineHeight: '1.2',
                                maxWidth: '70%',
                              }}
                              ellipsis={{ rows: 2 }}
                            >
                              {title}
                            </Title>
                            
                            <Dropdown
                              menu={{
                                items: [
                                  { 
                                    key: "view", 
                                    icon: <EyeOutlined style={{ fontSize: 18, color: '#2E8049' }} />,
                                    label: (
                                      <Space>
                                        <EyeOutlined />
                                        <span style={{ color: 'black' }}>View Cards</span>
                                      </Space>
                                    )
                                  },
                                  { 
                                    key: "edit",
                                    icon: <EditOutlined style={{ fontSize: 18, color: '#215F46' }} />, 
                                    label: (
                                      <Space>
                                        <EditOutlined />
                                        <span style={{ color: 'black' }}>Edit Deck</span>
                                      </Space>
                                    )
                                  },
                                  { 
                                    key: "delete", 
                                    icon: <DeleteOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />,
                                    label: (
                                      <Space>
                                        <DeleteOutlined />
                                        <span style={{ color: '#ff4d4f' }}>Delete</span>
                                      </Space>
                                    )
                                  },
                                ],
                                onClick: (e) => {
                                  e.domEvent.stopPropagation();
                                  if (e.key === "view") handleDeckClick(deckId);
                                  else if (e.key === "edit") handleEditDeck(deckId);
                                  else if (e.key === "delete") handleDeleteDeck(deckId);
                                },
                              }}
                              trigger={["click"]}
                              placement="bottomRight"
                            >
                              <Button
                                type="text"
                                icon={<EllipsisOutlined style={{ fontSize: 22 }} />}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  color: '#666',
                                  padding: 4,
                                }}
                              />
                            </Dropdown>
                          </div>

                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <Badge
                                color={getCategoryColor(deckCategory)}
                                text={
                                  <Text style={{ 
                                    fontSize: 12, 
                                    color: getCategoryColor(deckCategory),
                                    fontWeight: 500,
                                  }}>
                                    {deckCategory}
                                  </Text>
                                }
                              />
                              <Badge
                                color={isPublic ? "#52c41a" : "#ff9500"}
                                text={
                                  <Text style={{ 
                                    fontSize: 12, 
                                    color: isPublic ? '#52c41a' : '#ff9500',
                                    fontWeight: 500,
                                  }}>
                                    {isPublic ? 'Public' : 'Private'}
                                  </Text>
                                }
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <UserOutlined style={{ fontSize: 12, color: '#999' }} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: '#999',
                                fontStyle: 'italic'
                              }}>
                                Created by {user?.username || 'Unknown'}
                              </Text>
                            </div>
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: 12,
                          borderTop: '1px solid #f0f0f0',
                        }}>
                          <Text style={{ 
                            fontSize: 14, 
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            📚 {flashcards.length} card{flashcards.length !== 1 ? 's' : ''}
                          </Text>
                          
                          <Text style={{ 
                            fontSize: 12, 
                            color: flashcards.length === 0 ? '#ff4d4f' : '#52c41a',
                            fontWeight: 500,
                          }}>
                            {flashcards.length === 0 ? 'Empty' : 'Ready'}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Card
                style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  borderRadius: TOKENS.radius,
                  border: '1px solid #f0f0f0',
                  background: '#fafafa',
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 24 }}>📚</div>
                <Title level={4} style={{ color: TOKENS.secondary, marginBottom: 16 }}>
                  No decks yet
                </Title>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreateClick}
                  style={{
                    backgroundColor: TOKENS.primary,
                    borderColor: TOKENS.primary,
                    borderRadius: 12,
                    height: 48,
                    paddingLeft: 24,
                    paddingRight: 24,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Create Your First Deck
                </Button>
              </Card>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const navButtonStyle: React.CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: 12,
  fontWeight: 500,
  fontSize: "14px",
  textAlign: "left",
  justifyContent: "flex-start",
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  color: "#495057",
};

export default DeckPage;