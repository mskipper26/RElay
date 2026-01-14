import { useEffect, useState } from 'react';
import { Mailbox } from './features/mailbox/Mailbox';
import { InviteScreen } from './features/auth/InviteScreen';
import Parse from 'parse';

function App() {
  const [currentUser, setCurrentUser] = useState(Parse.User.current());

  // Listen for login/logout changes
  useEffect(() => {
    const user = Parse.User.current();
    if (user) setCurrentUser(user);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] font-mono">
      {currentUser === null ? (
        <InviteScreen onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <main className="max-w-2xl mx-auto p-8">
          <header className="mb-12 border-b border-[#1A1A1A] pb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tighter text-[#002FA7]">RE:lay</h1>
            <div className="text-xs uppercase tracking-widest">
              ID: {currentUser.get('username')}
            </div>
          </header>

          <Mailbox />
        </main>
      )}
    </div>
  );
}

export default App;