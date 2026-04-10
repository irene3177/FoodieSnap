export interface Message {
  _id: string;
  conversationId: string;
  senderId: Participant;
  text: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  messages: Message[];
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
}

export interface ConversationResponse {
  conversationId: string;
  messages: Message[];
  participants: Participant[];
}