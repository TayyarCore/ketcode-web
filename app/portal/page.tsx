import type { Metadata } from "next";
import { requirePortalEmail } from "../../lib/factory/auth";
import { findProject, listProjects, newAccessCode, portalEnabled, safePreview, type Project } from "../../lib/factory/portal";
import { acceptPreview, closeProject, registerProject, saveBusiness, saveContact, saveMaterials } from "./actions";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: "متابعة مشروعك | Ketcode",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const stages: { id: Project["stage"]; title: string; next: string }[] = [
  { id: "received", title: "استلمنا طلبك", next: "يمكنك متابعة حالة الطلب من هذه الصفحة." },
  { id: "building", title: "نعمل على تجهيز موقعك", next: "جهّز شعارك إن وجد، ونبذة عن نشاطك وخدماتك، والصور وبيانات التواصل التي تريد عرضها. لقالب المشاريع، جهّز اسم كل مشروع ونبذة عنه وصوره." },
  { id: "review", title: "المعاينة جاهزة للمراجعة", next: "افتح المعاينة وراجع النصوص والصور وروابط التواصل. إذا عندك تعديلات تواصل معنا، وإذا كانت جاهزة اضغط «اعتمد المعاينة»." },
  { id: "paid", title: "تم تأكيد الدفع", next: "يظهر زر دفع 799 ريال بعد اعتماد المعاينة. بعد تأكيد الدفع، شاركنا اسم النطاق إذا كان عندك نطاق ترغب بربطه." },
  { id: "launched", title: "تم إطلاق موقعك", next: "افتح رابط موقعك النهائي، وجرّب وسائل التواصل، ثم شارك الرابط مع عملائك." },
];

const errors: Record<string, string> = {
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
      <label>اسم العميل<input name="contact_name" autoComplete="name" maxLength={100} defaultValue={project?.contact_name ?? ""} required /></label>
      <label>رقم الجوال<input name="contact_phone" type="tel" autoComplete="tel" maxLength={32} defaultValue={project?.contact_phone ?? ""} required dir="ltr" /></label>
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
        <small>أضف رابطًا كاملًا لكل حساب في سطر مستقل، حتى 6 روابط.</small>
      </label>
      <label>ساعات العمل (اختياري)<textarea name="working_hours" maxLength={500} rows={2} placeholder="الأحد إلى الخميس، 9 صباحًا إلى 5 مساءً" defaultValue={project?.working_hours ?? ""} /></label>
    </>
  );
}

function ProjectView({ project, demo }: { project: Project; demo: boolean }) {
  const index = stages.findIndex(({ id }) => id === project.stage);
  const preview = safePreview(project.preview_url);
  const approved = Boolean(preview && project.preview_url === project.approved_preview_url);
  const canEditMaterials = project.stage === "received" || project.stage === "building";
  const payment = approved && project.stage === "review" ? projectPaymentUrl(project) : undefined;

  return (
    <section className={styles.card}>
      <p className={styles.kicker}>{demo ? "معاينة ببيانات تجريبية" : "صفحة مشروعك"}</p>
      <h1>{project.name}</h1>
      <p>{project.template === "office" ? "قالب المكتب العقاري" : "قالب المشاريع المتعددة"}</p>
      {!demo && (
        <details open={!project.contact_name || !project.contact_phone}>
          <summary>بيانات التواصل</summary>
          <form className={styles.form} action={saveContact}>
              <input type="hidden" name="project" value={project.id} />
            <ContactFields project={project} />
            <button className={styles.button} type="submit">احفظ بيانات التواصل</button>
          </form>
        </details>
      )}
      {!demo && (
        <details open={!project.commercial_registration || !project.fal_license || !project.city}>
          <summary>بيانات المنشأة</summary>
          <form className={styles.form} action={saveBusiness}>
            <input type="hidden" name="project" value={project.id} />
            <BusinessFields project={project} />
            <button className={styles.button} type="submit">احفظ بيانات المنشأة</button>
          </form>
        </details>
      )}
      <h2>المطلوب منك في كل مرحلة</h2>
      <ol className={styles.steps}>
        {stages.map(({ id, title, next }, i) => (
          <li key={id} aria-current={i === index ? "step" : undefined} data-reached={i <= index}>
            <span aria-hidden="true">{i + 1}</span>
            <div>
              <strong>{title}</strong>
              <p>{id === "review" && approved && project.stage === "review" ? "اعتمدت المعاينة. تابع إلى الدفع عند ظهور الزر." : next}</p>
            </div>
          </li>
        ))}
      </ol>
      {canEditMaterials && (
        <section className={styles.materials}>
          <h2>مواد تجهيز موقعك</h2>
          <form className={styles.form} action={demo ? undefined : saveMaterials}>
              <input type="hidden" name="project" value={project.id} />
            <label>
              روابط مواقع أعجبتني (اختياري)
              <textarea name="references" disabled={demo} dir="ltr" rows={3} maxLength={1600}
                placeholder="https://example.com" defaultValue={project.reference_urls.join("\n")} />
              <small>أضف حتى 5 روابط، كل رابط في سطر مستقل.</small>
            </label>
            <label>
              رفع الشعار (اختياري)
              <input name="logo" type="file" disabled={demo} accept="image/png,image/jpeg,image/webp" />
              <small>PNG أو JPG أو WebP، حتى 512 كيلوبايت.</small>
            </label>
            {project.logo_name && <p>الشعار المحفوظ <bdi>{project.logo_name}</bdi></p>}
            {demo ? <p>هذه معاينة لشكل الحقول. الحفظ متاح بعد تفعيل التسجيل.</p> :
              <button className={styles.button} type="submit">احفظ مواد الموقع</button>}
          </form>
        </section>
      )}
      {preview && (
        <div className={styles.actions}>
          <a className={styles.button} href={preview} target="_blank" rel="noopener noreferrer">افتح معاينة موقعك ↗</a>
          {project.stage === "review" && !approved && (
            <form action={acceptPreview}>
              <input type="hidden" name="project" value={project.id} />
              <input type="hidden" name="preview" value={project.preview_url ?? ""} />
              <button className={styles.button} type="submit">اعتمد المعاينة</button>
            </form>
          )}
          {approved && project.stage === "review" && (
            <p>{payment ? <a className={styles.button} href={payment} target="_blank" rel="noopener noreferrer">ادفع 799 ريال لإطلاق الموقع (تجريبي)</a> : "تم اعتماد المعاينة. بانتظار تفعيل الدفع."}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string; saved?: string; project?: string; view?: string }> }) {
  const params = await searchParams;
  const enabled = portalEnabled();
  const canDemo = process.env.VERCEL_ENV === "preview";
  const demo = canDemo && params.demo === "1";
  const email = enabled && !demo ? await requirePortalEmail() : undefined;
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

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header><a href="/offers/real-estate">KETCODE</a><span>متابعة المشروع</span></header>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {project && params.saved === "business" && <p role="status">تم حفظ بيانات المنشأة.</p>}
        {project && params.saved === "contact" && <p role="status">تم حفظ بيانات التواصل.</p>}
        {project && params.saved === "materials" && <p role="status">تم حفظ مواد تجهيز موقعك.</p>}
        {email && <form action={closeProject}><button className={styles.secondary} type="submit">تسجيل الخروج</button></form>}
        {email && projects && projects.length > 0 && (project || showNew) &&
          <p><a href="/portal?view=projects">مشاريعي</a></p>}
        {project ? <ProjectView project={project} demo={demo} /> : projects === null ? null
          : projects.length > 0 && !showNew ? (
            <section className={styles.card}>
              <h1>مشاريعي</h1>
              <ul>
                {projects.map(({ id, name, stage }) => (
                  <li key={id}><a href={"/portal?project=" + id}>{name}</a> · {stages.find((item) => item.id === stage)?.title}</li>
                ))}
              </ul>
              <a className={styles.button} href="/portal?view=new">اطلب موقعًا جديدًا</a>
            </section>
          ) : (
          <>
            <section className={styles.card}>
              <p className={styles.kicker}>من الطلب إلى الإطلاق</p>
              <h1>ابدأ طلب موقعك</h1>
              <p>بعد التسجيل تفتح صفحة مشروعك مباشرة، ومنها تتابع التجهيز وتعتمد المعاينة.</p>
              {enabled ? (
                <form className={styles.form} action={registerProject}>
                  <input type="hidden" name="code" value={newAccessCode()} />
                  <label>اسم المكتب أو المنشأة<input name="name" autoComplete="organization" maxLength={100} required /></label>
                  <ContactFields />
                  <BusinessFields />
                  <p>بريد متابعة الطلب <bdi>{email}</bdi></p>
                  <label>القالب<select name="template"><option value="office">قالب المكتب العقاري</option><option value="projects">قالب المشاريع المتعددة</option></select></label>
                  <label className={styles.check}><input type="checkbox" name="consent" required /> أوافق على استخدام بياناتي لمتابعة الطلب وفق <a href="/privacy">سياسة الخصوصية</a>.</label>
                  <button className={styles.button} type="submit">سجّل وافتح صفحة مشروعك</button>
                </form>
              ) : (
                <p>التسجيل غير متاح في هذه النسخة. {canDemo && <a href="/portal?demo=1">شاهد نموذج صفحة المشروع</a>}</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
