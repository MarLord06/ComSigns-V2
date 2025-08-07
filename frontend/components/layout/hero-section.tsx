/**
 * Componente reutilizable para secciones hero
 * Evita duplicar código de títulos y descripciones
 */

import { ReactNode } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  background?: 'gradient' | 'solid' | 'custom';
  className?: string;
}

export function HeroSection({ 
  title, 
  subtitle, 
  children, 
  background = 'gradient',
  className = ''
}: HeroSectionProps) {
  const backgroundClasses = {
    gradient: 'bg-gradient-to-b from-blue-50 to-white',
    solid: 'bg-blue-50',
    custom: ''
  };

  return (
    <section className={`py-12 px-4 ${backgroundClasses[background]} ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl text-gray-600 mb-8">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
