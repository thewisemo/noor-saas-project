'use client';

import DashboardHeader from '@/components/layout/DashboardHeader';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const highlights = [
  { label: 'المستأجرون النشطون', value: '12', delta: '+3 هذا الشهر' },
  { label: 'طلبات اليوم', value: '248', delta: '+18% عن الأمس' },
  { label: 'مناديب متصلون', value: '47', delta: '5 في التوصيل' },
];

export default function SuperDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <DashboardHeader title="لوحة السوبر أدمن" accountName="Noor HQ" roleLabel="سوبر أدمن" />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader
          title="كل ما تحتاجه لمراقبة مستأجريك"
          subtitle="تابع الأداء، اكتشف الأعطال، وادفع بالأتمتة إلى الأمام من خلال مركز نور التشغيلي."
          badge="محدث لحظيًا"
          actions={
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push('/super/tenants')}>إدارة المستأجرين</Button>
              <Button variant="secondary" className="text-sm">
                مشاركة رابط مع فريق GHITHAK
              </Button>
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map(item => (
            <Card
              key={item.label}
              className="space-y-2 border-none bg-gradient-to-br from-white via-white to-indigo-50 text-gray-900 dark:from-[#12142b] dark:via-[#141733] dark:to-[#151b3d]"
            >
              <p className="text-sm text-gray-500 dark:text-white/70">{item.label}</p>
              <p className="text-4xl font-extrabold">{item.value}</p>
              <span className="text-xs text-emerald-500 dark:text-emerald-300">{item.delta}</span>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card title="حالة الأنظمة">
            <div className="space-y-3 text-sm">
              {[
                { label: 'واجهة واتساب', status: 'متصل', tone: 'text-emerald-500' },
                { label: 'مركز الطلبات', status: 'متصل', tone: 'text-emerald-500' },
                { label: 'التكامل مع المستودع', status: 'مراقبة', tone: 'text-amber-500' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border px-3 py-2 text-[var(--color-text)]"
                >
                  <span>{item.label}</span>
                  <span className={`text-sm font-semibold ${item.tone}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="الإجراءات السريعة"
            description="نفّذ أهم المهام فورًا دون مغادرة هذه الشاشة."
            actions={<span className="text-xs text-[var(--color-muted)]">آخر تحديث منذ ٣ دقائق</span>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Button className="w-full" onClick={() => router.push('/super/tenants')}>
                إنشاء مستأجر جديد
              </Button>
              <Button variant="secondary" className="w-full">
                إرسال تنبيه عاجل
              </Button>
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              للوصول الكامل إلى بيانات المستأجرين والتعديل عليهم، انتقل إلى صفحة إدارة المستأجرين.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}
