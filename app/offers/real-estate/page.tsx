import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";

const offer = {
  price: "799",
  regularPrice: "990",
  saving: "191",
  officeTemplate: "/templates/office",
  projectsTemplate: "/offers/real-estate/projects",
};

const portal = "/portal";

export const metadata: Metadata = {
  title: "تصميم موقع عقاري لمكتبك وشركتك | 799 ريال | Ketcode",
  description: "تصميم موقع لمكتب عقاري أو شركة تسويق ووساطة عقارية: هوية منشأتك وخدماتها ومشاريعها وتواصل مباشر عبر واتساب. عرض الجمعة البيضاء 799 ريالاً لأول 10 عملاء.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "تصميم موقع لمكتبك العقاري | عرض الجمعة البيضاء من Ketcode",
    description: "موقع عقاري باسم منشأتك بـ 799 ريالاً. شاهد القالب قبل الطلب، وراجع المعاينة قبل الدفع.",
    type: "website",
    locale: "ar_SA",
  },
};

const facts = [
  { title: "هوية باسم منشأتك", text: "اسم شركتك وشعارها وألوانها ومحتواها بدل الهوية التجريبية." },
  { title: "خدماتك ومشاريعك", text: "صفحات تعريفية فيها صور ونبذة وطريقة واضحة للاستفسار." },
  { title: "تواصل بنقرة", text: "واتساب المنشأة وهاتفها وبريدها، بعد التحقق منها." },
  { title: "عربي ومتجاوب", text: "اتجاه عربي صحيح وعرض مرتب على الجوال والكمبيوتر." },
];

const challenges = [
  { title: "كيف يتعرف عليك العميل الجديد؟", text: "عندما يسمع باسم منشأتك، يحتاج مكانًا واضحًا يعرض هويتك وتخصصك." },
  { title: "معلومات متفرقة تزيد الحيرة", text: "الخدمات ووسائل الاتصال موزعة بين منشورات ورسائل وحسابات مختلفة." },
  { title: "رابط واحد يختصر الخطوات", text: "مكان مرتب للتعريف بالشركة وعرض خدماتها وتوجيه العميل إلى وسيلة التواصل المناسبة." },
];

const trust = [
  { title: "تشاهد قبل أن تدفع", text: "نجهّز معاينة كاملة باسم منشأتك، ولا تدفع إلا بعد أن تعتمدها." },
  { title: "اتفاق مكتوب قبل الدفع", text: "نطاق العمل وأي خدمات إضافية أو تكاليف دورية تُوضَّح كتابةً قبل أن تلتزم بشيء." },
  { title: "موقعك ومحتواك ملكك", text: "النصوص والصور وبيانات منشأتك ملكك، ويُسجَّل النطاق باسم منشأتك." },
  { title: "جاهز لمتطلبات الإعلان العقاري", text: "يعرض الموقع رخصة فال والسجل التجاري بعد التحقق منهما، ليثق بك عميلك من أول زيارة." },
  { title: "طلبك في صفحة واحدة", text: "مراحل التنفيذ والمعاينة والاعتماد في صفحة مشروعك على بوابة العملاء، دون رسائل متفرقة." },
];

const steps = [
  { title: "اختر القالب", text: "قالب منشآت التسويق العقاري أو قالب المطورين العقاريين." },
  { title: "سجّل طلبك", text: "ادخل البوابة ببريدك وأضف بيانات منشأتك وشعارها." },
  { title: "راجع المعاينة", text: "شاهد الموقع بهوية منشأتك وشاركنا ملاحظاتك." },
  { title: "اعتمد وادفع", text: "بعد اعتماد المعاينة يتم الدفع وننسّق معك النشر." },
];

const questions = [
  { q: "كم سعر تصميم موقع عقاري في هذا العرض؟", a: "799 ريالاً لتخصيص أحد القالبين المعروضين باسم منشأتك. الخدمات الإضافية تُسعّر بعد الاتفاق عليها كتابةً." },
  { q: "كيف تظهر المشاريع على الموقع؟", a: "يعرض قالب المشاريع صورًا ونبذة وموقعًا لكل مشروع باستخدام المحتوى المتفق عليه. قوائم الوحدات الحية والحجوزات وربط تيار خارج نطاق الباقة." },
  { q: "هل الموقع يتضمن لوحة إدارة عقارات؟", a: "لا. الموقع واجهة تعريف وتسويق وتواصل، وليس نظام CRM أو إدارة وحدات أو عقود." },
  { q: "هل يمكن ربط الموقع بنظام CRM؟", a: "نعم، كخدمة إضافية: نضيف إلى موقعك نموذج طلب ونربطه بنظام CRM الذي تستخدمه، فتصل طلبات العملاء إليه مباشرة بدل أن تضيع بين الرسائل. يُسعّر الربط بعد مراجعة النظام، وليس ضمن عرض 799." },
  { q: "هل تقدمون خدمات أخرى مثل الشات بوت أو إدارة الحملات؟", a: "تركيزنا في هذا العرض على موقع منشأتك. إن كان لديك احتياج إضافي، اسأل المساعد في هذه الصفحة ونوضح لك كتابةً ما نستطيع تقديمه." },
  { q: "كيف أعرف موعد التسليم؟", a: "ننسّق معك موعد التسليم بعد مراجعة محتوى الموقع وتأكيد نطاق العمل." },
  { q: "هل أستطيع طلب تصميم مختلف بالكامل؟", a: "العرض يشمل تخصيص أحد القالبين المعروضين، ولا يشمل تصميمًا من الصفر أو مزايا برمجية إضافية." },
  { q: "هل يشمل النطاق والاستضافة والتجديد؟", a: "يُحدَّد ما يخص النطاق والاستضافة والتجديد في عرض الطلب المكتوب قبل الدفع، ولا يُفترض شمول خدمات لم يُتفق عليها." },
];

export default function RealEstateOfferPage() {
  return <main className={styles.page}>
    <link rel="stylesheet" href="/assets/chat-widget.css" precedence="default" />
    <Script src="/assets/chat-widget.js" strategy="lazyOnload" />
    <div className={styles.notice}>قريبًا: عرض الجمعة البيضاء لأول 10 مكاتب عقارية</div>
    <header className={styles.header}>
      <div className={styles.wrap + " " + styles.nav}>
        <Link href="/" className={styles.logo} aria-label="العودة إلى Ketcode">KetCode</Link>
        <nav className={styles.links} aria-label="أقسام الصفحة"><a href="#templates">القوالب</a><a href="#why">لماذا نحن</a><a href="#steps">طريقة العمل</a><a href="#faq">الأسئلة</a></nav>
        <a className={styles.navAction} href={portal}>ابدأ طلبك</a>
      </div>
    </header>

    <section className={styles.hero}>
      <div className={styles.wrap + " " + styles.heroGrid}>
        <div>
          <p className={styles.eyebrow}>لشركات التسويق والوساطة العقارية</p>
          <h1>تصميم موقع لمكتبك العقاري، جاهز باسم منشأتك.</h1>
          <p className={styles.subtitle}>موقع يجمع خدماتك ومشاريعك وطرق التواصل في رابط واحد. شاركه مع عملائك، وخلّ الاستفسار عنك أسهل.</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href={portal}>ابدأ طلبك الآن</a>
            <a className={styles.secondary} href="#templates">شاهد القوالب</a>
          </div>
          <p className={styles.small}>تسجّل ببريدك في دقيقة، وتراجع المعاينة باسم منشأتك قبل أن تدفع.</p>
        </div>
        <div id="offer" className={styles.priceCard} aria-label="سعر عرض الجمعة البيضاء">
          <h2>عرض الجمعة البيضاء</h2>
          <p className={styles.regularPrice}>السعر الأساسي <del><bdi>{offer.regularPrice}</bdi> ريال</del></p>
          <div className={styles.priceRow}><strong><bdi>{offer.price}</bdi></strong><span>ريال سعودي</span></div>
          <span className={styles.saving}>وفّر {offer.saving} ريال</span>
          <ul className={styles.offerList}>
            <li><strong>معاينة قبل الدفع</strong><span>بهوية منشأتك</span></li>
            <li><strong>قالب مخصص</strong><span>اسمك وشعارك وخدماتك</span></li>
            <li><strong>لأول 10 عملاء</strong><span>عند فتح الطلبات</span></li>
          </ul>
          <p className={styles.priceInfo}>تُسعّر الخدمات الإضافية بشكل مستقل بعد الاتفاق عليها كتابةً.</p>
        </div>
      </div>
    </section>

    <section className={styles.section + " " + styles.band}><div className={styles.wrap}>
      <div className={styles.sectionHead}><h2>ماذا ستحصل عليه؟</h2><p>موقع تعريفي وتسويقي يقدّم منشأتك بثقة، دون تعقيد تقني غير مطلوب.</p></div>
      <div className={styles.facts}>{facts.map((f) => <div key={f.title} className={styles.fact}><h3>{f.title}</h3><p>{f.text}</p></div>)}</div>
    </div></section>

    <section className={styles.section}><div className={styles.wrap + " " + styles.problem}>
      <div><h2>قبل أن يتواصل معك، يحتاج سببًا ليثق بك.</h2><p style={{marginTop: "1rem"}}>حين يسأل العميل عن خدماتك أو أحد مشاريعك، أرسل له رابطًا يجيب عن أسئلته ويتيح له التواصل معك مباشرة.</p></div>
      <ul>{challenges.map((c) => <li key={c.title}><strong>{c.title}</strong><span>{c.text}</span></li>)}</ul>
    </div></section>

    <section id="templates" className={styles.section} style={{paddingTop: 0}}><div className={styles.wrap}>
      <div className={styles.sectionHead}><h2>اختر القالب المناسب لنشاطك</h2><p>نخصّص القالب الذي تختاره باسم منشأتك وشعارها ومحتواها.</p></div>
      <div className={styles.templateGrid}>
        <article className={styles.template}>
          <div className={styles.templateTop + " " + styles.templateOffice}>منشآت التسويق العقاري</div>
          <div className={styles.templateBody}><p>يعرّف بمكتبك وخدماته ويتيح للعميل التواصل مباشرة.</p>
            <a className={styles.primary} href={offer.officeTemplate} target="_blank" rel="noopener noreferrer">شاهد قالب المكتب</a></div>
        </article>
        <article className={styles.template}>
          <div className={styles.templateTop + " " + styles.templateProjects}>منشآت المطورين العقاريين</div>
          <div className={styles.templateBody}><p>صفحة تجمع مشاريعك مع نبذة وتفاصيل لكل مشروع.</p>
            <Link className={styles.primary} href={offer.projectsTemplate}>شاهد قالب المشاريع</Link></div>
        </article>
      </div>
    </div></section>

    <section id="steps" className={styles.section + " " + styles.band}><div className={styles.wrap}>
      <div className={styles.sectionHead}><h2>من الطلب إلى الموقع</h2><p>تبدأ بقالب تراه، وتدفع بعد أن تعتمد المعاينة باسم منشأتك.</p></div>
      <ol className={styles.steps}>{steps.map((s) => <li key={s.title} className={styles.step}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
    </div></section>

    <section id="why" className={styles.section}><div className={styles.wrap + " " + styles.problem}>
      <div><h2>لماذا Ketcode؟</h2><p style={{marginTop: "1rem"}}>نبني موقعك بطريقة تحمي قرارك: ترى العمل قبل الدفع، وتعرف ما تدفع مقابله، ويبقى ما تملكه باسمك.</p></div>
      <ul>{trust.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}</ul>
    </div></section>

    <section className={styles.section}><div className={styles.wrap + " " + styles.scopeGrid}>
      <div><h2>ماذا لا يشمله السعر؟</h2><p>لا يشمل هذا العرض نظام إدارة العقارات أو العقود، مزامنة بيانات تيار، تحديث الوحدات تلقائيًا، أو برمجة متطلبات خاصة. ربط الموقع بنظام CRM متاح كخدمة إضافية. أي خدمات إضافية أو تكاليف دورية تُوضح كتابةً قبل الدفع.</p></div>
      <div className={styles.scopeCard}><strong>المطلوب للبدء</strong><ul><li>اسم المنشأة والشعار المصرح باستخدامه</li><li>الخدمات والنصوص والصور المعتمدة</li><li>بيانات التواصل الصحيحة</li><li>رخصة فال والتراخيص التي ترغب بإظهارها، بعد التحقق منها</li><li>تأكيد نطاق التنفيذ والدفع</li></ul></div>
    </div></section>

    <section id="faq" className={styles.section} style={{paddingTop: 0}}><div className={styles.wrap + " " + styles.faqWrap}>
      <h2>الأسئلة الشائعة</h2>
      <div>
        {questions.map((item) => <details key={item.q} className={styles.faq}><summary>{item.q}</summary><p>{item.a}</p></details>)}
        <details className={styles.faq}>
          <summary>من وين أحجز دومين سعودي؟</summary>
          <p>تقدر تحجز دومين سعودي من <a href="https://souqt2.sa/Home" target="_blank" rel="noopener noreferrer">سوق التقنية</a> أو <a href="https://www.massarcloud.sa/ar/landing/sa-domains" target="_blank" rel="noopener noreferrer">مسار كلاود</a>.</p>
        </details>
      </div>
    </div></section>

    <section className={styles.cta}><div className={styles.wrap + " " + styles.ctaGrid}>
      <div><h2>موقع مكتبك العقاري بـ 799 ريالاً.</h2><p>السعر الأساسي 990 ريالاً، وعرض الجمعة البيضاء 799 ريالاً لأول 10 عملاء.</p></div>
      <div className={styles.heroActions}><a className={styles.primary} href={portal}>ابدأ طلبك الآن</a></div>
    </div></section>

    <footer className={styles.footer}><div className={styles.wrap}><strong>KetCode</strong><span>© 2026 Ketcode. جميع الحقوق محفوظة.</span><div><a href="/terms">الشروط</a><a href="/privacy">الخصوصية</a><a href="/refund">سياسة الاسترجاع</a></div></div></footer>
  </main>;
}
