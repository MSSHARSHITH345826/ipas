import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, List, ListItem, Avatar, CircularProgress } from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CaseChatInterfaceProps {
  caseId: string;
}

const CaseChatInterface: React.FC<CaseChatInterfaceProps> = ({ caseId }) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: `Hi! I'm here to help with case ${caseId}. Ask me anything about the patient, medical records, or authorization details!`,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { sendChatMessage } = await import('../../services/chatService');
      const data = await sendChatMessage(caseId, inputMessage, messages);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color="primary" />
          AI Assistant - Case {caseId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Ask me anything about this case!
        </Typography>
      </Paper>

      <Paper sx={{ flex: 1, overflow: 'auto', p: 2, mb: 2, backgroundColor: '#fafafa' }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <Avatar sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main', width: 32, height: 32 }}>
                  {msg.role === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                <Box>
                  <Paper sx={{ p: 2, backgroundColor: msg.role === 'user' ? '#e3f2fd' : 'white' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
          {isLoading && <ListItem sx={{ justifyContent: 'center' }}><CircularProgress size={24} /></ListItem>}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Paper sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a question..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <IconButton color="primary" onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default CaseChatInterface;

