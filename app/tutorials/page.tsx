"use client";

import React, { useState } from "react";
import { Typography, Card, Collapse, Button, Tabs, Row, Col, Divider, Space, Avatar, Modal } from "antd";
import { useRouter } from "next/navigation";
import { 
  QuestionCircleOutlined, 
  PlayCircleOutlined, 
  BookOutlined, 
  HomeOutlined,
  PlusOutlined,
  ShareAltOutlined,
  RightCircleOutlined,
  GlobalOutlined,
  RobotOutlined,
  EditOutlined,
  BarChartOutlined,
  TeamOutlined,
  LogoutOutlined,
  MailOutlined,
  MessageOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const TOKENS = {
  primary: '#2E8049',
  pageBg: '#aef5c4',
  contentBg: '#d4ffdd',
  cardBg: '#ffffff',
  radius: 20,
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
};

const customTabsStyle = `
  .custom-tabs .ant-tabs-tab {
    background-color: white !important;
    border-radius: 8px 8px 0 0;
    margin-right: 4px;
    padding: 10px 16px;
    transition: background-color 0.3s ease;
  }

  .custom-tabs .ant-tabs-tab:hover {
    background-color: #f0f0f0 !important;
  }

  .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
    background-color: #2E8049 !important;
  }

  .custom-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: white !important;
  }

  .custom-tabs .ant-tabs-tab-btn {
    color: #215F46;
    font-weight: bold;
  }
`;

const TutorialsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("1");
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const faqs = [
    {
      key: "1",
      icon: <PlusOutlined />,
      question: "How do I create a new deck?",
      answer: "To create a new deck, click on the \"Create\" button in the sidebar. You will be prompted to enter a deck title, category, and optionally a description. From there, you can start adding flashcards manually or use the AI tool to auto-generate them based on a topic."
    },
    {
      key: "2",
      icon: <ShareAltOutlined />,
      question: "Can I share decks with others?",
      answer: "Yes! When creating a deck, you can mark it as public. Public decks are visible to other users who can view and use them for their own learning or quizzing purposes."
    },
    {
      key: "3",
      icon: <RightCircleOutlined />,
      question: "Why does a question remain after I select an incorrect answer?",
      answer: "The question stays on screen until you answer it correctly or the quiz time ends. This approach is inspired by neuroscience research on reinforcement learning: repeated exposure to questions you answered incorrectly helps reinforce memory and promotes deeper learning."
    },
    {
      key: "4",
      icon: <GlobalOutlined />,
      question: "Which decks can I use for multiplayer quiz mode?",
      answer: "Only public decks can be used in the multiplayer quiz mode. This ensures all players have equal access to the same content and maintains a fair competitive environment."
    },
    {
      key: "5",
      icon: <RobotOutlined />,
      question: "What is Generate with AI?",
      answer: "This feature allows you to automatically generate flashcards by entering a topic or prompt. The AI uses that input to create relevant questions and answers, which you can then edit, rearrange, or remove before saving."
    },
    {
      key: "6",
      icon: <EditOutlined />,
      question: "Can I edit or delete a deck after creating it?",
      answer: "Absolutely. From the main page, click on a deck to open it, then use the edit or delete options available on the deck toolbar. You can change the title, category, or flashcards at any time."
    },
    {
      key: "7",
      icon: <BarChartOutlined />,
      question: "Is there a way to track my progress?",
      answer: "Yes. Click the \"Performance\" button on the main page to access detailed statistics about your quiz results over time. You can view progress graphs, filter by time ranges, and analyze your strengths and weaknesses."
    },
    {
      key: "8",
      icon: <TeamOutlined />,
      question: "How do multiplayer quizzes work?",
      answer: "In the multiplayer mode, you can invite other online users to compete with you in a quiz. Once accepted, both players are shown the same flashcards with a countdown timer. You can see your opponents progress and scores in real-time."
    },
    {
      key: "9",
      icon: <LogoutOutlined />,
      question: "What happens if I forget to log out?",
      answer: "If you are inactive for a while, your status may automatically switch to offline. However, you can always manually log out from the profile menu. Logging out ensures your session is secure, especially on shared devices."
    }
  ];

  const tutorials = [
    {
      title: "Complete Memory Deck Tutorial",
      videoId: "KX5oOoW3HPo",
      description: "Learn everything you need to know about Memory Deck: creating decks, adding flashcards, using AI generation, multiplayer quizzes, and more!"
    }
  ];

  const quickTips = [
    { title: "Keyboard Shortcuts", content: "Press spacebar to flip a flashcard, or use arrow keys to navigate between cards." },
    { title: "Best Practices", content: "Regular short study sessions are more effective than long cramming sessions. Try reviewing your flashcards 10-15 minutes daily." },
    { title: "Creating Effective Flashcards", content: "Keep questions clear and concise. One fact per card is ideal for better memory retention." },
    { title: "Using Categories", content: "Organize your decks by category to make them easier to find and study related topics together." },
  ];

  const handleEmailClick = () => {
    window.location.href = "mailto:support@memorydeck.com?subject=Memory Deck Support Request";
  };

  return (
    <div style={{ background: TOKENS.pageBg, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Poppins', sans-serif" }}>
      <style>{customTabsStyle}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", background: TOKENS.contentBg, borderRadius: TOKENS.radius, padding: "40px 30px 60px", boxShadow: TOKENS.shadow }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={2} style={{ color: "#215F46", margin: 0 }}>Tutorials & FAQ</Title>
            <Text type="secondary">Learn how to use Memory Deck effectively</Text>
          </div>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => router.push("/decks")}
            style={{ backgroundColor: "#fff", borderColor: TOKENS.primary, color: TOKENS.primary }}
          >
            Back to Decks
          </Button>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          size="large"
          className="custom-tabs"
          tabBarStyle={{ backgroundColor: "transparent", borderRadius: "8px 8px 0 0", padding: "8px 8px 0" }}
        >
          <TabPane tab={<span style={{ color: activeTab === "1" ? "#fff" : "#215F46", fontWeight: "bold" }}><PlayCircleOutlined /> Video Tutorial</span>} key="1">
            <Row justify="center">
              <Col xs={24} lg={20} xl={18}>
                <Card
                    style={{
                      borderRadius: TOKENS.radius,
                      overflow: "hidden",
                      boxShadow: TOKENS.shadow,
                      backgroundColor: TOKENS.cardBg,
                      marginBottom: 24
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "56.25%", 
                        borderRadius: TOKENS.radius,
                        overflow: "hidden"
                      }}
                    >
                      <iframe
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none"
                        }}
                        src={`https://www.youtube.com/embed/${tutorials[0].videoId}`}
                        title={tutorials[0].title}
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div style={{ padding: "24px" }}>
                      <Title level={4} style={{ color: "#215F46", marginTop: 0 }}>
                        {tutorials[0].title}
                      </Title>
                      <Paragraph style={{ fontSize: 16, color: "#333" }}>
                        {tutorials[0].description}
                      </Paragraph>
                    </div>
                  </Card>

              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span style={{ color: activeTab === "2" ? "#fff" : "#215F46", fontWeight: "bold" }}><QuestionCircleOutlined /> Frequently Asked Questions</span>} key="2">
            <Card style={{ borderRadius: TOKENS.radius, boxShadow: TOKENS.shadow, backgroundColor: TOKENS.cardBg }}>
              <Collapse accordion bordered={false} expandIconPosition="end" style={{ backgroundColor: "#fff" }}>
                {faqs.map((faq) => (
                  <Panel
                    key={faq.key}
                    header={
                      <Space>
                        <Avatar icon={faq.icon} style={{ backgroundColor: TOKENS.primary, color: 'white' }} />
                        <Text strong style={{ color: '#215F46', fontSize: 16 }}>{faq.question}</Text>
                      </Space>
                    }
                    style={{ marginBottom: 16, borderRadius: TOKENS.radius, overflow: 'hidden', backgroundColor: "#fff", border: "1px solid #eee" }}
                  >
                    <Paragraph style={{ color: '#333', paddingLeft: 40 }}>{faq.answer}</Paragraph>
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </TabPane>

          <TabPane tab={<span style={{ color: activeTab === "3" ? "#fff" : "#215F46", fontWeight: "bold" }}><BookOutlined /> Quick Tips</span>} key="3">
            <Row gutter={[24, 24]}>
              {quickTips.map((tip, index) => (
                <Col xs={24} md={12} key={index}>
                  <Card style={{ height: "100%", borderRadius: TOKENS.radius, boxShadow: TOKENS.shadow, backgroundColor: TOKENS.cardBg }}>
                    <Title level={4} style={{ color: TOKENS.primary, marginTop: 0 }}>{tip.title}</Title>
                    <Divider style={{ margin: "12px 0" }} />
                    <Paragraph style={{ fontSize: 16, color: "#333" }}>{tip.content}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>

        <Card style={{ marginTop: 32, borderRadius: TOKENS.radius, boxShadow: TOKENS.shadow, backgroundColor: TOKENS.cardBg, textAlign: "center", padding: "20px" }}>
          <Title level={4} style={{ color: "#215F46" }}>Need more help?</Title>
          <Paragraph style={{ color: "#333", fontSize: 16 }}>
            If you can&apos;t find the answer to your question or need additional assistance, please contact our support team.
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            style={{ backgroundColor: TOKENS.primary, borderColor: TOKENS.primary, color: "white", fontWeight: "bold" }}
            onClick={() => setSupportModalVisible(true)}
          >
            Contact Support
          </Button>
        </Card>
      </div>

      {/* Support Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MessageOutlined style={{ color: TOKENS.primary }} />
            <span style={{ color: "#215F46" }}>Contact Support</span>
          </div>
        }
        open={supportModalVisible}
        onCancel={() => setSupportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSupportModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="email" 
            type="primary" 
            icon={<MailOutlined />}
            style={{ backgroundColor: TOKENS.primary, borderColor: TOKENS.primary }}
            onClick={handleEmailClick}
          >
            Send Email
          </Button>
        ]}
        width={500}
      >
        <div style={{ padding: "20px 0" }}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <div>
              <Title level={5} style={{ color: "#215F46", margin: 0 }}>Get Help</Title>
              <Paragraph style={{ marginTop: 8, color: "#666" }}>
                Our support team is here to help you with any questions or issues you might have.
              </Paragraph>
            </div>

            <Divider style={{ margin: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MailOutlined style={{ color: TOKENS.primary, fontSize: 18 }} />
              <div>
                <Text strong style={{ color: "#215F46" }}>Email Support</Text>
                <br />
                <Text copyable style={{ color: "#666" }}>support@memorydeck.com</Text>
              </div>
            </div>

            <div style={{ backgroundColor: "#f8f9fa", padding: 16, borderRadius: 8, border: "1px solid #e9ecef" }}>
              <Text style={{ color: "#666", fontSize: 14 }}>
                <strong>Response Time:</strong> We typically respond within 24 hours during business days.
              </Text>
            </div>

            <div>
              <Text style={{ color: "#666", fontSize: 14 }}>
                Please include details about your issue, browser information, and any error messages you&apos;ve encountered.
              </Text>
            </div>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default TutorialsPage;