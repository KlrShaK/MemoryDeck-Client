"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import InvitationNotification from '@/components/InvitationNotification';
import { Invitation } from '@/types/invitation';
import { User } from '@/types/user';
import { Deck } from '@/types/deck';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const apiService = useApi();


  useEffect(() => {
    if (!userId) return;

    const checkForInvitations = async () => {
      try {
        const invitations: Invitation[] = await apiService.get(`/quiz/invitations?userId=${userId}`);
        
        // Find the first pending invitation
        const pendingInvitation = invitations.find((inv: Invitation) => !inv.isAccepted);
        
        if (pendingInvitation && !invitation) {
          try {
            const sender: User = await apiService.get(`/users/${pendingInvitation.fromUserId}`);
            
            const deckInfo: Partial<Deck> = pendingInvitation.deckIds?.length ? 
              await apiService.get(`/decks/${pendingInvitation.deckIds[0]}`) :
              { id: "0", title: "Quiz Deck" };
            
            setInvitation({
              ...pendingInvitation,
              senderName: sender.username || "Someone",
              deckTitle: deckInfo.title || "Quiz Deck"
            });
          } catch (error) {
            console.error("Error fetching invitation details:", error);
            // Set with default values if details fail
            setInvitation({
              ...pendingInvitation,
              senderName: "Someone",
              deckTitle: "Quiz Deck"
            });
          }
        }
      } catch (error) {
        console.error("Error checking for invitations:", error);
      }
    };

    checkForInvitations();
    
    // check every 10 seconds
    const intervalId = setInterval(checkForInvitations, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, apiService, invitation]);

  const handleAccept = async () => {
    if (!invitation) return;
    
    try {
      await apiService.put(`/quiz/respond`, {
        quizId: invitation.id,
        response: "Accepted"
      });
      message.success("Invitation accepted!");
      
      router.push(`/quiz-play?quizId=${invitation.id}`);
      
      setInvitation(null);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      message.error("Failed to accept invitation");
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    
    try {
      await apiService.put(`/quiz/respond`, {
        quizId: invitation.id,
        response: "Declined"
      });
      message.info("Invitation declined");
      
      // Reset invitation state
      setInvitation(null);
    } catch (error) {
      console.error("Error declining invitation:", error);
      message.error("Failed to decline invitation");
    }
  };

  return (
    <>
      {children}
      
      <InvitationNotification
        visible={!!invitation}
        senderName={invitation?.senderName || "Someone"}
        deckTitle={invitation?.deckTitle || "Quiz Deck"}
        timeLimit={invitation?.timeLimit || 60}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
};

export default NotificationProvider;