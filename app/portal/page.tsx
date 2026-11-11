import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isFactoryStaff } from "../../lib/factory/staff";
import { requirePortalEmail } from "../../lib/factory/auth";
import { findProject, listProjects, newAccessCode, portalEnabled, safePreview, type Project } from "../../lib/factory/portal";
import { acceptPreview, closeProject, registerProject, saveBusiness, saveContact, saveLaunchDetails, saveMaterials } from "./actions";
import { LaunchCountdown } from "./launch-countdown";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: "متابعة مشروعك | Ketcode",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const stages: { id: Project["stage"]; title: string; short: string; next: string }[] = [
  { id: "received", title: "استلمنا طلبك", short: "الطلب", next: "سنراجع بياناتك ونبدأ التجهيز. أكمل بيانات مشروعك أدناه إن كان ينقصها شيء." },
  { id: "building", title: "نعمل على تجهيز موقعك", short: "التجهيز", next: "جهّز شعارك إن وجد، ونبذة عن نشاطك وخدماتك، والصور وبيانات التواصل التي تريد عرضها. لقالب المطورين، جهّز اسم كل مشروع ونبذة عنه وصوره." },
  { id: "review", title: "المعاينة جاهزة للمراجعة", short: "المعاينة", next: "افتح المعاينة وراجع النصوص والصور وروابط التواصل. إذا عندك تعديلات تواصل معنا، وإذا كانت جاهزة اضغط «اعتمد المعاينة»." },
  { id: "paid", title: "تم تأكيد الدفع", short: "الدفع", next: "أرسل اسم النطاق المطلوب واختر عنوان البريد الرسمي لتجهيز الإطلاق." },
  { id: "launched", title: "تم إطلاق موقعك", short: "الإطلاق", next: "افتح رابط موقعك النهائي، وجرّب وسائل التواصل، ثم شارك الرابط مع عملائك." },
];

const templateName = (template: Project["template"]) =>
  template === "office" ? "قالب منشآت التسويق العقاري" : "قالب منشآت المطورين العقاريين";

const errors: Record<string, string> = {
  launch: "تعذّر حفظ بيانات الإطلاق. راجع اسم الدومين واختر طريقة توفيره ونوع البريد.",
  business: "تعذّر حفظ بيانات المنشأة. راجع الأرقام والمدينة وتأكد أن الروابط تبدأ بـ https://.",
  contact: "تعذّر حفظ بيانات التواصل. راجع الاسم ورقم الجوال وحاول مرة أخرى.",
  registration: "راجع بيانات الطلب والأرقام والمدينة وروابط الموقع، ثم أعد المحاولة.",
  access: "تعذّر فتح المشروع. اختر مشروعًا من حسابك.",
  preview: "تعذّر اعتماد هذه المعاينة. حدّث الصفحة وتحقق من أحدث نسخة.",
  references: "أدخل حتى 5 روابط صحيحة، كل رابط في سطر مستقل.",
  logo: "اختر صورة PNG أو JPG أو WebP بحجم لا يتجاوز 512 كيلوبايت.",
  materials: "تعذّر حفظ مواد الموقع. حاول مجددًا إذا كان مشروعك في مرحلة التجهيز.",
  unavailable: "تعذّرت متابعة الطلب الآن. حاول مرة أخرى بعد قليل.",
};

const saved: Record<string, string> = {
  launch: "تم حفظ بيانات الإطلاق.",
  business: "تم حفظ بيانات المنشأة.",
  contact: "تم حفظ بيانات التواصل.",
  materials: "تم حفظ مواد تجهيز موقعك.",
};

const sample: Project = {
  id: "sample",
  name: "مكتب رُبى العقاري",
  template: "projects",
  stage: "building",
  preview_url: null,
  approved_preview_url: null,
  reference_urls: [],
  logo_name: null,
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

function ContactFields({ project }: { project?: Project }) {
  return (
    <>
      <label>اسم المسؤول<input name="contact_name" autoComplete="name" maxLength={100} defaultValue={project?.contact_name ?? ""} required /></label>
      <label>رقم الجوال<input name="contact_phone" type="tel" autoComplete="tel" maxLength={32} placeholder="05xxxxxxxx" defaultValue={project?.contact_phone ?? ""} required dir="ltr" /></label>
    </>
  );
}

function BusinessFields({ project }: { project?: Project }) {
  return (
    <>
      <label>رقم السجل التجاري<input name="commercial_registration" inputMode="numeric" maxLength={30} defaultValue={project?.commercial_registration ?? ""} required dir="ltr" /></label>
      <label>رقم ترخيص فال<input name="fal_license" inputMode="numeric" maxLength={30} defaultValue={project?.fal_license ?? ""} required dir="ltr" /></label>
      <label>المدينة<input name="city" autoComplete="address-level2" maxLength={100} defaultValue={project?.city ?? ""} required /></label>
      <label>رابط موقع المكتب على الخريطة (اختياري)<input name="map_url" type="url" maxLength={2048} placeholder="https://maps.app.goo.gl/…" defaultValue={project?.map_url ?? ""} dir="ltr" /></label>
      <label>روابط حسابات التواصل الاجتماعي (اختياري)
        <textarea name="social_links" maxLength={10000} rows={3} defaultValue={project?.social_links?.join("\n") ?? ""} dir="ltr" />
        <small>رابط كامل لكل حساب في سطر مستقل، حتى 6 روابط.</small>
      </label>
      <label>ساعات العمل (اختياري)<textarea name="working_hours" maxLength={500} rows={2} placeholder="الأحد إلى الخميس، 9 صباحًا إلى 5 مساءً" defaultValue={project?.working_hours ?? ""} /></label>
    </>
  );
}

function TopBar({ email, staff, showProjects }: { email?: string; staff: boolean; showProjects: boolean }) {
  return (
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/"><img src="/assets/kc-mark.svg" alt="" width={30} height={30} />KetCode</Link>
      <nav className={styles.nav} aria-label="البوابة">
        {staff && <Link href="/portal/staff">طلبات العملاء</Link>}
        {showProjects && <a href="/portal?view=projects">مشاريعي</a>}
        {email && <form action={closeProject}><button className={styles.secondary} type="submit">تسجيل الخروج</button></form>}
      </nav>
    </header>
  );
}

function ProjectView({ project, demo }: { project: Project; demo: boolean }) {
  const index = stages.findIndex(({ id }) => id === project.stage);
  const current = stages[index] ?? stages[0];
  const preview = safePreview(project.preview_url);
  const approved = Boolean(preview && project.preview_url === project.approved_preview_url);
  const canEditMaterials = project.stage === "received" || project.stage === "building";
  const payment = approved && project.stage === "review" ? projectPaymentUrl(project) : undefined;

  return (
    <>
      <section className={styles.card}>
        <div className={styles.head}>
          <div>
            <p className={styles.kicker}>{demo ? "معاينة ببيانات تجريبية" : "مشروعك"}</p>
            <h1>{project.name}</h1>
            <p className={styles.muted}>{templateName(project.template)}</p>
          </div>
          <span className={styles.badge} data-stage={project.stage}>{current.title}</span>
        </div>
        <ol className={styles.steps} aria-label="مراحل المشروع">
          {stages.map(({ id, short }, i) => (
            <li key={id} aria-current={i === index ? "step" : undefined} data-reached={i < index}>
              <span aria-hidden="true">{i + 1}</span>{short}
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.card + " " + styles.now} aria-labelledby="now-title">
        <h2 id="now-title">المطلوب الآن</h2>
        <p>{project.stage === "review" && approved ? "اعتمدت المعاينة. أكمل الدفع لنبدأ تجهيز الإطلاق." : current.next}</p>

        {preview && (
          <div className={styles.actions}>
            <a className={styles.button + (project.stage === "review" && !approved ? " " + styles.buttonGhost : "")} href={preview} target="_blank" rel="noopener noreferrer">
              {project.stage === "launched" ? "افتح موقعك" : "افتح معاينة موقعك"}
            </a>
            {project.stage === "review" && !approved && (
              <form action={acceptPreview}>
                <input type="hidden" name="project" value={project.id} />
                <input type="hidden" name="preview" value={project.preview_url ?? ""} />
                <button className={styles.button} type="submit">اعتمد المعاينة</button>
              </form>
            )}
            {approved && project.stage === "review" && payment && (
              <a className={styles.button + " " + styles.buttonPay} href={payment} target="_blank" rel="noopener noreferrer">ادفع 799 ريال لإطلاق الموقع (تجريبي)</a>
            )}
          </div>
        )}
        {approved && project.stage === "review" && !payment && <p className={styles.note}>تم اعتماد المعاينة. بانتظار تفعيل الدفع.</p>}

        {canEditMaterials && (
          <div className={styles.materials}>
            <h3>مواد تجهيز موقعك</h3>
            <form className={styles.form} action={demo ? undefined : saveMaterials}>
              <input type="hidden" name="project" value={project.id} />
              <label>
                روابط مواقع أعجبتني (اختياري)
                <textarea name="references" disabled={demo} dir="ltr" rows={3} maxLength={1600}
                  placeholder="https://example.com" defaultValue={project.reference_urls.join("\n")} />
                <small>حتى 5 روابط، كل رابط في سطر مستقل.</small>
              </label>
              <label className={styles.full}>
                رفع الشعار (اختياري)
                <input name="logo" type="file" disabled={demo} accept="image/png,image/jpeg,image/webp" />
                <small>PNG أو JPG أو WebP، حتى 512 كيلوبايت.</small>
              </label>
              {project.logo_name && <p>الشعار المحفوظ: <bdi>{project.logo_name}</bdi></p>}
              {demo ? <p className={styles.note}>هذه معاينة لشكل الحقول. الحفظ متاح بعد تفعيل التسجيل.</p> :
                <button className={styles.button} type="submit">احفظ مواد الموقع</button>}
            </form>
          </div>
        )}

        {project.stage === "paid" && (
          <div className={styles.materials}>
            <h3>تجهيز الإطلاق الرسمي</h3>
            {project.test_payment && <p className={styles.muted}>الدفع التجريبي مؤكد.</p>}
            {project.launch_due_at ? <LaunchCountdown dueAt={project.launch_due_at} /> : (
              <p className={styles.note} role="status">بانتظار تجهيز الدومين. يبدأ العدّ التنازلي بعد تأكيد جاهزيته.</p>
            )}
            <form className={styles.form} action={saveLaunchDetails}>
              <input type="hidden" name="project" value={project.id} />
              <label>هل عندك دومين؟
                <select name="launch_domain_type" defaultValue={project.launch_domain_type ?? ""} required>
                  <option value="" disabled>اختر طريقة توفير الدومين</option>
                  <option value="existing">عندي دومين وأحتاج ربطه</option>
                  <option value="new">أحتاج تسجيل دومين جديد</option>
                </select>
              </label>
              <label>الدومين المطلوب
                <input name="launch_domain" placeholder="example.com" defaultValue={project.launch_domain ?? ""} maxLength={253} required dir="ltr" />
              </label>
              <label>البريد الرسمي
                <select name="launch_email_alias" defaultValue={project.launch_email_alias ?? "info"} dir="ltr">
                  {["info", "contact", "team"].map((alias) => <option key={alias} value={alias}>{alias}@{project.launch_domain ?? "example.com"}</option>)}
                </select>
              </label>
              <label>نوع البريد الرسمي
                <select name="launch_email_type" defaultValue={project.launch_email_type ?? ""} required>
                  <option value="" disabled>اختر نوع البريد</option>
                  <option value="mailbox">صندوق بريد مستقل</option>
                  <option value="forwarding">تحويل الرسائل إلى بريد قائم</option>
                </select>
              </label>
              <button className={styles.button} type="submit">احفظ بيانات الإطلاق</button>
            </form>
          </div>
        )}
      </section>

      {!demo && (
        <section className={styles.card}>
          <h2>بيانات مشروعك</h2>
          <p className={styles.lede}>نستخدمها في موقعك وللتواصل معك بخصوص الطلب.</p>
          <details className={styles.details} open={!project.contact_name || !project.contact_phone}>
            <summary>بيانات التواصل</summary>
            <form className={styles.form} action={saveContact}>
              <input type="hidden" name="project" value={project.id} />
              <ContactFields project={project} />
              <button className={styles.button} type="submit">احفظ بيانات التواصل</button>
            </form>
          </details>
          <details className={styles.details} open={!project.commercial_registration || !project.fal_license || !project.city}>
            <summary>بيانات المنشأة</summary>
            <form className={styles.form} action={saveBusiness}>
              <input type="hidden" name="project" value={project.id} />
              <BusinessFields project={project} />
              <button className={styles.button} type="submit">احفظ بيانات المنشأة</button>
            </form>
          </details>
        </section>
      )}
    </>
  );
}

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string; saved?: string; project?: string; view?: string }> }) {
  const params = await searchParams;
  const enabled = portalEnabled();
  const canDemo = process.env.VERCEL_ENV === "preview";
  const demo = canDemo && params.demo === "1";
  const email = enabled && !demo ? await requirePortalEmail() : undefined;
  if (email && isFactoryStaff(email) && !params.view && !params.project && !params.error) {
    redirect("/portal/staff");
  }
  const projects = email ? await listProjects(email).catch(() => null) : [];
  const showNew = params.view === "new";
  const showList = params.view === "projects";
  const selected = showNew || showList ? undefined : params.project ?? (projects?.length === 1 ? projects[0].id : undefined);
  const project = demo ? sample : email && selected && projects?.some(({ id }) => id === selected)
    ? await findProject(email, selected).catch(() => null)
    : undefined;
  const error = projects === null || project === null ? errors.unavailable
    : selected && !project ? errors.access
    : Object.hasOwn(errors, params.error ?? "") ? errors[params.error ?? ""] : undefined;
  const savedMessage = project && Object.hasOwn(saved, params.saved ?? "") ? saved[params.saved ?? ""] : undefined;
  const staff = Boolean(email && isFactoryStaff(email));

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <TopBar email={email} staff={staff} showProjects={Boolean(email && projects && projects.length > 0 && (project || showNew))} />
        {error && <p className={styles.error} role="alert">{error}</p>}
        {savedMessage && <p className={styles.status} role="status">{savedMessage}</p>}
        {project ? <ProjectView project={project} demo={demo} /> : projects === null ? null
          : projects.length > 0 && !showNew ? (
            <section className={styles.card}>
              <h1>مشاريعي</h1>
              <ul className={styles.list}>
                {projects.map(({ id, name, stage }) => (
                  <li key={id}><a href={"/portal?project=" + id}><span>{name}</span><span className={styles.badge} data-stage={stage}>{stages.find((item) => item.id === stage)?.title}</span></a></li>
                ))}
              </ul>
              <a className={styles.button} href="/portal?view=new">اطلب موقعًا جديدًا</a>
            </section>
          ) : (
            <section className={styles.card}>
              <h1>ابدأ طلب موقعك</h1>
              <p className={styles.lede}>بعد التسجيل تفتح صفحة مشروعك مباشرة، ومنها تتابع التجهيز وتراجع المعاينة وتعتمدها قبل الدفع.</p>
              {enabled ? (
                <form className={styles.form} action={registerProject}>
                  <input type="hidden" name="code" value={newAccessCode()} />
                  <div className={styles.fieldset}>
                    <h3>المنشأة</h3>
                    <label>اسم المكتب أو المنشأة<input name="name" autoComplete="organization" maxLength={100} required /></label>
                    <label>القالب<select name="template"><option value="office">{templateName("office")}</option><option value="projects">{templateName("projects")}</option></select></label>
                  </div>
                  <div className={styles.fieldset}>
                    <h3>التواصل</h3>
                    <ContactFields />
                    <p className={styles.muted}>بريد متابعة الطلب: <bdi>{email}</bdi></p>
                  </div>
                  <div className={styles.fieldset}>
                    <h3>الترخيص والعنوان</h3>
                    <BusinessFields />
                  </div>
                  <label className={styles.check}><input type="checkbox" name="consent" required /><span>أوافق على استخدام بياناتي لمتابعة الطلب وفق <a href="/privacy">سياسة الخصوصية</a>.</span></label>
                  <button className={styles.button} type="submit">سجّل وافتح صفحة مشروعك</button>
                </form>
              ) : (
                <p className={styles.note}>التسجيل غير متاح في هذه النسخة. {canDemo && <a href="/portal?demo=1">شاهد نموذج صفحة المشروع</a>}</p>
              )}
            </section>
          )}
      </div>
    </main>
  );
}
