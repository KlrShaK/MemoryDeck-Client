export interface Invitation {
  id: string;
  fromUserId: string;
  toUserId: string;
  deckIds: string[];
  timeLimit: number;
  isAccepted: boolean;
  isAcceptedDate?: string;
  quizId?: string;
  
  // Frontend-only properties for display purposes
  senderName?: string;
  deckTitle?: string;
}