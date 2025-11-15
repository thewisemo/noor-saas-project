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
    <div className="min-h-screen bg-[#111] text-white">
      <div className="mx-auto flex h-screen max-w-7xl divide-x divide-gray-900 bg-[#0f0f0f]">
        <aside className="flex w-[26%] min-w-[260px] flex-col bg-[#181818]">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <h2 className="text-lg font-semibold">المحادثات ({conversations.length})</h2>
            <button onClick={fetchConversations} className="text-sm text-accent">
              تحديث
            </button>
          </div>
          <div className="p-3">
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="بحث باسم العميل أو الهاتف"
              className="w-full rounded-lg border border-gray-800 bg-[#0e0e0e] p-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-4">
            {isLoading && <p className="px-2 text-sm text-gray-400">جارٍ التحميل…</p>}
            {!isLoading &&
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`block w-full rounded-xl px-4 py-3 text-right text-sm transition ${
                    conv.id === selectedId ? 'bg-accent/10 border border-accent' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <p className="font-semibold">{conv.customer?.name || 'عميل واتساب'}</p>
                  <p className="text-xs text-gray-400">{conv.customer?.phone}</p>
                  <span className="text-xs text-gray-500">{conv.status}</span>
                </button>
              ))}
            {!isLoading && !filteredConversations.length && (
              <p className="px-2 text-center text-sm text-gray-500">لا توجد محادثات.</p>
            )}
          </div>
        </aside>

        <main className="flex w-[48%] flex-col bg-[#151515]">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
            <div>
              <p className="text-base font-semibold">{selectedConversation?.customer?.name || 'حدد محادثة'}</p>
              <p className="text-xs text-gray-400">{selectedConversation?.customer?.phone || ''}</p>
            </div>
            {selectedConversation && (
              <div className="flex gap-2">
                <button
                  className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs text-amber-200"
                  onClick={() => takeover(selectedConversation.id)}
                >
                  تدخل الوكيل
                </button>
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200"
                  onClick={() => resolve(selectedConversation.id)}
                >
                  إنهاء المحادثة
                </button>
              </div>
            )}
          </div>

          {selectedConversation ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] px-6 py-4">
                {selectedConversation.messages?.map(msg => {
                  const isCustomer = msg.from === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                        isCustomer ? 'bg-[#1f1f1f] text-gray-100' : 'bg-accent text-white ml-auto'
                      }`}
                      style={{ marginLeft: isCustomer ? undefined : 'auto' }}
                    >
                      <p className="text-[11px] opacity-70">
                        {msg.from === 'customer' ? 'العميل' : msg.from === 'agent' ? 'الموظف' : 'المساعد الآلي'}
                      </p>
                      <p>{msg.content}</p>
                      <p className="mt-1 text-[10px] opacity-60">{new Date(msg.created_at).toLocaleString('ar-SA')}</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-800 p-4">
                <div className="rounded-xl border border-gray-800 bg-[#101010] p-3 text-sm text-gray-400">
                  أدوات الرد اليدوي ستظهر هنا لاحقًا.
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500">اختر محادثة من القائمة.</div>
          )}
        </main>

        <section className="flex w-[26%] min-w-[260px] flex-col bg-[#181818]">
          <div className="border-b border-gray-800 px-4 py-3">
            <h2 className="text-lg font-semibold">السياق</h2>
          </div>
          {selectedConversation ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
              <div className="rounded-xl border border-gray-800 bg-[#101010] p-4">
                <p className="text-xs text-gray-400">العميل</p>
                <p className="text-base font-semibold">{selectedConversation.customer?.name || 'غير متوفر'}</p>
                <p className="text-gray-400">{selectedConversation.customer?.phone || '---'}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase">حالة المحادثة</p>
                  <div className="rounded border border-gray-700 py-1 text-center">{selectedConversation.status}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">الموظف المكلف</p>
                  <div className="rounded border border-gray-700 py-1 text-center">
                    {selectedConversation.assigned_agent_id || 'لم يتم التعيين'}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 space-y-2">
                <p className="text-xs text-gray-400 uppercase">الأوامر المرتبطة</p>
                <p className="text-gray-300">لا توجد أوامر حالياً</p>
                <button className="w-full rounded bg-accent py-2 text-xs">إنشاء طلب يدوي</button>
                <button className="w-full rounded border border-accent py-2 text-xs text-accent">تعيين سائق</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500">سيظهر هنا سياق العميل.</div>
          )}
        </section>
      </div>
    </div>
  );
}
