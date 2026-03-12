import React from 'react';
import { View, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`bg-white rounded-card border border-neutral-border shadow p-4 ${className}`}
      style={Platform.OS === 'android' ? { elevation: 2 } : undefined}
    >
      {children}
    </View>
  );
}
