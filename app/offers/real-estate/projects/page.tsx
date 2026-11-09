import type { Metadata } from "next";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "معاينة قالب المشاريع المتعددة | Ketcode",
  robots: { index: false, follow: false },
};

const projects = [
  { name: "ديار الوادي", type: "مشروع سكني", location: "المدينة المنورة", summary: "فلل عائلية بواجهات مستقلة ومساحات خارجية.", details: "تتضمن صفحة المشروع عادةً المخططات والصور المعتمدة ومعلومات الوصول." },
  { name: "واجهة النخيل", type: "مشروع تجاري", location: "المدينة المنورة", summary: "مجمع للمحلات والخدمات على شارع رئيسي.", details: "يمكن عرض المساحات النموذجية ومداخل الزوار وبيانات التواصل مع فريق التأجير." },
  { name: "مدار الأعمال", type: "مشروع مكتبي", location: "المدينة المنورة", summary: "مكاتب للشركات مع مساحات مشتركة للاجتماعات.", details: "يمكن عرض أنواع المساحات والخدمات المتاحة وكيفية طلب زيارة للمشروع." },
];

export default function ProjectsPreview() {
  return (
    <main className={styles.page}>
      <div className={styles.notice}>معاينة من Ketcode · بيانات المشاريع لأغراض العرض</div>
      <header className={styles.header}>
        <div className={styles.wrap + " " + styles.nav}>
          <strong>رُبى العقارية</strong>
          <a className={styles.navAction} href="/offers/real-estate#templates">العودة إلى القوالب</a>
        </div>
      </header>
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>رُبى العقارية · نموذج لشركة تطوير عقاري</p>
          <h1>تعرّف على مشاريعنا<span>في المدينة المنورة.</span></h1>
          <p className={styles.subtitle}>استعرض المشاريع السكنية والتجارية والمكتبية، وافتح تفاصيل المشروع الأقرب لاحتياجك.</p>
          <a className={styles.primary} href="#projects">استعرض المشاريع</a>
        </div>
      </section>
      <section id="projects" className={styles.section}>
        <div className={styles.wrap}>
          <h2>مشاريعنا</h2>
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <article className={styles.projectCard} key={project.name}>
                <div className={styles.projectBand}>
                  <p>{project.type}</p>
                  <h3>{project.name}</h3>
                </div>
                <div className={styles.projectBody}>
                  <p>{project.location}</p>
                  <p>{project.summary}</p>
                  <details>
                    <summary>تفاصيل المشروع</summary>
                    <p>{project.details}</p>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.cta}>
        <div className={styles.wrap}>
          <h2>اعرض مشاريع منشأتك بهذا القالب</h2>
          <a className={styles.primary} href="/offers/real-estate#offer">شاهد عرض الجمعة البيضاء</a>
        </div>
      </section>
    </main>
  );
}
