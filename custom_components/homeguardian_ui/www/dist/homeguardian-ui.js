var HomeGuardianUI=function(t){"use strict";class e{constructor(){this.ingressUrl=this.detectIngressUrl(),this.baseUrl=`${this.ingressUrl}/api`,this.log("Initialized with baseUrl:",this.baseUrl)}detectIngressUrl(){const t=window.location.pathname.match(/\/api\/hassio_ingress\/([^/]+)/);if(t){return`/api/hassio_ingress/${t[1]}`}if(window.homeGuardianAddonSlug){return`/api/hassio_ingress/${window.homeGuardianAddonSlug}`}return"/api/hassio_ingress/a0d7b954_homeguardian"}async request(t,e={}){try{const i=`${this.baseUrl}${t}`;this.log("Request:",i,e);const o=await fetch(i,{...e,headers:{"Content-Type":"application/json",...e.headers}});if(!o.ok)throw new Error(`HTTP ${o.status}: ${o.statusText}`);const s=await o.json();return this.log("Response:",s),{success:!0,data:s}}catch(t){return this.error("Request failed:",t),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}async getItems(t){const e=t?`/items?type=${t}`:"/items";return this.request(e)}async getItem(t,e){return this.request(`/items/${t}/${e}`)}async getHistory(t,e,i=5){return this.request(`/history/${t}/${e}?limit=${i}`)}async getFileHistory(t,e=5){const i=encodeURIComponent(t);return this.request(`/git/history?file=${i}&limit=${e}`)}async getCommitDiff(t){return this.request(`/git/diff/${t}`)}async rollback(t){return this.request("/rollback",{method:"POST",body:JSON.stringify(t)})}async getGitStatus(){return this.request("/git/status")}async ping(){try{return(await fetch(`${this.baseUrl}/status`)).ok}catch{return!1}}log(...t){this.isDebugEnabled()&&console.log("[HomeGuardian API]",...t)}error(...t){console.error("[HomeGuardian API]",...t)}isDebugEnabled(){return"true"===localStorage.getItem("homeguardian_debug")}}let i=null;function o(){return i||(i=new e),i}class s{constructor(){this.apiClient=o(),this.injectedIcons=new Map,this.isRunning=!1,this.observer=new MutationObserver(t=>{this.handleMutations(t)})}start(){this.isRunning?this.log("Already running"):(this.log("Starting icon injection"),this.isRunning=!0,this.observer.observe(document.body,{childList:!0,subtree:!0}),this.checkCurrentPage(),window.addEventListener("hashchange",()=>this.checkCurrentPage()),window.addEventListener("popstate",()=>this.checkCurrentPage()))}stop(){this.log("Stopping icon injection"),this.isRunning=!1,this.observer.disconnect()}handleMutations(t){for(const e of t)"childList"===e.type&&e.addedNodes.forEach(t=>{t.nodeType===Node.ELEMENT_NODE&&this.checkElement(t)})}async checkCurrentPage(){this.log("Checking current page:",window.location.pathname),await this.waitForPageStability();const t=[{name:"automation-list",fn:()=>this.injectAutomationListIcons()},{name:"automation-info",fn:()=>this.injectAutomationInfoIcon()},{name:"script-list",fn:()=>this.injectScriptListIcons()},{name:"script-info",fn:()=>this.injectScriptInfoIcon()},{name:"scene-list",fn:()=>this.injectSceneListIcons()},{name:"dashboard-list",fn:()=>this.injectDashboardListIcons()}];for(const e of t)try{await e.fn()}catch(t){this.error(`Failed to inject ${e.name} icon:`,t)}}async waitForPageStability(t=10,e=100){for(let i=0;i<t;i++){const t=e*Math.pow(1.5,i);await new Promise(e=>setTimeout(e,t));if(document.querySelector("home-assistant, ha-panel-lovelace, partial-panel-resolver"))return void this.log("Page ready after",t,"ms")}this.error("Page stability timeout - proceeding anyway")}checkElement(t){t.matches("ha-automation-picker, ha-data-table")&&this.injectAutomationListIcons(),t.matches("ha-script-picker")&&this.injectScriptListIcons(),t.matches("ha-scene-picker")&&this.injectSceneListIcons(),t.matches("ha-config-automation-info, ha-config-script-info")&&this.injectAutomationInfoIcon()}async injectAutomationListIcons(){this.log("Injecting automation list icons");const t=document.querySelectorAll("ha-data-table tr[data-automation-id], ha-data-table .mdc-data-table__row, .automation-row");if(0!==t.length)for(const e of t){const t=e.getAttribute("data-automation-id")||e.querySelector("[data-entity-id]")?.getAttribute("data-entity-id")||e.querySelector(".name, .title")?.textContent?.trim();if(!t)continue;const i=e.querySelector(".name, .title, mwc-list-item");i&&!i.querySelector(".homeguardian-icon-container")&&await this.injectIcon(i,"automation",t,`automation-list-${t}`)}else this.log("No automation rows found")}async injectAutomationInfoIcon(){this.log("Injecting automation info icon");const t=this.getAutomationIdFromURL();if(!t)return;const e=["ha-config-automation-info .header",".automation-header .title","h1, h2, .name"];for(const i of e){const e=document.querySelector(i);if(e&&!e.querySelector(".homeguardian-icon-container")){await this.injectIcon(e,"automation",t,"automation-info");break}}}async injectScriptListIcons(){this.log("Injecting script list icons");const t=document.querySelectorAll("ha-data-table tr[data-script-id], ha-data-table .mdc-data-table__row, .script-row");for(const e of t){const t=e.getAttribute("data-script-id")||e.querySelector("[data-entity-id]")?.getAttribute("data-entity-id")||e.querySelector(".name, .title")?.textContent?.trim();if(!t)continue;const i=e.querySelector(".name, .title, mwc-list-item");i&&!i.querySelector(".homeguardian-icon-container")&&await this.injectIcon(i,"script",t,`script-list-${t}`)}}async injectScriptInfoIcon(){this.log("Injecting script info icon");const t=this.getScriptIdFromURL();if(!t)return;const e=["ha-config-script-info .header",".script-header .title","h1, h2, .name"];for(const i of e){const e=document.querySelector(i);if(e&&!e.querySelector(".homeguardian-icon-container")){await this.injectIcon(e,"script",t,"script-info");break}}}async injectSceneListIcons(){this.log("Injecting scene list icons");const t=document.querySelectorAll("ha-data-table tr[data-scene-id], ha-data-table .mdc-data-table__row, .scene-row");for(const e of t){const t=e.getAttribute("data-scene-id")||e.querySelector("[data-entity-id]")?.getAttribute("data-entity-id")||e.querySelector(".name, .title")?.textContent?.trim();if(!t)continue;const i=e.querySelector(".name, .title, mwc-list-item");i&&!i.querySelector(".homeguardian-icon-container")&&await this.injectIcon(i,"scene",t,`scene-list-${t}`)}}async injectDashboardListIcons(){this.log("Injecting dashboard list icons");const t=document.querySelectorAll(".dashboard-card, [data-dashboard-id]");for(const e of t){const t=e.getAttribute("data-dashboard-id")||e.querySelector(".name, .title")?.textContent?.trim();if(!t)continue;const i=e.querySelector(".name, .title");i&&!i.querySelector(".homeguardian-icon-container")&&await this.injectIcon(i,"dashboard",t,`dashboard-list-${t}`)}}async injectIcon(t,e,i,o){if(this.injectedIcons.has(o))return;const s=await this.getVersionCount(e,i),n=this.createHistoryIcon(s,e,i,o),r=t.parentElement;r&&(r.style.display="flex",r.style.alignItems="center",r.style.gap="8px",r.appendChild(n),this.injectedIcons.set(o,{entityType:e,entityId:i,versionCount:s,isLoading:!1,hasError:!1,iconElement:n}),this.log(`Injected icon for ${e}:${i}`))}async getVersionCount(t,e){try{const i=await this.apiClient.getHistory(t,e,1);if(i.success&&i.data)return i.data.versionCount}catch(t){this.error("Failed to get version count:",t)}return 0}createHistoryIcon(t,e,i,o){const s=document.createElement("div");s.className="homeguardian-icon-container",s.setAttribute("data-icon-key",o),s.style.cssText="\n      display: inline-flex;\n      align-items: center;\n      gap: 4px;\n      cursor: pointer;\n      padding: 4px 8px;\n      border-radius: 4px;\n      background: var(--primary-color);\n      color: var(--text-primary-color);\n      font-size: 12px;\n      transition: all 0.2s;\n    ";const n=document.createElement("ha-icon");n.setAttribute("icon","mdi:history"),n.style.cssText="--mdc-icon-size: 16px;";const r=document.createElement("span");return r.textContent=t>0?t.toString():"0",r.style.cssText="\n      font-weight: 500;\n      font-size: 11px;\n    ",s.appendChild(n),s.appendChild(r),s.addEventListener("mouseenter",()=>{s.style.opacity="0.9",s.style.transform="scale(1.05)"}),s.addEventListener("mouseleave",()=>{s.style.opacity="1",s.style.transform="scale(1)"}),s.addEventListener("click",t=>{t.stopPropagation(),this.showHistoryPopup(e,i)}),s}showHistoryPopup(t,e){this.log(`Opening history popup for ${t}:${e}`);const i=document.createElement("ha-dialog");i.setAttribute("open",""),i.style.cssText="--mdc-dialog-max-width: 800px;";const o=document.createElement("homeguardian-history-popup");o.setAttribute("entity-type",t),o.setAttribute("entity-id",e),o.setAttribute("entity-name",e),o.addEventListener("close",()=>{i.close(),i.remove()}),i.appendChild(o),document.body.appendChild(i)}getAutomationIdFromURL(){const t=window.location.pathname.match(/\/config\/automation\/(?:edit|show|info)\/(.+)/);return t?decodeURIComponent(t[1]):null}getScriptIdFromURL(){const t=window.location.pathname.match(/\/config\/script\/(?:edit|show|info)\/(.+)/);return t?decodeURIComponent(t[1]):null}getSceneIdFromURL(){const t=window.location.pathname.match(/\/config\/scene\/(?:edit|show|info)\/(.+)/);return t?decodeURIComponent(t[1]):null}getDashboardIdFromURL(){const t=window.location.pathname.match(/\/lovelace\/(.+)/);return t?t[1]:"default"}log(...t){this.isDebugEnabled()&&console.log("[HomeGuardian IconInjector]",...t)}error(...t){console.error("[HomeGuardian IconInjector]",...t)}isDebugEnabled(){return"true"===localStorage.getItem("homeguardian_debug")}}const n="8.0.0";function r(t,e,i,o){var s,n=arguments.length,r=n<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(r=(n<3?s(r):n>3?s(e,i,r):s(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const a=globalThis,c=a.ShadowRoot&&(void 0===a.ShadyCSS||a.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,l=Symbol(),h=new WeakMap;let d=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==l)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(c&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=h.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&h.set(e,t))}return t}toString(){return this.cssText}};const u=c?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new d("string"==typeof t?t:t+"",void 0,l))(e)})(t):t,{is:p,defineProperty:m,getOwnPropertyDescriptor:g,getOwnPropertyNames:y,getOwnPropertySymbols:f,getPrototypeOf:$}=Object,b=globalThis,v=b.trustedTypes,_=v?v.emptyScript:"",A=b.reactiveElementPolyfillSupport,w=(t,e)=>t,S={toAttribute(t,e){switch(e){case Boolean:t=t?_:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},E=(t,e)=>!p(t,e),C={attribute:!0,type:String,converter:S,reflect:!1,useDefault:!1,hasChanged:E};Symbol.metadata??=Symbol("metadata"),b.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=C){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&m(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:s}=g(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const n=o?.call(this);s?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??C}static _$Ei(){if(this.hasOwnProperty(w("elementProperties")))return;const t=$(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(w("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(w("properties"))){const t=this.properties,e=[...y(t),...f(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(u(t))}else void 0!==t&&e.push(u(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(c)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of e){const e=document.createElement("style"),o=a.litNonce;void 0!==o&&e.setAttribute("nonce",o),e.textContent=i.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:S).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:S;this._$Em=o;const n=s.fromAttribute(e,t.type);this[o]=n??this._$Ej?.get(o)??n,this._$Em=null}}requestUpdate(t,e,i){if(void 0!==t){const o=this.constructor,s=this[t];if(i??=o.getPropertyOptions(t),!((i.hasChanged??E)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:s},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==s||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[w("elementProperties")]=new Map,x[w("finalized")]=new Map,A?.({ReactiveElement:x}),(b.reactiveElementVersions??=[]).push("2.1.1");const I=globalThis,U=I.trustedTypes,P=U?U.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",j=`lit$${Math.random().toFixed(9).slice(2)}$`,H="?"+j,R=`<${H}>`,T=document,L=()=>T.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,q="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,z=/>/g,B=RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),G=/'/g,F=/"/g,V=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),J=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),Z=new WeakMap,Q=T.createTreeWalker(T,129);function X(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==P?P.createHTML(e):e}const Y=(t,e)=>{const i=t.length-1,o=[];let s,n=2===e?"<svg>":3===e?"<math>":"",r=N;for(let e=0;e<i;e++){const i=t[e];let a,c,l=-1,h=0;for(;h<i.length&&(r.lastIndex=h,c=r.exec(i),null!==c);)h=r.lastIndex,r===N?"!--"===c[1]?r=D:void 0!==c[1]?r=z:void 0!==c[2]?(V.test(c[2])&&(s=RegExp("</"+c[2],"g")),r=B):void 0!==c[3]&&(r=B):r===B?">"===c[0]?(r=s??N,l=-1):void 0===c[1]?l=-2:(l=r.lastIndex-c[2].length,a=c[1],r=void 0===c[3]?B:'"'===c[3]?F:G):r===F||r===G?r=B:r===D||r===z?r=N:(r=B,s=void 0);const d=r===B&&t[e+1].startsWith("/>")?" ":"";n+=r===N?i+R:l>=0?(o.push(a),i.slice(0,l)+k+i.slice(l)+j+d):i+j+(-2===l?e:d)}return[X(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class tt{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let s=0,n=0;const r=t.length-1,a=this.parts,[c,l]=Y(t,e);if(this.el=tt.createElement(c,i),Q.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Q.nextNode())&&a.length<r;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(k)){const e=l[n++],i=o.getAttribute(t).split(j),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:s,name:r[2],strings:i,ctor:"."===r[1]?nt:"?"===r[1]?rt:"@"===r[1]?at:st}),o.removeAttribute(t)}else t.startsWith(j)&&(a.push({type:6,index:s}),o.removeAttribute(t));if(V.test(o.tagName)){const t=o.textContent.split(j),e=t.length-1;if(e>0){o.textContent=U?U.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],L()),Q.nextNode(),a.push({type:2,index:++s});o.append(t[e],L())}}}else if(8===o.nodeType)if(o.data===H)a.push({type:2,index:s});else{let t=-1;for(;-1!==(t=o.data.indexOf(j,t+1));)a.push({type:7,index:s}),t+=j.length-1}s++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}}function et(t,e,i=t,o){if(e===J)return e;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const n=O(e)?void 0:e._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(t),s._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(e=et(t,s._$AS(t,e.values),s,o)),e}class it{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??T).importNode(e,!0);Q.currentNode=o;let s=Q.nextNode(),n=0,r=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new ot(s,s.nextSibling,this,t):1===a.type?e=new a.ctor(s,a.name,a.strings,this,t):6===a.type&&(e=new ct(s,this,t)),this._$AV.push(e),a=i[++r]}n!==a?.index&&(s=Q.nextNode(),n++)}return Q.currentNode=T,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class ot{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=et(this,t,e),O(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==J&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=tt.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new it(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Z.get(t.strings);return void 0===e&&Z.set(t.strings,e=new tt(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const s of t)o===e.length?e.push(i=new ot(this.O(L()),this.O(L()),this,this.options)):i=e[o],i._$AI(s),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,s){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(t,e=this,i,o){const s=this.strings;let n=!1;if(void 0===s)t=et(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==J,n&&(this._$AH=t);else{const o=t;let r,a;for(t=s[0],r=0;r<s.length-1;r++)a=et(this,o[i+r],e,r),a===J&&(a=this._$AH[r]),n||=!O(a)||a!==this._$AH[r],a===K?t=K:t!==K&&(t+=(a??"")+s[r+1]),this._$AH[r]=a}n&&!o&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class nt extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class rt extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class at extends st{constructor(t,e,i,o,s){super(t,e,i,o,s),this.type=5}_$AI(t,e=this){if((t=et(this,t,e,0)??K)===J)return;const i=this._$AH,o=t===K&&i!==K||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==K&&(i===K||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ct{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){et(this,t)}}const lt=I.litHtmlPolyfillSupport;lt?.(tt,ot),(I.litHtmlVersions??=[]).push("3.3.1");const ht=globalThis;class dt extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let s=o._$litPart$;if(void 0===s){const t=i?.renderBefore??null;o._$litPart$=s=new ot(e.insertBefore(L(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return J}}dt._$litElement$=!0,dt.finalized=!0,ht.litElementHydrateSupport?.({LitElement:dt});const ut=ht.litElementPolyfillSupport;ut?.({LitElement:dt}),(ht.litElementVersions??=[]).push("4.2.1");const pt={attribute:!0,type:String,converter:S,reflect:!1,hasChanged:E},mt=(t=pt,e,i)=>{const{kind:o,metadata:s}=i;let n=globalThis.litPropertyMetadata.get(s);if(void 0===n&&globalThis.litPropertyMetadata.set(s,n=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,s,t)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];e.call(this,i),this.requestUpdate(o,s,t)}}throw Error("Unsupported decorator location: "+o)};function gt(t){return(e,i)=>"object"==typeof i?mt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function yt(t){return gt({...t,state:!0,attribute:!1})}let ft=class extends dt{constructor(){super(...arguments),this.history=[],this.isLoading=!0,this.error=null,this.selectedCommit=null,this.diffContent=null,this.isRollingBack=!1,this.apiClient=o()}connectedCallback(){super.connectedCallback(),this.loadHistory()}async loadHistory(){this.isLoading=!0,this.error=null;const t=await this.apiClient.getHistory(this.entityType,this.entityId,10);t.success&&t.data?this.history=t.data.history:this.error=t.error||"Failed to load history",this.isLoading=!1}async selectCommit(t){this.selectedCommit=t,this.diffContent=null;const e=await this.apiClient.getCommitDiff(t);e.success&&e.data&&(this.diffContent=e.data)}async handleRollback(){if(!this.selectedCommit)return;if(!confirm(`Are you sure you want to restore "${this.entityName}" to this version?\n\nA safety backup will be created automatically.`))return;this.isRollingBack=!0;const t=await this.apiClient.rollback({entityType:this.entityType,entityId:this.entityId,commitHash:this.selectedCommit,createBackup:!0});this.isRollingBack=!1,t.success&&t.data?(alert(`✅ Successfully restored to version ${this.selectedCommit.substring(0,7)}`),this.close(),window.location.reload()):alert(`❌ Rollback failed: ${t.error}`)}close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}formatDate(t){const e=new Date(t),i=(new Date).getTime()-e.getTime(),o=Math.floor(i/6e4),s=Math.floor(i/36e5),n=Math.floor(i/864e5);return o<60?`${o} min${1!==o?"s":""} ago`:s<24?`${s} hour${1!==s?"s":""} ago`:n<7?`${n} day${1!==n?"s":""} ago`:e.toLocaleDateString()}renderHistoryItem(t){const e=this.selectedCommit===t.commit.hash;return W`
      <li
        class="history-item ${e?"selected":""}"
        @click=${()=>this.selectCommit(t.commit.hash)}
      >
        <div class="commit-header">
          <span class="commit-hash">${t.commit.hash.substring(0,7)}</span>
          <span class="commit-date">${this.formatDate(t.commit.date)}</span>
        </div>
        <div class="commit-message">${t.commit.message}</div>
        <div class="commit-author">by ${t.commit.author}</div>
      </li>
    `}render(){return W`
      <div class="popup-header">
        <div class="popup-title">
          <ha-icon icon="mdi:history"></ha-icon>
          <span>Version History: ${this.entityName}</span>
        </div>
        <button class="close-button" @click=${this.close}>
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </div>

      <div class="popup-content">
        ${this.isLoading?W`<div class="loading">Loading history...</div>`:this.error?W`<div class="error">${this.error}</div>`:0===this.history.length?W`<div class="empty-state">No version history available</div>`:W`
              <ul class="history-list">
                ${this.history.map(t=>this.renderHistoryItem(t))}
              </ul>

              ${this.diffContent?W`
                    <div class="diff-viewer">
                      <div class="diff-content">${this.diffContent}</div>
                    </div>
                  `:""}

              ${this.selectedCommit?W`
                    <div class="action-buttons">
                      <button
                        class="btn btn-primary"
                        @click=${this.handleRollback}
                        ?disabled=${this.isRollingBack}
                      >
                        ${this.isRollingBack?"Restoring...":"Restore This Version"}
                      </button>
                      <button
                        class="btn btn-secondary"
                        @click=${()=>{this.selectedCommit=null,this.diffContent=null}}
                      >
                        Cancel
                      </button>
                    </div>
                  `:""}
            `}
      </div>
    `}};function $t(t){const e=setInterval(()=>{document.querySelector("home-assistant, ha-panel-lovelace")&&(clearInterval(e),console.log("[HomeGuardian UI] Home Assistant ready, starting icon injection"),t.start())},500);setTimeout(()=>{clearInterval(e),console.warn("[HomeGuardian UI] Timeout waiting for Home Assistant to be ready"),t.start()},3e4)}return ft.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new d(i,t,l)})`
    :host {
      display: block;
      font-family: var(--primary-font-family);
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
    }

    .popup-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: var(--primary-text-color);
      opacity: 0.6;
    }

    .close-button:hover {
      opacity: 1;
    }

    .popup-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }

    .loading,
    .error {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text-color);
    }

    .error {
      color: var(--error-color);
    }

    .history-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .history-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .history-item:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }

    .history-item.selected {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: var(--text-primary-color);
    }

    .commit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .commit-hash {
      font-family: monospace;
      font-size: 12px;
      opacity: 0.7;
    }

    .commit-date {
      font-size: 12px;
      opacity: 0.7;
    }

    .commit-message {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .commit-author {
      font-size: 12px;
      opacity: 0.7;
    }

    .diff-viewer {
      margin-top: 16px;
      padding: 12px;
      background: var(--code-editor-background-color, #1e1e1e);
      border-radius: 4px;
      overflow-x: auto;
    }

    .diff-content {
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      color: #d4d4d4;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-secondary {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text-color);
    }

    ha-icon {
      --mdc-icon-size: 20px;
    }
  `,r([gt({type:String})],ft.prototype,"entityType",void 0),r([gt({type:String})],ft.prototype,"entityId",void 0),r([gt({type:String})],ft.prototype,"entityName",void 0),r([yt()],ft.prototype,"history",void 0),r([yt()],ft.prototype,"isLoading",void 0),r([yt()],ft.prototype,"error",void 0),r([yt()],ft.prototype,"selectedCommit",void 0),r([yt()],ft.prototype,"diffContent",void 0),r([yt()],ft.prototype,"isRollingBack",void 0),ft=r([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("homeguardian-history-popup")],ft),console.log(`%c HomeGuardian UI %c v${n} `,"background: #4CAF50; color: white; font-weight: bold;","background: #333; color: white;"),async function(){console.log("[HomeGuardian UI] Initializing...");const t=o();await t.ping()||console.warn("[HomeGuardian UI] HomeGuardian add-on is not responding. Icon injection will be disabled until the add-on is started.");const e=new s;"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{$t(e)}):$t(e),window.homeGuardianUI={injector:e,apiClient:t,version:n,enableDebug:()=>{localStorage.setItem("homeguardian_debug","true"),console.log("[HomeGuardian UI] Debug logging enabled")},disableDebug:()=>{localStorage.removeItem("homeguardian_debug"),console.log("[HomeGuardian UI] Debug logging disabled")}}}().catch(t=>{console.error("[HomeGuardian UI] Initialization failed:",t)}),t.IconInjector=s,t.getApiClient=o,t}({});
//# sourceMappingURL=homeguardian-ui.js.map
