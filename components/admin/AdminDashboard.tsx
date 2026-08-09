"use client";

import { useState } from "react";
import type { MarketIntelligence, OfficeStats } from "@/lib/admin/types";

const TABS = ["نظرة عامة", "السوق", "المكاتب"] as const;
type Tab = (typeof TABS)[number];

const ARABIC_MONTHS: Record<string, string> = {
  "01": "يناير",
  "02": "فبراير",
  "03": "مارس",
  "04": "أبريل",
  "05": "مايو",
  "06": "يونيو",
  "07": "يوليو",
  "08": "أغسطس",
  "09": "سبتمبر",
  "10": "أكتوبر",
  "11": "نوفمبر",
  "12": "ديسمبر",
};

const numberFormat = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  maximumFractionDigits: 0,
});

function formatNumber(value: number | null | undefined) {
  return value == null ? "—" : numberFormat.format(value);
}

function formatPrice(value: number | null | undefined) {
  return value == null ? "—" : `${numberFormat.format(value)} ر.س`;
}

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${ARABIC_MONTHS[m] ?? m} ${year}`;
}

export function AdminDashboard({
  market,
  offices,
}: {
  market: MarketIntelligence;
  offices: OfficeStats[];
}) {
  const [tab, setTab] = useState<Tab>("نظرة عامة");

  return (
    <div className="mx-auto max-w-6xl">
      <nav className="mb-6 flex gap-2 border-b border-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-white text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "نظرة عامة" && <OverviewTab market={market} />}
      {tab === "السوق" && <MarketTab market={market} />}
      {tab === "المكاتب" && <OfficesTab offices={offices} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function OverviewTab({ market }: { market: MarketIntelligence }) {
  const { systemHealth, summary, monthlyTrend } = market;
  const maxCount = Math.max(...monthlyTrend.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="🏢 المكاتب" value={formatNumber(systemHealth.offices)} />
        <StatCard label="👥 المستخدمون" value={formatNumber(systemHealth.users)} />
        <StatCard label="🏠 العقارات" value={formatNumber(systemHealth.properties)} />
        <StatCard label="👤 العملاء" value={formatNumber(systemHealth.clients)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="متوسط سعر العقار" value={formatPrice(summary.avg_price)} />
        <StatCard
          label="متوسط سعر المتر"
          value={formatPrice(summary.avg_price_per_sqm)}
        />
        <StatCard label="المدن النشطة" value={formatNumber(summary.cities_count)} />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-4 text-sm font-medium text-gray-400">
          الاتجاه الشهري (آخر ٦ أشهر)
        </h2>
        {monthlyTrend.length === 0 ? (
          <p className="py-8 text-center text-gray-500">لا توجد بيانات بعد</p>
        ) : (
          <div className="flex h-48 items-end justify-around gap-4">
            {monthlyTrend.map((m) => (
              <div
                key={m.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs text-gray-300">
                  {formatNumber(m.count)}
                </span>
                <div
                  className="w-full max-w-16 rounded-t bg-emerald-500"
                  style={{ height: `${(m.count / maxCount) * 100}%` }}
                />
                <span className="text-xs text-gray-400">
                  {monthLabel(m.month)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketTab({ market }: { market: MarketIntelligence }) {
  const { byCity, byType, byDistrict } = market;
  const totalByType = byType.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-4 text-sm font-medium text-gray-400">توزيع بالمدينة</h2>
        <Table
          headers={["المدينة", "عدد العقارات", "متوسط السعر", "متوسط سعر المتر"]}
          rows={byCity.map((c) => [
            c.city,
            formatNumber(c.count),
            formatPrice(c.avg_price),
            formatPrice(c.avg_price_sqm),
          ])}
        />
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-4 text-sm font-medium text-gray-400">توزيع بالنوع</h2>
        {byType.length === 0 ? (
          <EmptyRow />
        ) : (
          <div className="space-y-3">
            {byType.map((t) => {
              const pct = totalByType ? (t.count / totalByType) * 100 : 0;
              return (
                <div key={t.property_type} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm">{t.property_type}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-gray-800">
                    <div
                      className="h-full rounded bg-sky-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-end text-sm text-gray-400">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-4 text-sm font-medium text-gray-400">
          أكثر الأحياء نشاطاً
        </h2>
        <Table
          headers={["الحي", "المدينة", "العدد", "متوسط سعر المتر"]}
          rows={byDistrict.map((d) => [
            d.district,
            d.city,
            formatNumber(d.count),
            formatPrice(d.avg_price_sqm),
          ])}
        />
      </section>
    </div>
  );
}

function OfficesTab({ offices }: { offices: OfficeStats[] }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-4 text-sm font-medium text-gray-400">جميع المكاتب</h2>
      <Table
        headers={[
          "اسم المكتب",
          "المدينة",
          "الخطة",
          "العقارات",
          "العملاء",
          "المستخدمون",
          "تاريخ الانضمام",
        ]}
        rows={offices.map((o) => [
          o.name ?? "—",
          o.city ?? "—",
          o.plan ?? "—",
          formatNumber(o.properties_count),
          formatNumber(o.clients_count),
          formatNumber(o.users_count),
          o.created_at
            ? new Date(o.created_at).toLocaleDateString("ar-SA-u-nu-latn")
            : "—",
        ])}
      />
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return <EmptyRow />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-start text-gray-400">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-800/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRow() {
  return <p className="py-8 text-center text-gray-500">لا توجد بيانات بعد</p>;
}
