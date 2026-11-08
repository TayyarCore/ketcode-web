import type { Metadata } from "next";
import styles from "./page.module.css";

const offer = {
  price: "799",
  preview: "https://ketcode-sites-ks4b57kbq-tayyar.vercel.app",
  whatsapp: "966544008827",
};
const whatsapp = "https://wa.me/" + offer.whatsapp + "?text=" + encodeURIComponent("السلام عليكم، أريد حجز عرض Ketcode للمكاتب العقارية بسعر 799 ريال. اسم المنشأة: ");
export const metadata: Metadata = {
  title: "موقع لشركتك العقارية بـ 799 ريال | Ketcode",
  description: "موقع احترافي لشركات التسويق والوساطة العقارية: هوية مخصصة، خدمات واضحة، وتواصل مباشر عبر واتساب والهاتف والبريد. عرض محدود لأول 10 طلبات مؤهلة، والتجهيز خلال 72 ساعة بعد الدفع واستلام المحتوى المعتمد.",
  robots: {index: false, follow: false},
  openGraph: {
    title: "موقع شركتك العقارية بـ 799 ريال | Ketcode",
    description: "قالب عقاري جاهز للتخصيص. شاهد المعاينة ثم اطلب عرض أول 10 عملاء.",
    type: "website",
    locale: "ar_SA",
  },
};

const benefits = [
  {number:"01", title:"هوية باسم منشأتك", description:"اسم شركتك وشعارها وألوانها ومحتواها بدل الهوية التجريبية."},
  {number:"02", title:"خدماتك في واجهة واضحة", description:"صفحة عربية تعرض خدمات التسويق والوساطة والعقارات التي تعمل عليها منشأتك بوصفها، لا نظام إدارة عقارات."},
  {number:"03", title:"تواصل بنقرة واحدة", description:"ربط رقم واتساب المنشأة وهاتفها وبريدها الإلكتروني بعد التحقق منها."},
  {number:"04", title:"متوافق مع الجوال", description:"تصميم عربي باتجاه صحيح مع عرض متجاوب للهاتف والكمبيوتر."},
];
const steps = [
  {title:"شاهد المعاينة", description:"افتح النموذج الحالي لتعرف شكل موقعك قبل الطلب."},
  {title:"أرسل بيانات المنشأة", description:"الشعار واسم المنشأة والخدمات ووسائل التواصل والمحتوى المعتمد."},
  {title:"أكد نطاق العمل وادفع", description:"نراجع المطلوب ونرسل لك وسيلة دفع موثقة بعد تأكيد قبول الطلب."},
  {title:"نجهز الموقع", description:"خلال 72 ساعة بعد إتمام الدفع واستلام المحتوى المعتمد كاملًا."},
];
const questions = [
  {q:"هل يمكن عرض العقارات المتاحة؟", a:"هذه الباقة تعرض معلومات الشركة وخدماتها. قوائم العقارات الحية وتحديث حالة الحجوزات وربط تيار ليست مشمولة؛ يمكن بحثها كخدمة مستقلة لاحقًا."},
  {q:"هل الموقع يتضمن لوحة إدارة عقارات؟", a:"لا. الموقع واجهة تعريف وتسويق وتواصل، وليس نظام CRM أو إدارة وحدات أو عقود."},
  {q:"متى تبدأ الـ 72 ساعة؟", a:"بعد تأكيد نطاق الطلب واستلام الدفعة والمحتوى المعتمد المطلوب، وليس من وقت إرسال أول استفسار."},
  {q:"هل أستطيع طلب تصميم مختلف بالكامل؟", a:"عرض 799 ريال مخصص لتخصيص القالب المعروض، ولا يشمل تصميمًا مخصصًا من الصفر أو مزايا برمجية إضافية."},
  {q:"هل يشمل النطاق والاستضافة والتجديد؟", a:"يُحدَّد ما يخص النطاق والاستضافة والتجديد في عرض الطلب المكتوب قبل الدفع، ولا يفترض شمول خدمات لم تُتفق عليها."},
];
export default function RealEstateOfferPage() {
  return <main className={styles.page}>
    <div className={styles.notice}>عرض إطلاق محدود — لأول 10 طلبات مؤهلة بعد التأكيد</div>
    <header className={styles.header}>
      <div className={styles.wrap + " " + styles.nav}>
        <a href="/" className={styles.logo} aria-label="العودة إلى Ketcode">KET<span>CODE</span></a>
        <nav className={styles.links} aria-label="أقسام الصفحة"><a href="#included">ماذا يشمل</a><a href="#steps">طريقة العمل</a><a href="#faq">الأسئلة</a></nav>
        <a className={styles.navAction} href={whatsapp} rel="noopener noreferrer" target="_blank">اطلب موقعك</a>
      </div>
    </header>
    <section className={styles.hero}>
      <div className={styles.wrap + " " + styles.heroGrid}>
        <div>
          <p className={styles.eyebrow}>مخصص لشركات التسويق والوساطة العقارية</p>
          <h1>موقع عقاري احترافي <span>بهوية شركتك.</span></h1>
          <p className={styles.subtitle}>اعرض خدمات منشأتك بصورة منظمة، وسهّل على عملائك الوصول إليك عبر الهاتف وواتساب والبريد. نبدأ بقالب جاهز ونخصصه لعلامتك التجارية.</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href={whatsapp} target="_blank" rel="noopener noreferrer">اطلب عرض 799 ريال <span aria-hidden="true">↗</span></a>
            <a className={styles.secondary} href={offer.preview} target="_blank" rel="noopener noreferrer">شاهد القالب مباشرة <span aria-hidden="true">↗</span></a>
          </div>
          <p className={styles.small}>نموذج المعاينة تجريبي، ولا يستقبل طلبات العملاء. نخصّص وسائل التواصل عند إعداد موقعك.</p>
        </div>
        <div className={styles.offerCard} aria-label="تفاصيل العرض">
          <span className={styles.pill}>عرض إطلاق Ketcode</span>
          <div className={styles.priceRow}><strong>{offer.price}</strong><span>ريال سعودي<br/>السعر النهائي للعميل</span></div>
          <p className={styles.priceInfo}>سعر شامل لما ينطبق من رسوم وضرائب على هذه الباقة، دون مبالغ إضافية غير معتمدة.</p>
          <div className={styles.rule}/>
          <div className={styles.offerLine}><strong>72 ساعة</strong><span>للتجهيز بعد استكمال شروط البدء</span></div>
          <div className={styles.offerLine}><strong>قالب مخصص</strong><span>ليس تطويرًا برمجيًا من الصفر</span></div>
          <div className={styles.offerLine}><strong>10 عملاء</strong><span>سقف عرض الإطلاق، والتوافر يؤكد عند الطلب</span></div>
          <a href={offer.preview} className={styles.previewLink} target="_blank" rel="noopener noreferrer">فتح المعاينة الحية <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
    <section id="included" className={styles.section}><div className={styles.wrap}>
      <p className={styles.eyebrow}>باقة واضحة</p><h2>ماذا ستحصل عليه؟</h2>
      <p className={styles.sectionLead}>موقع تعريفي وتسويقي يقدم منشأتك بثقة، دون تعقيد تقني غير مطلوب.</p>
      <div className={styles.benefitGrid}>{benefits.map(b=><article key={b.number} className={styles.benefit}><span>{b.number}</span><h3>{b.title}</h3><p>{b.description}</p></article>)}</div>
    </div></section>
    <section className={styles.previewSection}><div className={styles.wrap + " " + styles.previewLayout}>
      <div><p className={styles.eyebrow}>شاهد قبل أن تقرر</p><h2>هذا شكل القالب الذي سنخصصه لك.</h2><p className={styles.sectionLead}>تصفّح النموذج من جوالك أو الكمبيوتر. بعد طلبك نستبدل بيانات المنشأة التجريبية باسمك وشعارك وخدماتك.</p><a className={styles.primary} href={offer.preview} target="_blank" rel="noopener noreferrer">افتح القالب التجريبي <span aria-hidden="true">↗</span></a></div>
      <div className={styles.mockup}><div className={styles.browserBar}><i/><i/><i/><small>Ketcode — Real Estate Office</small></div><div className={styles.mockupBody}><span>شركة عقارية</span><h3>عقارك يستحق عرضًا احترافيًا.</h3><p>وساطة وتسويق عقاري بهوية شركتك</p><div className={styles.mockupButton}>تواصل معنا</div></div></div>
    </div></section>
    <section id="steps" className={styles.section}><div className={styles.wrap}>
      <p className={styles.eyebrow}>خطوات بسيطة</p><h2>من الطلب إلى الموقع</h2>
      <div className={styles.steps}>{steps.map((s,i)=><article key={s.title} className={styles.step}><span>{String(i+1).padStart(2,"0")}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div>
    </div></section>
    <section className={styles.scope}><div className={styles.wrap + " " + styles.scopeGrid}>
      <div><p className={styles.eyebrow}>حتى يكون الاتفاق واضحًا</p><h2>ماذا لا يشمله السعر؟</h2><p>لا يشمل هذا العرض نظام إدارة العقارات أو العقود، مزامنة بيانات تيار، تحديث الوحدات تلقائيًا، أو برمجة متطلبات خاصة. أي خدمات إضافية أو تكاليف دورية تُوضح كتابةً قبل الدفع.</p></div>
      <div className={styles.scopeCard}><strong>المطلوب للبدء</strong><ul><li>اسم المنشأة والشعار المصرح باستخدامه</li><li>الخدمات والنصوص والصور المعتمدة</li><li>بيانات التواصل الصحيحة</li><li>التراخيص التي ترغب بإظهارها، بعد التحقق منها</li><li>تأكيد نطاق التنفيذ والدفع</li></ul></div>
    </div></section>
    <section id="faq" className={styles.section}><div className={styles.wrap + " " + styles.faqWrap}>
      <p className={styles.eyebrow}>إجابات سريعة</p><h2>الأسئلة الشائعة</h2>
      {questions.map(item=><details key={item.q} className={styles.faq}><summary>{item.q}</summary><p>{item.a}</p></details>)}
    </div></section>
    <section className={styles.cta}><div className={styles.wrap}>
      <p className={styles.eyebrow}>جاهز لموقع منشأتك؟</p><h2>اطلب قالب شركتك العقارية بسعر 799 ريال.</h2><p>سنراجع بيانات المنشأة ونؤكد نطاق التنفيذ وطريقة الدفع قبل بدء العمل.</p>
      <a className={styles.primary} href={whatsapp} rel="noopener noreferrer" target="_blank">تحدث مع Ketcode لطلب العرض <span aria-hidden="true">↗</span></a>
      <p className={styles.small}>هذا زر طلب ومحادثة، وليس دفعًا أو حجزًا مؤكدًا. لا تُدخل بيانات بطاقتك عبر واتساب.</p>
    </div></section>
    <footer className={styles.footer}><div className={styles.wrap}><strong>KET<span>CODE</span></strong><span>© 2026 Ketcode. جميع الحقوق محفوظة.</span><div><a href="/terms">الشروط</a><a href="/privacy">الخصوصية</a><a href="/refund">سياسة الاسترجاع</a></div></div></footer>
  </main>;
}
