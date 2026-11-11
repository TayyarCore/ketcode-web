"use client";

import { useEffect, useState } from "react";

export function LaunchCountdown({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState<number>();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const deadline = new Date(dueAt);
  const remaining = now === undefined ? undefined : Math.max(0, Math.ceil((deadline.getTime() - now) / 1000));
  const date = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  }).format(deadline);

  return (
    <div>
      <p>موعد الإطلاق المستهدف <time dateTime={dueAt}>{date}</time> بتوقيت الرياض</p>
      {remaining === 0 && <p>حلّ موعد الإطلاق المستهدف. تابع حالة المشروع هنا.</p>}
      {remaining !== undefined && remaining > 0 && (
        <p>
          متبقٍ {Math.floor(remaining / 3600)} ساعة و{Math.floor(remaining / 60) % 60} دقيقة و{remaining % 60} ثانية
        </p>
      )}
    </div>
  );
}
