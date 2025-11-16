'use client';

import DashboardHeader from '@/components/layout/DashboardHeader';

const highlights = [
  { label: 'المستأجرون النشطون', value: '12', delta: '+3 هذا الشهر' },
  { label: 'طلبات اليوم', value: '248', delta: '+18% عن الأمس' },
  { label: 'مناديب متصلون', value: '47', delta: '5 في التوصيل' },
];

export default function SuperDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader title="لوحة السوبر أدمن" />
      <main className="space-y-6 p-6">
        <section className="glass-panel">
          <div className="relative z-10 flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-300">مركز عمليات نور</p>
            <h1 className="text-3xl font-bold">تحكم كامل في المستأجرين والمحادثات والطلبات من شاشة واحدة.</h1>
            <p className="text-gray-200">
              راقب الأداء الفوري، اعرف حالة الدردشة مع العملاء، وادفع العروض الترويجية في الوقت الفعلي.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent to-black/30" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map(item => (
            <div key={item.label} className="card space-y-3">
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-3xl font-bold">{item.value}</p>
              <span className="text-xs text-emerald-400">{item.delta}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card space-y-4">
            <p className="text-lg font-semibold">حالة الأنظمة</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-gray-800/60 px-3 py-2">
                <span>واجهة واتساب</span>
                <span className="text-emerald-400">متصل</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-800/60 px-3 py-2">
                <span>مركز الطلبات</span>
                <span className="text-emerald-400">متصل</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-800/60 px-3 py-2">
                <span>التكامل مع المستودع</span>
                <span className="text-yellow-400">مراقبة</span>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <p className="text-lg font-semibold">الإجراءات السريعة</p>
            <div className="grid gap-3 md:grid-cols-2">
              <button className="rounded-2xl border border-gray-800/70 bg-gradient-to-br from-accent/40 to-accent/10 p-4 text-left text-sm font-semibold text-white shadow-lg transition hover:translate-y-0.5">
                إنشاء مستأجر جديد
              </button>
              <button className="rounded-2xl border border-gray-800/70 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 p-4 text-left text-sm font-semibold text-emerald-100 shadow-lg transition hover:translate-y-0.5">
                إرسال تنبيه عاجل
              </button>
            </div>
            <p className="text-xs text-gray-400">
              للوصول الكامل إلى بيانات المستأجرين والتعديل عليهم، انتقل إلى صفحة إدارة المستأجرين.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
