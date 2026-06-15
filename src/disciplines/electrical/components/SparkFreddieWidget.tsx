import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from './SparkFreddieContext';
import { askChefFreddie } from '../api/chefFreddie';
import { useSupabase } from '../../../components/DisciplineSupabaseProvider';

interface Message {
  sender: 'freddie' | 'user';
  text: string;
}

const getProactiveMessage = (page: string, t: any) => {
  switch (page) {
    case 'MyPanel':
      return "Welcome to My Panel — I can help you look up wiring specs, check load calculations, and plan your circuits.";
    case 'MyCodebook':
      return "Welcome to My Codebook — need help documenting a circuit or reviewing a wiring diagram?";
    case 'WireLounge':
      return "Welcome to the Wire Lounge — want tips on finding local electrical suppliers or connecting with fellow electricians?";
    case 'ElecSchool':
      return "Welcome to Elec School — I can help you prep for journeyman exams or find NEC code videos.";
    default:
      return "Hey! I'm Sparky, your AI electrical assistant. Ask me anything about wiring, NEC compliance, or circuit design.";
  }
};

const getChips = (page: string): string[] => {
  switch (page) {
    case 'MyPanel':
      return ['Check a load calculation for me', 'Look up a wiring spec', 'How do I use My Panel?'];
    case 'MyCodebook':
      return ['Help me document a circuit', 'Review a wiring diagram with me', 'How do I use My Codebook?'];
    case 'WireLounge':
      return ['Help me find an electrical supplier', 'Connect me with other electricians', 'How do I use the Wire Lounge?'];
    case 'ElecSchool':
      return ['Help me prep for my journeyman exam', 'Explain an NEC code section', 'How do I use Elec School?'];
    default:
      return ['Help me with a wiring question', 'Explain an NEC code', 'How do I use this module?'];
  }
};


const SparkFreddieWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { context } = useFreddieContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastPage, setLastPage] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [chipsVisible, setChipsVisible] = useState(true);

  const { user } = useSupabase();

  const sendUserMessage = async (text: string) => {
    setChipsVisible(false);
    setMessages(msgs => [...msgs, { sender: 'user', text }]);
    setInput('');
    try {
      const reply = await askChefFreddie(user?.id!, text);
      setMessages(msgs => [...msgs, { sender: 'freddie', text: reply }]);
    } catch (err: any) {
      setMessages(msgs => [...msgs, { sender: 'freddie', text: err.message || t('sparkFreddie.errorContacting') }]);
    }
  };



  // Only show a proactive message if the user navigates to a new page while the chat is open
  useEffect(() => {
    if (!open) return;
    const proactive = getProactiveMessage(context.page, t);
    // Only update if page changed while chat is open (not on first open)
    if (lastPage && context.page !== lastPage) {
      setMessages(msgs => {
        // If last message was a Freddie proactive message, replace it
        if (
          msgs.length > 0 &&
          msgs[msgs.length - 1].sender === 'freddie' &&
          (msgs[msgs.length - 1].text.startsWith('You’re in') || msgs[msgs.length - 1].text.startsWith('Welcome to'))
        ) {
          return [...msgs.slice(0, -1), { sender: 'freddie', text: proactive }];
        }
        // Otherwise, append
        return [...msgs, { sender: 'freddie', text: proactive }];
      });
    }
    setLastPage(context.page);
    // eslint-disable-next-line
  }, [context.page, open]);

  // Contextual proactive prompt state
  const [showProactive, setShowProactive] = useState(false);
  const proactiveMessage = getProactiveMessage(context.page, t);

  // Show proactive when page changes and chat is closed
  useEffect(() => {
    if (!open && proactiveMessage) {
      setShowProactive(true);
    } else {
      setShowProactive(false);
    }
    // eslint-disable-next-line
  }, [context.page, open]);

  // Inject proactive message into chat when opened or page changes, but prevent duplicates
  useEffect(() => {
    if (open) {
      const proactive = getProactiveMessage(context.page, t);
      setMessages(msgs => {
        // Only add if the last message is NOT the same proactive message from Freddie
        if (
          proactive &&
          (msgs.length === 0 || msgs[msgs.length - 1].sender !== 'freddie' || msgs[msgs.length - 1].text !== proactive)
        ) {
          return [...msgs, { sender: 'freddie', text: proactive }];
        }
        return msgs;
      });
      setChipsVisible(true);
    }
    // eslint-disable-next-line
  }, [open, context.page]);

  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-maineBlue text-seafoam rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50 hover:bg-seafoam hover:text-maineBlue transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Open Sparky the Lineman AI Assistant"
      >
        <span className="text-3xl">⚡</span>
      </button>

      {open && (
        <React.Fragment>
          <div className="fixed bottom-24 right-6 bg-white border-4 border-maineBlue rounded-xl shadow-xl w-80 z-50 flex flex-col max-h-[60vh]">
            <div className="flex justify-between items-center px-4 py-3 bg-blue-50 rounded-t-xl border-b-2 border-maineBlue">
              <span className="font-retro font-bold text-maineBlue">Sparky the Lineman</span>
              <button onClick={() => {
                setOpen(false);
                setMessages([]);
              }} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'freddie' ? 'justify-start' : 'justify-end'}`}>
                  <span className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${msg.sender === 'freddie' ? 'bg-sand text-gray-800 rounded-tl-sm' : 'bg-maineBlue text-white rounded-tr-sm'}`}>{msg.text}</span>
                </div>
              ))}
              {chipsVisible && messages.length > 0 && (
                <div className="flex flex-col gap-1 pt-1">
                  {getChips(context.page).map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendUserMessage(chip)}
                      className="text-left text-xs px-3 py-2 rounded-xl border-2 border-maineBlue text-maineBlue bg-white hover:bg-blue-50 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t-2 border-gray-100 flex gap-2">
              <input
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-maineBlue focus:outline-none"
                placeholder="Type your question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && input.trim()) {
                    sendUserMessage(input.trim());
                  }
                }}
              />
              <button
                onClick={() => { if (input.trim()) sendUserMessage(input.trim()); }}
                disabled={!input.trim()}
                className="bg-maineBlue text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-40"
              >➤</button>
            </div>
          </div>
        </React.Fragment>
      )}
    </>
  );
};

export default SparkFreddieWidget;

