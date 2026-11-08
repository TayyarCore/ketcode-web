// Run: node --test templates/marketing-office/template.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "template.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
function preview(config) {
  const nodes = new Map();
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    if (nodes.has(id)) throw new Error("Duplicate HTML id: " + id);
    nodes.set(id, {
      textContent: "", href: "", hidden: true, src: "", alt: "",
      children: [], append(...n) { this.children.push(...n); },
      className: ""
    });
  }
  const styleVars = {};
  const metadata = { content: "" };
  const document = {
    title: "",
    documentElement: { style: { setProperty(k, v) { styleVars[k] = v; } } },
    getElementById(id) { return nodes.get(id) || null; },
    querySelector(selector) {
      if (selector !== 'meta[name="description"]') throw new Error("Unexpected selector");
      return { setAttribute(key, value) { assert.equal(key,"content");metadata.content=value; } };
    },
    createElement() { return { className:"", textContent:"", children:[], append(...n){this.children.push(...n);} }; }
  };
  vm.runInNewContext(js, {window:{KETCODE_CUSTOMER:config}, document});
  return {nodes, document, styleVars, metadata, el(id){return nodes.get(id);}};
}
const clientA = {
  name:"مكتب الأفق", tagline:"نبني الثقة", description:"مكتب تسويق عقاري",
  city:"المدينة المنورة",primaryColor:"#123456",accentColor:"#abcdef",
  email:"office@example.com",phone:"966500000000",whatsapp:"966500000000",
  address:"شارع تجريبي",registrationNumber:"",falLicense:"",
  services:[{title:"الوساطة",description:"تقديم الوساطة"}]
};
test("preview is noindex, responsive and standalone",()=>{
  assert.match(html,/noindex,nofollow/);
  assert.match(css,/@media\(max-width:800px\)/);
  assert.doesNotMatch(html+js,/nwahel\.sa|نواهل|hello@tayyar\.app|api\/contact|<form/i);
});
test("all referenced HTML IDs exist exactly once",()=>{
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,id] of js.matchAll(/\$\("([^"]+)"\)/g))assert.ok(ids.includes(id),"missing "+id);
});
test("customer identity, services and verified links follow client config",()=>{
  const r=preview(clientA);
  assert.equal(r.el("brand").textContent,clientA.name);
  assert.equal(r.el("hero-name").textContent,clientA.name);
  assert.equal(r.el("about-description").textContent,clientA.description);
  assert.equal(r.document.title,clientA.name+" | التسويق والوساطة العقارية");
  assert.equal(r.metadata.content,clientA.description);
  assert.equal(r.styleVars["--brand"],"#123456");
  assert.equal(r.el("services-list").children.length,1);
  assert.equal(r.el("email-link").hidden,false);
  assert.match(r.el("email-link").href,/^mailto:/);
  assert.equal(r.el("whatsapp-link").href,"https://wa.me/966500000000");
  assert.equal(r.el("phone-link").href,"tel:+966500000000");
});
test("unconfigured customer fails closed without contact destinations",()=>{
 const b={...clientA,name:"شركة تجريبية أخرى",email:"",phone:"",whatsapp:"",
 services:[{title:"تسويق",description:"خدمة تجريبية"}]};
 const r=preview(b);
 assert.equal(r.el("brand").textContent,b.name);
 assert.equal(r.el("email-link").hidden,true);
 assert.equal(r.el("whatsapp-link").hidden,true);
 assert.equal(r.el("phone-link").hidden,true);
 assert.match(r.el("contact-status").textContent,/غير مهيأة/);
 assert.equal(r.el("services-list").children.length,1);
 assert.doesNotMatch(r.document.title,/الأفق/);
});
test("invalid colors and logos are not trusted",()=>{
 const r=preview({...clientA,primaryColor:"red;position:absolute",accentColor:"blue",logoUrl:"https://external.example/logo.svg"});
 assert.equal(r.styleVars["--brand"],"#003B4A");
 assert.equal(r.styleVars["--accent"],"#AF8F6E");
 assert.equal(r.el("brand-logo").hidden,true);
});
