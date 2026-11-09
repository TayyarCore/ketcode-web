import { portalEnabled } from "../../../lib/factory/portal";
import styles from "../portal.module.css";
import { requestCode, verifyCode } from "./actions";

export const metadata = {
  title: "الدخول إلى بوابة العميل | Ketcode",
  robots: { index: false, follow: false },
};

export default async function PortalLogin({ searchParams }: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const verify = sent === "1";

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header><a href="/offers/real-estate">KETCODE</a><span>متابعة المشروع</span></header>
        <section className={styles.card}>
          <h1>الدخول إلى بوابة العميل</h1>
          {error && <p className={styles.error} role="alert">{error === "verify"
            ? "تعذّر التحقق من الرمز. راجع البريد والرمز أو اطلب رمزًا جديدًا."
            : "تعذّر إرسال الرمز الآن. راجع البريد وحاول مرة أخرى."}</p>}
          {portalEnabled() ? (
            <form className={styles.form} action={verify ? verifyCode : requestCode}>
              <p>{verify ? "أدخل الرمز الذي وصلك والبريد الذي طلبت الرمز عليه." : "أرسل رمز دخول إلى بريدك الإلكتروني."}</p>
              <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" maxLength={254} required dir="ltr" /></label>
              {verify && <label>رمز التحقق<input name="token" autoComplete="one-time-code" inputMode="numeric" minLength={6} maxLength={10} required dir="ltr" /></label>}
              <button className={styles.button} type="submit">{verify ? "تحقق وادخل" : "أرسل الرمز"}</button>
              {verify && <a href="/portal/login">اطلب رمزًا جديدًا</a>}
            </form>
          ) : <p>تسجيل الدخول غير متاح في هذه النسخة.</p>}
        </section>
      </div>
    </main>
  );
}
