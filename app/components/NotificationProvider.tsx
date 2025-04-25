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
        const invitations: Invitation[] = await apiService.get(`/quiz/invitation/receivers?toUserId=${userId}`);
        
        // Find the first pending invitation
        const pendingInvitation = invitations.find((inv: Invitation) => !inv.isAccepted);
        
        if (pendingInvitation && !invitation) {
          try {
            // Get the sender's information
            const sender: User = await apiService.get(`/users/${pendingInvitation.fromUserId}`);
            
            // If there are deck IDs, get the first deck's information
            let deckInfo: Partial<Deck> = { id: "0", title: "Quiz Deck" };
            if (pendingInvitation.deckIds?.length) {
              deckInfo = await apiService.get(`/decks/${pendingInvitation.deckIds[0]}`);
            }
            
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
      await apiService.get(`/quiz/response/confirmation?invitationId=${invitation.id}`);
      message.success("Invitation accepted!");
      
      // If there's a quizId, use it for navigation, otherwise use the invitation id
      const quizIdForRoute = invitation.quizId || invitation.id;
      router.push(`/decks/quiz/play/${quizIdForRoute}`);
      
      setInvitation(null);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      message.error("Failed to accept invitation");
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    
    try {
      await apiService.delete(`/quiz/response/rejection?invitationId=${invitation.id}`);
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