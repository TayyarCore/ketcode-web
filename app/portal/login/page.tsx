import { getPendingEmail } from "../../../lib/factory/auth";
import { portalEnabled } from "../../../lib/factory/portal";
import styles from "../portal.module.css";
import { requestCode, resendCode, verifyCode } from "./actions";

export const metadata = {
  title: "الدخول إلى بوابة العميل | Ketcode",
  robots: { index: false, follow: false },
};

export default async function PortalLogin({ searchParams }: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const pendingEmail = sent === "1" ? await getPendingEmail() : undefined;
  const verify = Boolean(pendingEmail);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header><a href="/offers/real-estate">KETCODE</a><span>متابعة المشروع</span></header>
        <section className={styles.card}>
          <h1>الدخول إلى بوابة العميل</h1>
          {error && <p className={styles.error} role="alert">{error === "verify"
            ? "تعذّر التحقق من الرمز. تأكد منه أو اطلب رمزًا جديدًا."
            : error === "expired" ? "انتهت خطوة التحقق. أدخل بريدك لطلب رمز جديد."
            : "تعذّر إرسال الرمز الآن. حاول مرة أخرى بعد قليل."}</p>}
          {portalEnabled() ? (
            <form className={styles.form} action={verify ? verifyCode : requestCode}>
              <p>{verify ? <>أدخل الرمز المرسل إلى <bdi>{pendingEmail}</bdi>.</> : "أرسل رمز دخول إلى بريدك الإلكتروني."}</p>
              {!verify && <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" maxLength={254} required dir="ltr" /></label>}
              {verify && <label>رمز التحقق<input name="token" autoComplete="one-time-code" inputMode="numeric" minLength={6} maxLength={10} required dir="ltr" /></label>}
              <button className={styles.button} type="submit">{verify ? "تحقق وادخل" : "أرسل الرمز"}</button>
            </form>
          ) : <p>تسجيل الدخول غير متاح في هذه النسخة.</p>}
          {verify && portalEnabled() && (
            <form className={styles.actions} action={resendCode}>
              <button className={styles.secondary} type="submit">اطلب رمزًا جديدًا</button>
              <a href="/portal/login">تغيير البريد</a>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
