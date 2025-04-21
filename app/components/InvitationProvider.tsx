"use client";

import React from 'react';
import InvitationNotification from './InvitationNotification';
import useLocalStorage from '@/hooks/useLocalStorage';

interface InvitationProviderProps {
  children: React.ReactNode;
}

const InvitationProvider: React.FC<InvitationProviderProps> = ({ children }) => {
  const { value: token } = useLocalStorage<string>('token', '');
  
  // Only show invitation notifications if the user is logged in
  const isLoggedIn = !!token;
  
  return (
    <>
      {children}
      {isLoggedIn && <InvitationNotification />}
    </>
  );
};

export default InvitationProvider;