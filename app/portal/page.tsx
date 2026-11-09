import type { Metadata } from "next";
import { cookies } from "next/headers";
import { findProject, newAccessCode, portalCookie, portalEnabled, safePreview, type Project } from "../../lib/factory/portal";
import { acceptPreview, closeProject, openProject, registerProject } from "./actions";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: "متابعة مشروعك | Ketcode",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const stages: [Project["stage"], string][] = [
  ["received", "استلمنا طلبك"],
  ["building", "نعمل على تجهيز موقعك"],
  ["review", "المعاينة جاهزة للمراجعة"],
  ["paid", "تم تأكيد الدفع"],
  ["launched", "تم إطلاق موقعك"],
];

const errors: Record<string, string> = {
  registration: "راجع الاسم والبريد والقالب والموافقة، ثم أعد المحاولة.",
  access: "رمز الدخول غير صحيح. راجع الرمز المحفوظ.",
  preview: "تعذّر اعتماد هذه المعاينة. حدّث الصفحة وتحقق من أحدث نسخة.",
  unavailable: "تعذّرت متابعة الطلب الآن. حاول مرة أخرى بعد قليل.",
};

const sample: Project = {
  id: "sample",
  name: "مكتب رُبى العقاري",
  template: "projects",
  stage: "building",
  preview_url: null,
  approved_preview_url: null,
};

function projectPaymentUrl(project: Project) {
  // This branch supports Sandbox checkout only. Production payment is gated separately.
  const value = process.env.FACTORY_STRIPE_TEST_PAYMENT_URL;
  if (process.env.VERCEL_ENV !== "preview" || !value ||
      !/^https:\/\/buy\.stripe\.com\/test_[A-Za-z0-9]+$/.test(value)) return undefined;
  const url = new URL(value);
  url.searchParams.set("client_reference_id", project.id);
  return url.href;
}

function ProjectView({ project, code, demo }: { project: Project; code?: string; demo: boolean }) {
  const index = stages.findIndex(([stage]) => stage === project.stage);
  const preview = safePreview(project.preview_url);
  const approved = Boolean(preview && project.preview_url === project.approved_preview_url);
  const payment = approved && project.stage === "review" ? projectPaymentUrl(project) : undefined;

  return (
    <section className={styles.card}>
      <p className={styles.kicker}>{demo ? "معاينة ببيانات تجريبية" : "صفحة مشروعك"}</p>
      <h1>{project.name}</h1>
      <p>{project.template === "office" ? "قالب المكتب العقاري" : "قالب المشاريع المتعددة"}</p>
      <ol className={styles.steps}>
        {stages.map(([stage, label], i) => (
          <li key={stage} aria-current={i === index ? "step" : undefined} data-reached={i <= index}>
            <span>{i + 1}</span>{label}
          </li>
        ))}
      </ol>
      {preview && (
        <div className={styles.actions}>
          <a className={styles.button} href={preview} target="_blank" rel="noopener noreferrer">افتح معاينة موقعك ↗</a>
          {project.stage === "review" && !approved && (
            <form action={acceptPreview}>
              <input type="hidden" name="preview" value={project.preview_url ?? ""} />
              <button className={styles.button} type="submit">اعتمد المعاينة</button>
            </form>
          )}
          {approved && project.stage === "review" && (
            <p>{payment ? <a className={styles.button} href={payment} target="_blank" rel="noopener noreferrer">ادفع 799 ريال لإطلاق الموقع (تجريبي)</a> : "تم اعتماد المعاينة. بانتظار تفعيل الدفع."}</p>
          )}
        </div>
      )}
      {code && (
        <details>
          <summary>رمز الرجوع إلى مشروعك</summary>
          <p>احتفظ بهذا الرمز في مكان خاص لفتح مشروعك من جهاز آخر.</p>
          <code className={styles.code} dir="ltr">{code}</code>
        </details>
      )}
      {code && <form action={closeProject}><button className={styles.secondary} type="submit">إغلاق الجلسة</button></form>}
    </section>
  );
}

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string }> }) {
  const params = await searchParams;
  const enabled = portalEnabled();
  const canDemo = process.env.VERCEL_ENV === "preview";
  const demo = canDemo && params.demo === "1";
  const code = enabled && !demo ? (await cookies()).get(portalCookie)?.value : undefined;
  const project = demo ? sample : await findProject(code).catch(() => null);
  const error = project === null ? errors.unavailable : Object.hasOwn(errors, params.error ?? "") ? errors[params.error ?? ""] : undefined;

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header><a href="/offers/real-estate">KETCODE</a><span>متابعة المشروع</span></header>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {project ? <ProjectView project={project} code={code} demo={demo} /> : (
          <>
            <section className={styles.card}>
              <p className={styles.kicker}>من الطلب إلى الإطلاق</p>
              <h1>ابدأ طلب موقعك</h1>
              <p>بعد التسجيل تفتح صفحة مشروعك مباشرة، ومنها تتابع التجهيز وتعتمد المعاينة.</p>
              {enabled ? (
                <form className={styles.form} action={registerProject}>
                  <input type="hidden" name="code" value={newAccessCode()} />
                  <label>اسمك أو اسم المنشأة<input name="name" autoComplete="name" maxLength={100} required /></label>
                  <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" maxLength={254} required dir="ltr" /></label>
                  <label>القالب<select name="template"><option value="office">قالب المكتب العقاري</option><option value="projects">قالب المشاريع المتعددة</option></select></label>
                  <label className={styles.check}><input type="checkbox" name="consent" required /> أوافق على استخدام بياناتي لمتابعة الطلب وفق <a href="/privacy">سياسة الخصوصية</a>.</label>
                  <button className={styles.button} type="submit">سجّل وافتح صفحة مشروعك</button>
                </form>
              ) : (
                <p>التسجيل غير متاح في هذه النسخة. {canDemo && <a href="/portal?demo=1">شاهد نموذج صفحة المشروع</a>}</p>
              )}
            </section>
            {enabled && <section className={styles.card}>
              <h2>عندك مشروع سابق؟</h2>
              <form className={styles.form} action={openProject}>
                <label>رمز الدخول الخاص بالمشروع<input name="code" autoComplete="off" maxLength={80} required dir="ltr" /></label>
                <button className={styles.button} type="submit">افتح صفحة مشروعك</button>
              </form>
            </section>}
          </>
        )}
      </div>
    </main>
  );
}
