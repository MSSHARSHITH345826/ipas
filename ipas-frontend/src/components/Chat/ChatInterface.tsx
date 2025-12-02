import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ChatMessage } from '../../types';
import { sendChatMessage } from '../../services/chatService';

interface ChatInterfaceProps {
  caseId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ caseId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      content: caseId 
        ? `Hello! I'm the IPAS AI assistant for case ${caseId}. I have access to all the case documents and clinical guidelines. Ask me anything about this case!`
        : 'Hello! I\'m the IPAS AI assistant. I can help you analyze prior authorization cases, explain decisions, and run simulations. How can I assist you today?',
      timestamp: new Date().toISOString(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !caseId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Call the real chat service with case-specific knowledge
      const response = await sendChatMessage(caseId, currentInput, conversationHistory);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: response.response,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: currentInput },
        { role: 'assistant', content: response.response }
      ]);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to get response. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format message content with markdown-style formatting
  const formatMessageContent = (content: string) => {
    // Split by lines to process each line
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        return <Box key={index} sx={{ height: '8px' }} />;
      }

      // Check for bold headers (**text**)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <Typography 
            key={index} 
            variant="body1" 
            sx={{ 
              mb: 0.5,
              fontWeight: line.startsWith('**') ? 'bold' : 'normal',
              fontSize: line.startsWith('**') ? '1.05rem' : '1rem'
            }}
          >
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </Typography>
        );
      }

      // Bullet points (•) or (-)
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              ml: 2, 
              mb: 0.3,
              display: 'flex',
              alignItems: 'flex-start'
            }}
          >
            <span style={{ marginRight: '8px', minWidth: '16px' }}>
              {line.trim().startsWith('•') ? '•' : '•'}
            </span>
            <span>{line.trim().substring(1).trim()}</span>
          </Typography>
        );
      }

      // Numbered lists (1., 2., etc.)
      if (/^\s*\d+\./.test(line)) {
        return (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              ml: 2, 
              mb: 0.3,
              fontWeight: 500
            }}
          >
            {line.trim()}
          </Typography>
        );
      }

      // Regular text
      return (
        <Typography key={index} variant="body2" sx={{ mb: 0.3 }}>
          {line}
        </Typography>
      );
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AIIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            IPAS AI Assistant
          </Typography>
          {caseId && (
            <Chip
              label={`Case: ${caseId}`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {!caseId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please select a case to start chatting. The AI needs case-specific context to provide accurate answers.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, maxHeight: '60vh' }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  maxWidth: '70%',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.sender === 'user' ? '#1976d2' : '#4caf50',
                    width: 32,
                    height: 32,
                    mx: 1
                  }}
                >
                  {message.sender === 'user' ? <PersonIcon /> : <AIIcon />}
                </Avatar>
                
                <Box>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
                      borderRadius: 2
                    }}
                  >
                    {message.sender === 'ai' ? (
                      <Box>{formatMessageContent(message.content)}</Box>
                    ) : (
                      <Typography variant="body1">{message.content}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: '#4caf50', width: 32, height: 32, mx: 1 }}>
                <AIIcon />
              </Avatar>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
                <LinearProgress sx={{ mt: 1 }} />
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder={caseId ? "Ask me anything about this case..." : "Select a case to start chatting..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            disabled={isTyping || !caseId}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || !caseId}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
