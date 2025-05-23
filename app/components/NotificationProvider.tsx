"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useApi } from '@/hooks/useApi';
import InvitationNotification from '@/components/InvitationNotification';
import { Invitation } from '@/types/invitation';
import { User } from '@/types/user';
import { Deck } from '@/types/deck';

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  // const { value: userId } = useLocalStorage<string>("userId", "");
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter();
  const apiService = useApi();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // const parsedUserId = Number(storedUserId);
      // if (!isNaN(parsedUserId)) {
      setUserId(storedUserId);
      // }
    }
  }, []);

  useEffect(() => {
    // if (!userId || userId.trim() === "" || userId === "1") return;
    if (!userId || userId.trim() === "") return;

    const checkForInvitations = async () => {
      // if (!userId || userId.trim() === "" || userId === "1") return;
      if (!userId || userId.trim() === "") return;

      // try {
      //   const user = await apiService.get<User>(`/users/${userId}`);
      //   // .catch(() => {null});
      //   if (!user) return;
      //   if (user?.status ==="OFFLINE" || user?.status === "PLAYING") return;
      // } catch {
      //   return;
      // }
      try {
        const invitations = await apiService.get<Invitation[]>(`/quiz/invitation/receivers?toUserId=${Number(userId)}`);
        
        // Find pending invitations
        const pendingInvitation = invitations.find(inv => !inv.isAccepted);
        
        if (pendingInvitation && !invitation) {
          // Set default values first
          const enhancedInvitation = {
            ...pendingInvitation,
            senderName: "Another user",
            deckTitle: "Quiz Deck"
          };
          
          // Try to enhance with sender info, but don't fail if this doesn't work
          try {
            const sender = await apiService.get<User>(`/users/${pendingInvitation.fromUserId}`);
            if (sender && sender.username) {
              enhancedInvitation.senderName = sender.username;
            }
          } catch (error) {
            console.log("Could not fetch sender info, using default name", error);
          }
          
          // Try to enhance with deck info, but don't fail if this doesn't work
          if (pendingInvitation.deckIds?.length) {
            try {
              const deckInfo = await apiService.get<Deck>(`/decks/${pendingInvitation.deckIds[0]}`);
              if (deckInfo && deckInfo.title) {
                enhancedInvitation.deckTitle = deckInfo.title;
              }
            } catch (error) {
              console.log("Could not fetch deck info, using default title", error);
            }
          }
          
          // Set the invitation with whatever info we could gather
          setInvitation(enhancedInvitation);
        }
      } catch (error) {
        console.error("Error checking for invitations:", error);
        // Don't show error messages to user for background checks
      }
    };

    // Initial check
    checkForInvitations();
    
    // Set interval for periodic checks
    const intervalId = setInterval(checkForInvitations, 1000);

    
    // Clean up interval on unmount
    return () => clearInterval(intervalId); 
  }, [userId, apiService, invitation]);


  useEffect(() => {
    // if (!userId || userId.trim() === "" || userId === "1") return;
    if (!userId || userId.trim() === "") return;

    const checkIfInvitationCancelled = async () => {
      // if (!userId || userId.trim() === "" || userId === "1") return;
      if (!userId || userId.trim() === "") return;
      try {
        
        if (invitation?.id) {        
          // Try to enhance with sender info, but don't fail if this doesn't work
          try {
            await apiService.get<Invitation>(`/quiz/invitation/${invitation?.id}`);
          } catch (error) {
            setInvitation(null);
            console.log("Could not fetch sender info, using default name", error);
          }
        }
      } catch (error) {
        console.error("Error checking for invitations:", error);
        // Don't show error messages to user for background checks
      }
    };

    // Initial check
    checkIfInvitationCancelled();
    
    // Set interval for periodic checks
    const intervalId = setInterval(checkIfInvitationCancelled, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, apiService, invitation]);



  const handleAccept = async () => {
    if (!invitation) return;
    
    try {
      await apiService.get(`/quiz/response/confirmation?invitationId=${invitation.id}`);
      message.success("Invitation accepted!");
      
      // Navigate to quiz play page
      const quizIdForRoute = invitation.quizId;
      router.push(`/decks/quiz/play/${quizIdForRoute}`);
      
      // // Reset invitation state
      // setInvitation(null);
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
        senderName={invitation?.senderName || "Another user"}
        deckTitle={invitation?.deckTitle || "Quiz Deck"}
        timeLimit={invitation?.timeLimit || 60}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
};

export default NotificationProvider;