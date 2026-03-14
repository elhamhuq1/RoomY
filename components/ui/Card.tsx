import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`bg-transparent rounded-card border border-neutral-border p-4 ${className}`}
    >
      {children}
    </View>
  );
}
