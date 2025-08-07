/**
 * Layout principal que incluye Header, Sidebar y estructura base
 * Evita duplicar código de navegación en todas las páginas
 */

"use client";

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/auth';
import { 
  Hand, 
  Menu, 
  X, 
  Home,
  Gamepad2,
  Target,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface AppLayoutProps {
  children: ReactNode;
  currentPage?: 'home' | 'practice' | 'game' | 'translate';
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  key: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, key: 'home' },
  { href: '/practice', label: 'Práctica', icon: Target, key: 'practice' },
  { href: '/game', label: 'Juego', icon: Gamepad2, key: 'game' },
  { href: '/translate', label: 'Traducir', icon: Play, key: 'translate' },
];

export function AppLayout({ children, currentPage = 'home' }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip Link para accesibilidad */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <Hand className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">ComSigns</span>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="ml-4"
          aria-label="Abrir menú de navegación principal"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Navegación desktop */}
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                currentPage === item.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'hover:text-blue-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {/* AuthButton en desktop */}
          <div className="ml-4">
            <AuthButton />
          </div>
        </nav>

        {/* AuthButton en móvil */}
        <div className="ml-auto md:hidden">
          <AuthButton />
        </div>
      </header>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={closeSidebar} />
          <aside
            id="sidebar-nav"
            className="relative w-64 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Hand className="h-6 w-6 text-blue-600" />
                <span className="ml-2 text-lg font-bold">ComSigns</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      currentPage === item.key
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={closeSidebar}
                  >
                    <IconComponent className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
