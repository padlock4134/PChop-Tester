import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import chefFreddiePng from '../images/logo.png';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { askChefFreddie } from '../api/chefFreddie';
import { useSupabase } from '../../culinary/components/SupabaseProvider';

interface Message {
  sender: 'freddie' | 'user';
  text: string;
}

const getProactiveMessage = (page: string, t: any) => {
  switch (page) {
    case 'MyGarage':
      return "Welcome to My Garage — I can help you look up repair procedures, check part numbers, and plan your workflow.";
    case 'MyManual':
      return "Welcome to My Manual — need help documenting a repair order or reviewing a service record?";
    case 'GearheadLounge':
      return "Welcome to the Gearhead Lounge — want tips on finding local parts suppliers or connecting with fellow techs?";
    case 'AutoSchool':
      return "Welcome to Auto School — I can help you prep for ASE exams or find diagnostic technique videos.";
    default:
      return "Hey! I'm Gus the Mechanic, your AI automotive assistant. Ask me anything about diagnostics, repair procedures, or OBD codes.";
  }
};


const GarageFreddieWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { context } = useFreddieContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastPage, setLastPage] = useState<string | undefined>();
  const [input, setInput] = useState('');

  const { user } = useSupabase();

  const sendUserMessage = async (text: string) => {
    setMessages(msgs => [...msgs, { sender: 'user', text }]);
    setInput('');
    try {
      const reply = await askChefFreddie(user?.id!, text);
      setMessages(msgs => [...msgs, { sender: 'freddie', text: reply }]);
    } catch (err: any) {
      setMessages(msgs => [...msgs, { sender: 'freddie', text: err.message || t('garageFreddie.errorContacting') }]);
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
    }
    // eslint-disable-next-line
  }, [open, context.page]);

  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-maineBlue text-seafoam rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50 hover:bg-seafoam hover:text-maineBlue transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Open Garage Freddie AI Assistant"
      >
        <img
          src={chefFreddiePng}
          alt="Garage Freddie"
          className="w-12 h-12 rounded-full object-cover border-2 border-seafoam bg-white"
        />
      </button>

      {open && (
        <React.Fragment>
          <div className="fixed bottom-24 right-6 bg-white border-4 border-maineBlue rounded shadow-lg p-4 w-80 z-50 flex flex-col max-h-[60vh]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-maineBlue">Gus the Mechanic</span>
              <button onClick={() => {
                setOpen(false);
                setMessages([]);
              }} className="text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-2">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.sender === 'freddie' ? 'text-maineBlue' : 'text-right text-gray-700'}`}>
                  <span className="block bg-sand rounded p-2 inline-block max-w-[90%]">{msg.text}</span>
                </div>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  sendUserMessage(input.trim());
                }
              }}
            />
          </div>
        </React.Fragment>
      )}
    </>
  );
};

export default GarageFreddieWidget;

