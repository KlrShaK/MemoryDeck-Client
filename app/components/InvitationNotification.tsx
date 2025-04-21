"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Button, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';

const { Text, Title } = Typography;

interface Invitation {
  id: string;
  fromUserId: string;
  fromUsername: string;
  deckId: string;
  deckTitle: string;
  timeLimit: number;
  quizId: string;
}

// For polling interval (in milliseconds)
const POLL_INTERVAL = 10000; // 10 seconds

const InvitationNotification: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>('user_id', '');
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [responding, setResponding] = useState(false);

  // For testing - a sample invitation
  const sampleInvitation: Invitation = {
    id: "inv123",
    fromUserId: "user456",
    fromUsername: "Jane Smith",
    deckId: "deck789",
    deckTitle: "Medical Terms",
    timeLimit: 30,
    quizId: "quiz101"
  };

  useEffect(() => {
    if (!userId) return;

    // For demo purposes, show the sample invitation after a delay
    // In a real app, this would be replaced with the API polling logic
    const timer = setTimeout(() => {
      setInvitation(sampleInvitation);
      setModalVisible(true);
    }, 5000); // Show demo invitation after 5 seconds

    return () => clearTimeout(timer);

    // The actual API polling implementation would look like this:
    /*
    const checkForInvitations = async () => {
      try {
        const pendingInvitations = await apiService.get<Invitation[]>(`/quiz/invitations?userId=${userId}`);
        if (pendingInvitations && pendingInvitations.length > 0) {
          setInvitation(pendingInvitations[0]); // Take the first pending invitation
          setModalVisible(true);
        }
      } catch (error) {
        console.error('Failed to check for invitations:', error);
      }
    };

    checkForInvitations(); // Check immediately on mount

    const pollInterval = setInterval(checkForInvitations, POLL_INTERVAL);
    
    return () => clearInterval(pollInterval);
    */
  }, [userId, apiService]);

  const handleAccept = async () => {
    if (!invitation) return;
    
    setResponding(true);
    try {
      // In a real app, this would call your API
      // await apiService.put(`/quiz/respond`, {
      //   quizId: invitation.quizId,
      //   response: "Accepted"
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Invitation accepted!');
      setModalVisible(false);
      
      // Navigate to the quiz page
      router.push(`/decks/quiz/${invitation.quizId}`);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      message.error('Failed to accept invitation. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    
    setResponding(true);
    try {
      // In a real app, this would call your API
      // await apiService.put(`/quiz/respond`, {
      //   quizId: invitation.quizId,
      //   response: "Declined"
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.info('Invitation declined');
      setModalVisible(false);
      setInvitation(null);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      message.error('Failed to decline invitation. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (!invitation) return null;

  return (
    <Modal
      title="Quiz Invitation"
      open={modalVisible}
      onCancel={handleDecline}
      footer={[
        <Button key="decline" onClick={handleDecline} loading={responding}>
          Decline
        </Button>,
        <Button 
          key="accept" 
          type="primary" 
          onClick={handleAccept} 
          loading={responding}
          style={{
            backgroundColor: '#285c28',
            borderColor: '#285c28',
          }}
        >
          Accept
        </Button>,
      ]}
      centered
      closable={false}
    >
      <div style={{ padding: '10px 0' }}>
        <Title level={4} style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
          You've been invited to a quiz!
        </Title>
        
        <div style={{ marginBottom: '15px' }}>
          <Text strong>From: </Text>
          <Text>{invitation.fromUsername}</Text>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Text strong>Deck: </Text>
          <Text>{invitation.deckTitle}</Text>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Text strong>Time Limit: </Text>
          <Text>{invitation.timeLimit} seconds per question</Text>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          borderColor: '#b7eb8f',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
          <Text>
            Join this quiz to test your knowledge and have fun competing!
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default InvitationNotification;