import { useState } from 'react';
import { Send, Wand2, ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function DnaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [suggestions] = useState([
    'Analyze CRISPR guide RNA efficiency',
    'Design primers for PCR amplification',
    'Predict protein binding sites'
  ]);

  const sendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages([...messages, newMessage]);
    setInput('');
    
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: `Processing your request: ${content}`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Genetic Q&A</h1>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Session:</span>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">D1JB1PN3PC6EQ6FNS29KAYK3Z9</code>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => sendMessage(suggestion)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              <Wand2 className="w-4 h-4" />
              <span>{suggestion}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && input.trim() && sendMessage(input)}
            placeholder="∀x ∈ DNA ⊢ ∃y ∈ Analysis"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => input.trim() && sendMessage(input)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}