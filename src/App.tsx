import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRoom } from './context/RoomContext';
import { Header } from './components/common/Header';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { LiveAuctionRoom } from './components/auction/LiveAuctionRoom';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const { room } = useRoom();

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      <Header />
      <main className="flex-1 bg-black">
        {room ? <LiveAuctionRoom /> : <Dashboard />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <MainAppContent />
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;
