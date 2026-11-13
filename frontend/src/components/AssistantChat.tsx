import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { assistantApi, type AssistantMessage } from '../api/assistant';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const AssistantChat: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Recuperar o inicializar conversación si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    const savedId = localStorage.getItem('assistant_conversation_id');
    if (savedId) {
      setConversationId(savedId);
      assistantApi
        .getConversation(savedId)
        .then((conv) => {
          if (conv.messages && conv.messages.length > 0) {
            setMessages(conv.messages);
          }
        })
        .catch(() => {
          // Si el ID guardado no existe en BD, lo descartamos
          localStorage.removeItem('assistant_conversation_id');
          setConversationId(null);
        });
    }
  }, [isAuthenticated]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    setError(null);
    setInputMessage('');

    // Mensaje optimista del usuario
    const userMsg: AssistantMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let currentConvId = conversationId;

      // Crear conversación si no existe
      if (!currentConvId) {
        const newConv = await assistantApi.createConversation();
        currentConvId = newConv.id;
        setConversationId(currentConvId);
        localStorage.setItem('assistant_conversation_id', currentConvId);
      }

      // Enviar mensaje al asistente
      const response = await assistantApi.sendMessage(currentConvId, text);

      const botMsg: AssistantMessage = {
        role: 'assistant',
        content: response.content || 'No pude obtener una respuesta en este momento.',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al contactar al asistente. Por favor, intenta de nuevo.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante para abrir/cerrar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Abrir Asistente Virtual"
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-[#C7AA78] text-[#141518] font-bold shadow-xl shadow-[#C7AA78]/25 hover:bg-[#d6bc8f] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#141518] text-[#C7AA78] flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-sm tracking-wide">Asistente</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C7AA78] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#141518]"></span>
          </span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] flex flex-col bg-[#18191c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Cabecera */}
          <div className="px-5 py-3.5 bg-[#202227] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C7AA78] flex items-center justify-center text-[#141518] shadow-md shadow-[#C7AA78]/20">
                <Bot className="w-5 h-5 text-[#141518]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F2F0EB]">EventCore Assistant</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  En línea
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#777777] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isAuthenticated ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#222429] flex items-center justify-center text-[#C7AA78]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#F2F0EB]">Inicia sesión para chatear</h4>
                <p className="text-xs text-[#777777] max-w-[240px]">
                  Para poder consultar la cartelera, horarios y butacas en tiempo real, necesitas iniciar sesión.
                </p>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#C7AA78] text-[#141518] text-xs font-bold hover:bg-[#d6bc8f] transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#222429] flex items-center justify-center text-[#C7AA78]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#F2F0EB]">¡Hola! ¿En qué puedo ayudarte?</p>
                    <p className="text-xs text-[#777777] max-w-[260px] mx-auto">
                      Pregúntame sobre películas en cartelera, horarios de funciones, salas o disponibilidad de asientos.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-[#222429] border border-white/5 flex items-center justify-center text-[#C7AA78] shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-line shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[#C7AA78] text-[#141518] font-medium rounded-tr-none'
                          : 'bg-[#222429] border border-white/10 text-[#F2F0EB] rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-[#C7AA78]/20 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78] shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loader de pensamiento */}
                {isLoading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[#222429] border border-white/5 flex items-center justify-center text-[#C7AA78] shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#222429] border border-white/10 text-[#777777] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C7AA78]" />
                      <span>Respondiendo...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Formulario de entrada */}
          {isAuthenticated && (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#202227] border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1 bg-[#141518] text-[#F2F0EB] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:outline-none focus:border-[#C7AA78] transition-colors placeholder:text-[#777777] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-[#C7AA78] text-[#141518] hover:bg-[#d6bc8f] disabled:opacity-50 disabled:hover:bg-[#C7AA78] transition-colors cursor-pointer shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
