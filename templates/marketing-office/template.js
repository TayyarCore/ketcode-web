(() => {
"use strict";
const p = window.KETCODE_CUSTOMER;
if (!p || typeof p !== "object") throw new Error("Customer configuration is required");
const $ = (id) => document.getElementById(id);
const text = (id, value) => { const el=$(id); if (el) el.textContent=String(value || ""); };
const safeColor = (v, fallback) => /^#[a-fA-F0-9]{6}$/.test(String(v || "")) ? v : fallback;
const digits = v => String(v || "").replace(/[^0-9]/g,"");
const email = String(p.email || "").trim();
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const whats = digits(p.whatsapp);
const phone = digits(p.phone);
document.documentElement.style.setProperty("--brand",safeColor(p.primaryColor,"#003B4A"));
document.documentElement.style.setProperty("--accent",safeColor(p.accentColor,"#AF8F6E"));
document.title = (p.name || "موقع عقاري") + " | التسويق والوساطة العقارية";
document.querySelector('meta[name="description"]').setAttribute("content",String(p.description || ""));
text("brand",p.name); text("hero-name",p.name); text("tagline",p.tagline);
text("description",p.description); text("city",p.city); text("company-footer",p.name);
text("about-description",p.description); text("contact-address",p.address);
const logo=$("brand-logo");
if (p.logoUrl && /^\/(?!\/)[^\s]*$/.test(p.logoUrl)) {
 logo.src=p.logoUrl;logo.alt="شعار "+(p.name||"المنشأة");logo.hidden=false;
}
const services=$("services-list");
(p.services||[]).slice(0,6).forEach((s,i)=>{
 if (!s || typeof s.title!=="string" || typeof s.description!=="string")return;
 const card=document.createElement("article");card.className="service-card";
 const n=document.createElement("span");n.className="service-number";n.textContent=String(i+1).padStart(2,"0");
 const heading=document.createElement("h3");heading.textContent=s.title;
 const desc=document.createElement("p");desc.textContent=s.description;
 card.append(n,heading,desc);services.append(card);
});
const emailLink=$("email-link");
if(validEmail) {emailLink.href="mailto:"+encodeURIComponent(email);emailLink.hidden=false;text("email-value",email);}
const whatsappLink=$("whatsapp-link");
if(whats.length>=10 && whats.length<=15){whatsappLink.href="https://wa.me/"+whats;whatsappLink.hidden=false;}
const phoneLink=$("phone-link");
if(phone.length>=10 && phone.length<=15){phoneLink.href="tel:+"+phone;phoneLink.hidden=false;text("phone-value","+"+phone);}
const license=$("license");
if(p.falLicense) {license.textContent="ترخيص فال: "+p.falLicense;license.hidden=false;}
const registration=$("registration");
if(p.registrationNumber){registration.textContent="رقم السجل: "+p.registrationNumber;registration.hidden=false;}
if(!validEmail && !(whats.length>=10) && !(phone.length>=10)) {
 $("contact-status").textContent="وسائل التواصل غير مهيأة في هذه المعاينة — لا يتم استقبال الطلبات.";
}
text("year",new Date().getFullYear());
})();