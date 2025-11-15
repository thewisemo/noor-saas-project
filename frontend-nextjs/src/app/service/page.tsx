'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type ConversationMessage = {
  id: string;
  from: 'customer' | 'agent' | 'bot';
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  tenant_id: string;
  status: string;
  customer_id: string;
  assigned_agent_id?: string | null;
  customer?: {
    name: string;
    phone: string;
  };
  messages: ConversationMessage[];
  updated_at: string;
};

const SOCKET_EVENTS = {
  CONVERSATION_UPDATE: 'conversation_update',
};

export default function ServiceDashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const socketBase = useMemo(() => apiUrl.replace(/\/api$/, ''), [apiUrl]);
  const [token, setToken] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const selectedConversation = conversations.find(c => c.id === selectedId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!token || !apiUrl) return;
    setIsLoading(true);
    const res = await fetch(`${apiUrl}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data);
    if (!selectedId && data.length) {
      setSelectedId(data[0].id);
    }
  }, [apiUrl, selectedId, token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!token || !socketBase) return;
    let socket: Socket | undefined;
    socket = io(`${socketBase}/service`, {
      transports: ['websocket'],
      auth: { token },
    });
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATE, payload => {
      setConversations(prev =>
        prev.map(conv => (conv.id === payload.conversationId ? { ...conv, status: payload.status } : conv)),
      );
    });
    return () => {
      socket?.disconnect();
    };
  }, [socketBase, token]);

  const takeover = useCallback(
    async (conversationId: string) => {
      if (!apiUrl || !token) return;
      const res = await fetch(`${apiUrl}/conversations/takeover/${conversationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setConversations(prev => prev.map(conv => (conv.id === updated.id ? updated : conv)));
      }
    },
    [apiUrl, token],
  );

  const resolve = useCallback(
    async (conversationId: string) => {
      if (!apiUrl || !token) return;
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setConversations(prev => prev.map(conv => (conv.id === updated.id ? updated : conv)));
      }
    },
    [apiUrl, token],
  );

  const filteredConversations = useMemo(() => {
    if (!filter.trim()) return conversations;
    return conversations.filter(conv => conv.customer?.name?.includes(filter) || conv.customer?.phone?.includes(filter));
  }, [conversations, filter]);

  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">المحادثات ({conversations.length})</h2>
          <button onClick={fetchConversations} className="text-sm text-accent">
            تحديث
          </button>
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="بحث باسم العميل أو الهاتف"
          className="w-full rounded bg-gray-900 p-2 text-sm"
        />
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {isLoading && <p className="text-sm text-gray-400">جارٍ التحميل…</p>}
          {!isLoading &&
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full rounded border p-3 text-right text-sm ${
                  conv.id === selectedId ? 'border-accent' : 'border-gray-800'
                }`}
              >
                <p className="font-semibold">{conv.customer?.name || 'عميل واتساب'}</p>
                <p className="text-gray-400">{conv.customer?.phone}</p>
                <span className="text-xs text-gray-500">{conv.status}</span>
              </button>
            ))}
          {!isLoading && !filteredConversations.length && <p className="text-sm text-gray-500">لا توجد محادثات.</p>}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">نافذة الدردشة</h2>
        {selectedConversation ? (
          <>
            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded bg-gray-900 p-3">
              {selectedConversation.messages?.map(msg => (
                <div
                  key={msg.id}
                  className={`rounded p-3 text-sm ${
                    msg.from === 'customer' ? 'bg-gray-800 text-white' : 'bg-accent text-white'
                  }`}
                >
                  <p className="font-semibold text-xs opacity-80">
                    {msg.from === 'customer' ? 'العميل' : msg.from === 'agent' ? 'الموظف' : 'المساعد الآلي'}
                  </p>
                  <p>{msg.content}</p>
                  <p className="mt-1 text-[11px] opacity-70">{new Date(msg.created_at).toLocaleString('ar-SA')}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded bg-amber-500 py-2 text-sm" onClick={() => takeover(selectedConversation.id)}>
                تدخل الوكيل
              </button>
              <button className="flex-1 rounded bg-emerald-600 py-2 text-sm" onClick={() => resolve(selectedConversation.id)}>
                إنهاء المحادثة
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">اختر محادثة من القائمة.</p>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">بروفايل العميل</h2>
        {selectedConversation ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">الاسم</p>
              <p>{selectedConversation.customer?.name || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-gray-400">الهاتف</p>
              <p>{selectedConversation.customer?.phone || '---'}</p>
            </div>
            <div>
              <p className="text-gray-400">حالة المحادثة</p>
              <p>{selectedConversation.status}</p>
            </div>
            <div>
              <p className="text-gray-400">الموظف المكلف</p>
              <p>{selectedConversation.assigned_agent_id || 'لم يتم التعيين'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">حدد محادثة لاستعراض البيانات.</p>
        )}
      </div>
    </div>
  );
}
