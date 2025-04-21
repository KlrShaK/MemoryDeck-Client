export interface Invitation {
  id: string;
  fromUserId: string;
  toUserId?: string;
  deckIds?: string[];
  timeLimit: number;
  isAccepted: boolean;
  senderName?: string;
  deckTitle?: string;
}