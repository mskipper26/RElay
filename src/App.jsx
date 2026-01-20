import { useEffect, useState } from 'react';
import { Mailbox } from './features/mailbox/Mailbox';
import { useMailbox } from './hooks/useMailbox';
import { InviteScreen } from './features/auth/InviteScreen';
import { ChatBox } from './features/chat/ChatBox';
import Parse from 'parse';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { FriendListScreen } from './features/profile/FriendListScreen';
import { AboutScreen } from './features/about/AboutScreen';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('mailbox'); // mailbox | profile | friends

  // Global Inbox Monitor for Tab Title
  const { letters: inboxLetters } = useMailbox('inbox');
  const unreadCount = inboxLetters ? inboxLetters.filter(l => !l.read && l.type !== 'request').length : 0;

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) RE:lay` : 'RE:lay';
  }, [unreadCount]);

  // Listen for login/logout changes
  useEffect(() => {
    const currentUser = Parse.User.current();
    if (currentUser) setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    await Parse.User.logOut();
    setUser(null);
    setView('mailbox');
  };

  if (!user) {
    return <InviteScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-parchment text-ink selection:bg-klein selection:text-white relative">
      <header className="p-4 flex justify-between items-center border-b border-ink sticky top-0 bg-parchment z-40">
        <div className="text-xl font-serif italic tracking-widest">RE:lay</div>
        <nav className="flex space-x-6 text-xs uppercase tracking-widest font-mono">
          <button onClick={() => setView('mailbox')} className={`${view === 'mailbox' ? 'text-klein font-bold' : 'hover:scale-105'}`}>Mailbox</button>
          <button onClick={() => setView('friends')} className={`${view === 'friends' ? 'text-klein font-bold' : 'hover:scale-105'}`}>Network</button>
          <button onClick={() => setView('profile')} className={`${view === 'profile' ? 'text-klein font-bold' : 'hover:scale-105'}`}>Identity</button>
          <button onClick={() => setView('about')} className={`${view === 'about' ? 'text-klein font-bold' : 'hover:scale-105'}`}>About</button>
          <button onClick={handleLogout} className="hover:scale-105 opacity-60 hover:opacity-100">Logout</button>
        </nav>
      </header>

      <main className="container mx-auto p-4 pt-8">
        {view === 'mailbox' && <Mailbox />}
        {view === 'friends' && <FriendListScreen onClose={() => setView('mailbox')} />}
        {view === 'profile' && <ProfileScreen onClose={() => setView('mailbox')} />}
        {view === 'about' && <AboutScreen onClose={() => setView('mailbox')} />}

        <ChatBox />
      </main>
    </div>
  );
}

export default App;