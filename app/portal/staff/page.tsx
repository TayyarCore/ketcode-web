import Link from "next/link";
import { listStaffProjects, safePreview, type Project } from "../../../lib/factory/portal";
import { requireFactoryStaff } from "../../../lib/factory/staff";
import { closeProject } from "../actions";
import styles from "../portal.module.css";
import { changeStage } from "./actions";

const stages: Record<Project["stage"], string> = {
  received: "استلمنا الطلب",
  building: "قيد التجهيز",
  review: "المعاينة جاهزة",
  paid: "تم تأكيد الدفع",
  launched: "تم التسليم",
};

function nextStep(project: Project) {
  switch (project.stage) {
    case "received": return "راجع بيانات العميل وابدأ التجهيز.";
    case "building": return "جهّز الموقع وأضف رابط المعاينة.";
    case "review": return project.preview_url === project.approved_preview_url
      ? "المعاينة معتمدة. راجع حالة الدفع في Stripe."
      : "بانتظار اعتماد العميل للمعاينة.";
    case "paid": return "راجع بيانات الدومين والبريد، ثم سجّل التسليم عند الجاهزية.";
    case "launched": return "الموقع مسلّم للعميل.";
  }
}

export default async function StaffPortal({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requireFactoryStaff();
  const params = await searchParams;
  const projects = await listStaffProjects().catch(() => null);
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header>
          <Link href="/portal?view=projects">مشاريعي</Link>
          <form action={closeProject}><button type="submit" className={styles.secondary}>تسجيل الخروج</button></form>
        </header>
        <section className={styles.card}>
          <p className={styles.kicker}>Ketcode</p>
          <h1>طلبات العملاء</h1>
          {params.saved && <p role="status">تم تحديث الطلب.</p>}
          {(params.error || projects === null) && <p role="alert" className={styles.error}>تعذّر إتمام الطلب. حدّث الصفحة وحاول مرة أخرى.</p>}
          {projects?.length === 0 && <p>لا توجد طلبات حاليًا.</p>}
        </section>
        {projects?.map((project) => (
          <article key={project.id} className={styles.card}>
            <h2>{project.name}</h2>
            <p><strong>{stages[project.stage]}</strong>{project.test_payment && " · دفع تجريبي"}</p>
            <p>{nextStep(project)}</p>
            <details>
              <summary>بيانات الطلب</summary>
              <p>{project.contact_name} · <bdi>{project.email}</bdi>{project.contact_phone && <> · <bdi>{project.contact_phone}</bdi></>}</p>
              <p>{project.city} · {project.template === "office" ? "قالب المكتب العقاري" : "قالب المشاريع المتعددة"}</p>
              {project.commercial_registration && <p>السجل التجاري <bdi>{project.commercial_registration}</bdi></p>}
              {project.fal_license && <p>ترخيص فال <bdi>{project.fal_license}</bdi></p>}
              {project.working_hours && <p>ساعات العمل {project.working_hours}</p>}
              {project.logo_name && <p><a href={"/portal/staff/logo?project=" + project.id} target="_blank" rel="noreferrer">افتح الشعار</a></p>}
              {[project.map_url, ...(project.social_links ?? []), ...project.reference_urls].map((value, index) => {
                const url = safePreview(value ?? null);
                return url && <p key={index}><a href={url} target="_blank" rel="noreferrer">افتح الرابط {index + 1}</a></p>;
              })}
              {project.launch_domain && <p>الدومين <bdi>{project.launch_domain}</bdi>{project.launch_domain_type && <> · {project.launch_domain_type === "existing" ? "ربط دومين قائم" : "تسجيل دومين جديد"}</>}</p>}
              {project.launch_email_alias && project.launch_domain && <p>البريد المطلوب <bdi>{project.launch_email_alias}@{project.launch_domain}</bdi>{project.launch_email_type && <> · {project.launch_email_type === "mailbox" ? "صندوق مستقل" : "تحويل"}</>}</p>}
              {safePreview(project.preview_url) && <p><a href={safePreview(project.preview_url)} target="_blank" rel="noreferrer">افتح الموقع</a></p>}
            </details>
            {(project.stage === "received" || project.stage === "building" || project.stage === "paid") && (
              <form className={styles.form} action={changeStage}>
                <input type="hidden" name="project" value={project.id} />
                {project.stage === "received" && <button className={styles.button} name="operation" value="build">ابدأ التجهيز</button>}
                {project.stage === "building" && <>
                  <label>رابط المعاينة<input name="preview" type="url" maxLength={2048} required dir="ltr" /></label>
                  <button className={styles.button} name="operation" value="review">أتح المعاينة للعميل</button>
                </>}
                {project.stage === "paid" && project.launch_domain_type && project.launch_email_type &&
                  <button className={styles.button} name="operation" value="launch">سجّل تسليم الموقع</button>}
              </form>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
