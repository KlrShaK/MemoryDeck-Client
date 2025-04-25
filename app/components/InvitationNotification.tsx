"use client";

import React from 'react';
import { Modal, Button, Typography } from 'antd';

const { Title, Text } = Typography;

interface InvitationNotificationProps {
  visible: boolean;
  senderName: string;
  deckTitle: string;
  timeLimit: number;
  onAccept: () => void;
  onDecline: () => void;
}

const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  visible,
  senderName,
  deckTitle,
  timeLimit,
  onAccept,
  onDecline
}) => {
  return (
    <Modal
      open={visible}
      title={<Title level={4} style={{ color: "black" }}>Quiz Invitation</Title>}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div style={{ padding: "10px 0", textAlign: "center" }}>
        <Text style={{ color: "black" }}>
          <strong>{senderName}</strong> has invited you to take a quiz on deck "{deckTitle}"
        </Text>
        
        <div style={{ margin: "20px 0" }}>
          <Text style={{ color: "black" }}>Time limit: {timeLimit} seconds per question</Text>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 24 }}>
          <Button 
            danger 
            onClick={onDecline}
          >
            Decline
          </Button>
          <Button 
            type="primary" 
            onClick={onAccept}
            style={{ backgroundColor: "#285c28", borderColor: "#285c28" }}
          >
            Accept
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvitationNotification;