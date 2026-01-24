import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Briefcase, Code, Users, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: ChatOption[];
  timestamp: Date;
}

interface ChatOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface UserContext {
  name?: string;
  isTech?: boolean;
  skills?: string[];
  interests?: string[];
  currentStep: 'greeting' | 'name' | 'tech_check' | 'skills' | 'help' | 'general';
}

// NLP Intent Recognition
const detectIntent = (message: string): string => {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|good morning|good evening|good afternoon)/.test(lower)) {
    return 'greeting';
  }

  // Job search intents
  if (/job|career|work|position|opening|vacancy|employ|hire|opportunity/.test(lower)) {
    return 'job_search';
  }

  // Skills related
  if (/skill|learn|know|technology|tech|programming|coding|develop/.test(lower)) {
    return 'skills';
  }

  // Resume/CV related
  if (/resume|cv|curriculum|profile|ats|application/.test(lower)) {
    return 'resume';
  }

  // LinkedIn related
  if (/linkedin|profile|network|connection/.test(lower)) {
    return 'linkedin';
  }

  // Help/Support
  if (/help|support|how|what|explain|guide|assist|can you/.test(lower)) {
    return 'help';
  }

  // About HireLoop
  if (/hireloop|product|feature|service|about|who|company/.test(lower)) {
    return 'about';
  }

  // Yes/No responses
  if (/^(yes|yeah|yep|sure|ok|okay|yup|absolutely|definitely)$/.test(lower)) {
    return 'affirmative';
  }
  if (/^(no|nope|nah|not really|don't|dont)$/.test(lower)) {
    return 'negative';
  }

  // Tech/Non-tech
  if (/tech|software|developer|engineer|programmer|coding|it\b|computer/.test(lower)) {
    return 'tech_field';
  }
  if (/non.?tech|business|marketing|sales|hr|finance|management|operations/.test(lower)) {
    return 'non_tech_field';
  }

  // Thanks
  if (/thank|thanks|thx|appreciate/.test(lower)) {
    return 'thanks';
  }

  // Bye
  if (/bye|goodbye|see you|later|exit|quit/.test(lower)) {
    return 'goodbye';
  }

  return 'unknown';
};

// Skill suggestions based on field
const TECH_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
  'AWS', 'Docker', 'Git', 'Java', 'Machine Learning', 'Data Analysis'
];

const NON_TECH_SKILLS = [
  'Project Management', 'Communication', 'Leadership', 'Excel',
  'Data Analysis', 'Marketing', 'Sales', 'Customer Service',
  'Financial Analysis', 'Strategic Planning', 'Team Management'
];

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({ currentStep: 'greeting' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "Hey there! I'm Loop, your AI career assistant at HireLoop. I'm here to help you land your dream job!",
        [
          { label: "Find Jobs", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
          { label: "Build My CV", value: "resume", icon: <Sparkles className="h-4 w-4" /> },
          { label: "Skill Suggestions", value: "skills", icon: <Code className="h-4 w-4" /> },
          { label: "About HireLoop", value: "about", icon: <HelpCircle className="h-4 w-4" /> },
        ]
      );
      setTimeout(() => {
        addBotMessage("But first, what's your name? I'd love to know who I'm chatting with!");
        setUserContext(prev => ({ ...prev, currentStep: 'name' }));
      }, 1500);
    }
  }, [isOpen]);

  const addBotMessage = (content: string, options?: ChatOption[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content,
        options,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const handleOptionClick = (option: ChatOption) => {
    addUserMessage(option.label);
    processIntent(option.value, option.label);
  };

  const processIntent = (intent: string, originalMessage: string) => {
    const { currentStep, name, isTech } = userContext;

    switch (intent) {
      case 'greeting':
        addBotMessage(`Hello${name ? ` ${name}` : ''}! Great to hear from you. How can I help you today?`, [
          { label: "Find Jobs", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
          { label: "Build My CV", value: "resume", icon: <Sparkles className="h-4 w-4" /> },
          { label: "Get Help", value: "help", icon: <HelpCircle className="h-4 w-4" /> },
        ]);
        break;

      case 'job_search':
        addBotMessage(
          `${name ? `Great choice, ${name}!` : 'Awesome!'} I can help you find jobs that match your skills perfectly. Our AI assistant analyzes your background and matches you with relevant opportunities.`,
          [
            { label: "Launch Job Assistant", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
            { label: "Tell me more", value: "about_jobs", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
        break;

      case 'launch_assistant':
        addBotMessage("Perfect! I'm redirecting you to our AI Job Assistant. It will guide you through creating your profile, building your CV, and finding matching jobs!");
        setTimeout(() => {
          navigate('/assistant');
          setIsOpen(false);
        }, 1500);
        break;

      case 'about_jobs':
        addBotMessage(
          "Our job matching works like this:\n\n1. You tell us about yourself\n2. Our AI identifies your skills & ideal roles\n3. We match you with relevant jobs\n4. You get explanations for why each job fits you!\n\nWant to try it?",
          [
            { label: "Yes, let's go!", value: "launch_assistant", icon: <ChevronRight className="h-4 w-4" /> },
            { label: "Maybe later", value: "help", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
        break;

      case 'resume':
        addBotMessage(
          `${name ? `${name}, ` : ''}Our AI CV Builder creates ATS-optimized resumes that actually get past applicant tracking systems. We analyze your experience and generate a professional CV in minutes!`,
          [
            { label: "Create My CV", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
            { label: "What's ATS?", value: "explain_ats", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
        break;

      case 'explain_ats':
        addBotMessage(
          "ATS stands for Applicant Tracking System. It's software that companies use to filter resumes before a human sees them. About 75% of resumes get rejected by ATS!\n\nOur CV builder ensures your resume has the right keywords, formatting, and structure to pass these systems.",
          [
            { label: "Build ATS-friendly CV", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
          ]
        );
        break;

      case 'skills':
        if (isTech === undefined) {
          addBotMessage(
            "I'd love to suggest some in-demand skills! First, are you in a technical field or non-technical?",
            [
              { label: "Technical (Software, IT, Engineering)", value: "tech_field", icon: <Code className="h-4 w-4" /> },
              { label: "Non-Technical (Business, Marketing, etc.)", value: "non_tech_field", icon: <Users className="h-4 w-4" /> },
            ]
          );
          setUserContext(prev => ({ ...prev, currentStep: 'tech_check' }));
        } else {
          suggestSkills(isTech);
        }
        break;

      case 'tech_field':
        setUserContext(prev => ({ ...prev, isTech: true, currentStep: 'skills' }));
        suggestSkills(true);
        break;

      case 'non_tech_field':
        setUserContext(prev => ({ ...prev, isTech: false, currentStep: 'skills' }));
        suggestSkills(false);
        break;

      case 'linkedin':
        addBotMessage(
          `${name ? `${name}, ` : ''}We can help optimize your LinkedIn profile too! Our AI rewrites your headline, about section, and experience bullets to increase recruiter visibility.`,
          [
            { label: "Optimize LinkedIn", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
          ]
        );
        break;

      case 'about':
        addBotMessage(
          "HireLoop is your AI-powered career assistant! We help job seekers go from 'I need a job' to 'Job-Ready' in minutes.\n\nWhat we offer:\n- AI Profile Analysis\n- ATS-Optimized CV Generation\n- LinkedIn Optimization\n- Smart Job Matching\n\nAll without needing to sign up!",
          [
            { label: "Try It Now", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
            { label: "How does it work?", value: "about_jobs", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
        break;

      case 'help':
        addBotMessage(
          "I'm here to help! Here's what I can assist you with:",
          [
            { label: "Find Jobs", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
            { label: "Build CV", value: "resume", icon: <Sparkles className="h-4 w-4" /> },
            { label: "Skill Suggestions", value: "skills", icon: <Code className="h-4 w-4" /> },
            { label: "About HireLoop", value: "about", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
        break;

      case 'thanks':
        addBotMessage(
          `You're welcome${name ? `, ${name}` : ''}! Is there anything else I can help you with?`,
          [
            { label: "Yes, more help", value: "help", icon: <HelpCircle className="h-4 w-4" /> },
            { label: "No, that's all", value: "goodbye", icon: <ChevronRight className="h-4 w-4" /> },
          ]
        );
        break;

      case 'goodbye':
        addBotMessage(`Goodbye${name ? `, ${name}` : ''}! Best of luck with your job search. Feel free to chat anytime you need help!`);
        break;

      case 'affirmative':
        if (currentStep === 'tech_check') {
          addBotMessage(
            "Great! Which field are you in?",
            [
              { label: "Technical", value: "tech_field", icon: <Code className="h-4 w-4" /> },
              { label: "Non-Technical", value: "non_tech_field", icon: <Users className="h-4 w-4" /> },
            ]
          );
        } else {
          processIntent('launch_assistant', originalMessage);
        }
        break;

      case 'negative':
        addBotMessage(
          "No problem! Is there something else I can help you with?",
          [
            { label: "Find Jobs", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
            { label: "Build CV", value: "resume", icon: <Sparkles className="h-4 w-4" /> },
            { label: "Just browsing", value: "goodbye", icon: <ChevronRight className="h-4 w-4" /> },
          ]
        );
        break;

      default:
        // Check if this is a name response
        if (currentStep === 'name' && originalMessage.length > 0 && originalMessage.length < 30) {
          const extractedName = originalMessage.split(' ')[0].replace(/[^a-zA-Z]/g, '');
          if (extractedName.length > 1) {
            setUserContext(prev => ({ ...prev, name: extractedName, currentStep: 'tech_check' }));
            addBotMessage(
              `Nice to meet you, ${extractedName}! To give you the best suggestions, are you looking for opportunities in tech or non-tech fields?`,
              [
                { label: "Tech (Software, IT, Data)", value: "tech_field", icon: <Code className="h-4 w-4" /> },
                { label: "Non-Tech (Business, Marketing)", value: "non_tech_field", icon: <Users className="h-4 w-4" /> },
              ]
            );
            return;
          }
        }

        // Default fallback
        addBotMessage(
          `I'm not sure I understood that. Let me help you with what I know best:`,
          [
            { label: "Find Jobs", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
            { label: "Build CV", value: "resume", icon: <Sparkles className="h-4 w-4" /> },
            { label: "Skill Suggestions", value: "skills", icon: <Code className="h-4 w-4" /> },
            { label: "About HireLoop", value: "about", icon: <HelpCircle className="h-4 w-4" /> },
          ]
        );
    }
  };

  const suggestSkills = (isTech: boolean) => {
    const skills = isTech ? TECH_SKILLS : NON_TECH_SKILLS;
    const randomSkills = skills.sort(() => Math.random() - 0.5).slice(0, 6);

    addBotMessage(
      `${userContext.name ? `${userContext.name}, h` : 'H'}ere are some in-demand ${isTech ? 'technical' : 'business'} skills for 2024-2025:\n\n${randomSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWant me to help you build a CV highlighting these skills?`,
      [
        { label: "Yes, build my CV!", value: "launch_assistant", icon: <Sparkles className="h-4 w-4" /> },
        { label: "Show more skills", value: isTech ? "tech_field" : "non_tech_field", icon: <Code className="h-4 w-4" /> },
        { label: "Find jobs for me", value: "job_search", icon: <Briefcase className="h-4 w-4" /> },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();
    addUserMessage(message);
    setInputValue('');

    const intent = detectIntent(message);
    setTimeout(() => {
      processIntent(intent, message);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 group",
          isOpen
            ? "bg-zinc-800 hover:bg-zinc-700"
            : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <>
            <Bot className="h-6 w-6 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-30" />
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] rounded-2xl shadow-2xl transition-all duration-300 transform origin-bottom-right",
          "bg-zinc-900 border border-zinc-800 overflow-hidden",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Loop - AI Assistant</h3>
              <p className="text-xs text-violet-200">Your career companion</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[380px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.type === 'user'
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                )}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>

                {/* Options */}
                {message.options && message.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(option)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/50 hover:bg-violet-600/50 text-zinc-200 hover:text-white text-xs rounded-full transition-all duration-200 border border-zinc-600 hover:border-violet-500"
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="rounded-full p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
