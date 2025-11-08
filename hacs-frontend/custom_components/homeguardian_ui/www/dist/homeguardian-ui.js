var HomeGuardianUI=function(t){"use strict";class e{constructor(){this.ingressUrl=this.detectIngressUrl(),this.baseUrl=`${this.ingressUrl}/api`,this.log("Initialized with baseUrl:",this.baseUrl)}detectIngressUrl(){const t=window.location.pathname.match(/\/api\/hassio_ingress\/([^/]+)/);if(t){return`/api/hassio_ingress/${t[1]}`}if(window.homeGuardianAddonSlug){return`/api/hassio_ingress/${window.homeGuardianAddonSlug}`}return"/api/hassio_ingress/a0d7b954_homeguardian"}async request(t,e={}){try{const i=`${this.baseUrl}${t}`;this.log("Request:",i,e);const s=await fetch(i,{...e,headers:{"Content-Type":"application/json",...e.headers}});if(!s.ok)throw new Error(`HTTP ${s.status}: ${s.statusText}`);const o=await s.json();return this.log("Response:",o),{success:!0,data:o}}catch(t){return this.error("Request failed:",t),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}async getItems(t){const e=t?`/items?type=${t}`:"/items";return this.request(e)}async getItem(t,e){return this.request(`/items/${t}/${e}`)}async getHistory(t,e,i=5){return this.request(`/history/${t}/${e}?limit=${i}`)}async getFileHistory(t,e=5){const i=encodeURIComponent(t);return this.request(`/git/history?file=${i}&limit=${e}`)}async getCommitDiff(t){return this.request(`/git/diff/${t}`)}async rollback(t){return this.request("/rollback",{method:"POST",body:JSON.stringify(t)})}async getGitStatus(){return this.request("/git/status")}async ping(){try{return(await fetch(`${this.baseUrl}/status`)).ok}catch{return!1}}log(...t){this.isDebugEnabled()&&console.log("[HomeGuardian API]",...t)}error(...t){console.error("[HomeGuardian API]",...t)}isDebugEnabled(){return"true"===localStorage.getItem("homeguardian_debug")}}let i=null;function s(){return i||(i=new e),i}class o{constructor(){this.apiClient=s(),this.injectedIcons=new Map,this.isRunning=!1,this.observer=new MutationObserver(t=>{this.handleMutations(t)})}start(){this.isRunning?this.log("Already running"):(this.log("Starting icon injection"),this.isRunning=!0,this.observer.observe(document.body,{childList:!0,subtree:!0}),this.checkCurrentPage(),window.addEventListener("hashchange",()=>this.checkCurrentPage()),window.addEventListener("popstate",()=>this.checkCurrentPage()))}stop(){this.log("Stopping icon injection"),this.isRunning=!1,this.observer.disconnect()}handleMutations(t){for(const e of t)"childList"===e.type&&e.addedNodes.forEach(t=>{t.nodeType===Node.ELEMENT_NODE&&this.checkElement(t)})}async checkCurrentPage(){this.log("Checking current page:",window.location.pathname),await this.waitForPageStability();const t=[{name:"automation",fn:()=>this.injectAutomationIcon()},{name:"script",fn:()=>this.injectScriptIcon()},{name:"scene",fn:()=>this.injectSceneIcon()},{name:"blueprint",fn:()=>this.injectBlueprintIcon()},{name:"blueprint-list",fn:()=>this.injectBlueprintListIcons()},{name:"voice-assistant",fn:()=>this.injectVoiceAssistantIcons()},{name:"dashboard",fn:()=>this.injectDashboardIcons()}];for(const e of t)try{await e.fn()}catch(t){this.error(`Failed to inject ${e.name} icon:`,t)}}async waitForPageStability(t=10,e=100){for(let i=0;i<t;i++){const t=e*Math.pow(1.5,i);await new Promise(e=>setTimeout(e,t));if(document.querySelector("home-assistant, ha-panel-lovelace, partial-panel-resolver"))return void this.log("Page ready after",t,"ms")}this.error("Page stability timeout - proceeding anyway")}checkElement(t){t.matches("ha-config-automation")&&this.injectAutomationIcon(),t.matches("ha-config-script")&&this.injectScriptIcon(),t.matches("ha-config-scene")&&this.injectSceneIcon(),t.matches("ha-blueprint-editor")&&this.injectBlueprintIcon(),t.matches("hui-view, hui-panel-view")&&this.injectDashboardIcons()}async injectAutomationIcon(){const t=["ha-config-automation .header .name",'ha-config-automation mwc-button[slot="toolbar-icon"]',"ha-config-automation .toolbar .title"];for(const e of t){const t=document.querySelector(e);if(t){const e=this.getAutomationIdFromURL();if(e){await this.injectIcon(t,"automation",e,"automation-icon");break}}}}async injectScriptIcon(){const t=["ha-config-script .header .name",'ha-config-script mwc-button[slot="toolbar-icon"]',"ha-config-script .toolbar .title"];for(const e of t){const t=document.querySelector(e);if(t){const e=this.getScriptIdFromURL();if(e){await this.injectIcon(t,"script",e,"script-icon");break}}}}async injectSceneIcon(){const t=["ha-config-scene .header .name",'ha-config-scene mwc-button[slot="toolbar-icon"]',"ha-config-scene .toolbar .title"];for(const e of t){const t=document.querySelector(e);if(t){const e=this.getSceneIdFromURL();if(e){await this.injectIcon(t,"scene",e,"scene-icon");break}}}}async injectBlueprintIcon(){const t=["ha-blueprint-editor .header .name",'ha-blueprint-editor mwc-button[slot="toolbar-icon"]'];for(const e of t){const t=document.querySelector(e);if(t){const e=this.getBlueprintIdFromURL();if(e){await this.injectIcon(t,"blueprint",e,"blueprint-icon");break}}}}async injectBlueprintListIcons(){const t=document.querySelectorAll(".blueprint-row, [data-blueprint-id]");for(const e of t){const t=e.querySelector(".name, .title"),i=e.getAttribute("data-blueprint-id");t&&i&&await this.injectIcon(t,"blueprint",i,`blueprint-list-icon-${i}`)}}async injectVoiceAssistantIcons(){const t=document.querySelectorAll(".pipeline-row, [data-pipeline-id]");for(const e of t){const t=e.querySelector(".name, .title"),i=e.getAttribute("data-pipeline-id");t&&i&&await this.injectIcon(t,"voice_assistant",i,`voice-assistant-icon-${i}`)}}async injectDashboardIcons(){const t=document.querySelectorAll('hui-view mwc-icon-button[title*="Edit"], hui-panel-view mwc-icon-button[title*="Edit"]');for(const e of t){const t=this.getDashboardIdFromURL();t&&await this.injectIcon(e,"dashboard",t,"dashboard-icon")}}async injectIcon(t,e,i,s){if(this.injectedIcons.has(s))return;const o=await this.getVersionCount(e,i),n=this.createHistoryIcon(o,e,i,s),r=t.parentElement;r&&(r.style.display="flex",r.style.alignItems="center",r.style.gap="8px",r.appendChild(n),this.injectedIcons.set(s,{entityType:e,entityId:i,versionCount:o,isLoading:!1,hasError:!1,iconElement:n}),this.log(`Injected icon for ${e}:${i}`))}async getVersionCount(t,e){try{const i=await this.apiClient.getHistory(t,e,1);if(i.success&&i.data)return i.data.versionCount}catch(t){this.error("Failed to get version count:",t)}return 0}createHistoryIcon(t,e,i,s){const o=document.createElement("div");o.className="homeguardian-icon-container",o.setAttribute("data-icon-key",s),o.style.cssText="\n      display: inline-flex;\n      align-items: center;\n      gap: 4px;\n      cursor: pointer;\n      padding: 4px 8px;\n      border-radius: 4px;\n      background: var(--primary-color);\n      color: var(--text-primary-color);\n      font-size: 12px;\n      transition: all 0.2s;\n    ";const n=document.createElement("ha-icon");n.setAttribute("icon","mdi:history"),n.style.cssText="--mdc-icon-size: 16px;";const r=document.createElement("span");return r.textContent=t>0?t.toString():"0",r.style.cssText="\n      font-weight: 500;\n      font-size: 11px;\n    ",o.appendChild(n),o.appendChild(r),o.addEventListener("mouseenter",()=>{o.style.opacity="0.9",o.style.transform="scale(1.05)"}),o.addEventListener("mouseleave",()=>{o.style.opacity="1",o.style.transform="scale(1)"}),o.addEventListener("click",t=>{t.stopPropagation(),this.showHistoryPopup(e,i)}),o}showHistoryPopup(t,e){this.log(`Opening history popup for ${t}:${e}`);const i=document.createElement("ha-dialog");i.setAttribute("open",""),i.style.cssText="--mdc-dialog-max-width: 800px;";const s=document.createElement("homeguardian-history-popup");s.setAttribute("entity-type",t),s.setAttribute("entity-id",e),s.setAttribute("entity-name",e),s.addEventListener("close",()=>{i.close(),i.remove()}),i.appendChild(s),document.body.appendChild(i)}getAutomationIdFromURL(){const t=window.location.pathname.match(/\/config\/automation\/edit\/(.+)/);return t?decodeURIComponent(t[1]):null}getScriptIdFromURL(){const t=window.location.pathname.match(/\/config\/script\/edit\/(.+)/);return t?decodeURIComponent(t[1]):null}getSceneIdFromURL(){const t=window.location.pathname.match(/\/config\/scene\/edit\/(.+)/);return t?decodeURIComponent(t[1]):null}getBlueprintIdFromURL(){const t=window.location.pathname.match(/\/config\/blueprint\/edit\/(.+)/);return t?decodeURIComponent(t[1]):null}getDashboardIdFromURL(){const t=window.location.pathname.match(/\/lovelace\/(.+)/);return t?t[1]:"default"}log(...t){this.isDebugEnabled()&&console.log("[HomeGuardian IconInjector]",...t)}error(...t){console.error("[HomeGuardian IconInjector]",...t)}isDebugEnabled(){return"true"===localStorage.getItem("homeguardian_debug")}}function n(t,e,i,s){var o,n=arguments.length,r=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(r=(n<3?o(r):n>3?o(e,i,r):o(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const r=globalThis,a=r.ShadowRoot&&(void 0===r.ShadyCSS||r.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,c=Symbol(),l=new WeakMap;let h=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==c)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(a&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=l.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&l.set(e,t))}return t}toString(){return this.cssText}};const d=a?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new h("string"==typeof t?t:t+"",void 0,c))(e)})(t):t,{is:p,defineProperty:u,getOwnPropertyDescriptor:m,getOwnPropertyNames:g,getOwnPropertySymbols:y,getPrototypeOf:f}=Object,$=globalThis,b=$.trustedTypes,v=b?b.emptyScript:"",_=$.reactiveElementPolyfillSupport,A=(t,e)=>t,w={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},E=(t,e)=>!p(t,e),S={attribute:!0,type:String,converter:w,reflect:!1,useDefault:!1,hasChanged:E};Symbol.metadata??=Symbol("metadata"),$.litPropertyMetadata??=new WeakMap;let C=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=S){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&u(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=m(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);o?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??S}static _$Ei(){if(this.hasOwnProperty(A("elementProperties")))return;const t=f(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(A("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(A("properties"))){const t=this.properties,e=[...g(t),...y(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(d(t))}else void 0!==t&&e.push(d(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(a)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of e){const e=document.createElement("style"),s=r.litNonce;void 0!==s&&e.setAttribute("nonce",s),e.textContent=i.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:w).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:w;this._$Em=s;const n=o.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i){if(void 0!==t){const s=this.constructor,o=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??E)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==o||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[A("elementProperties")]=new Map,C[A("finalized")]=new Map,_?.({ReactiveElement:C}),($.reactiveElementVersions??=[]).push("2.1.1");const x=globalThis,I=x.trustedTypes,U=I?I.createPolicy("lit-html",{createHTML:t=>t}):void 0,P="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,H="?"+k,R=`<${H}>`,j=document,T=()=>j.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,L=Array.isArray,M="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,q=/>/g,z=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,F=/"/g,G=/^(?:script|style|textarea|title)$/i,V=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),J=Symbol.for("lit-nothing"),K=new WeakMap,Z=j.createTreeWalker(j,129);function Q(t,e){if(!L(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==U?U.createHTML(e):e}const X=(t,e)=>{const i=t.length-1,s=[];let o,n=2===e?"<svg>":3===e?"<math>":"",r=N;for(let e=0;e<i;e++){const i=t[e];let a,c,l=-1,h=0;for(;h<i.length&&(r.lastIndex=h,c=r.exec(i),null!==c);)h=r.lastIndex,r===N?"!--"===c[1]?r=D:void 0!==c[1]?r=q:void 0!==c[2]?(G.test(c[2])&&(o=RegExp("</"+c[2],"g")),r=z):void 0!==c[3]&&(r=z):r===z?">"===c[0]?(r=o??N,l=-1):void 0===c[1]?l=-2:(l=r.lastIndex-c[2].length,a=c[1],r=void 0===c[3]?z:'"'===c[3]?F:B):r===F||r===B?r=z:r===D||r===q?r=N:(r=z,o=void 0);const d=r===z&&t[e+1].startsWith("/>")?" ":"";n+=r===N?i+R:l>=0?(s.push(a),i.slice(0,l)+P+i.slice(l)+k+d):i+k+(-2===l?e:d)}return[Q(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Y{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,n=0;const r=t.length-1,a=this.parts,[c,l]=X(t,e);if(this.el=Y.createElement(c,i),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Z.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(P)){const e=l[n++],i=s.getAttribute(t).split(k),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:r[2],strings:i,ctor:"."===r[1]?ot:"?"===r[1]?nt:"@"===r[1]?rt:st}),s.removeAttribute(t)}else t.startsWith(k)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(G.test(s.tagName)){const t=s.textContent.split(k),e=t.length-1;if(e>0){s.textContent=I?I.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),Z.nextNode(),a.push({type:2,index:++o});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===H)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(k,t+1));)a.push({type:7,index:o}),t+=k.length-1}o++}}static createElement(t,e){const i=j.createElement("template");return i.innerHTML=t,i}}function tt(t,e,i=t,s){if(e===W)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const n=O(e)?void 0:e._$litDirective$;return o?.constructor!==n&&(o?._$AO?.(!1),void 0===n?o=void 0:(o=new n(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=tt(t,o._$AS(t,e.values),o,s)),e}class et{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??j).importNode(e,!0);Z.currentNode=s;let o=Z.nextNode(),n=0,r=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new it(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new at(o,this,t)),this._$AV.push(e),a=i[++r]}n!==a?.index&&(o=Z.nextNode(),n++)}return Z.currentNode=j,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class it{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=J,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=tt(this,t,e),O(t)?t===J||null==t||""===t?(this._$AH!==J&&this._$AR(),this._$AH=J):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>L(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==J&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(j.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Y.createElement(Q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new et(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new Y(t)),e}k(t){L(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new it(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=J,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=J}_$AI(t,e=this,i,s){const o=this.strings;let n=!1;if(void 0===o)t=tt(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==W,n&&(this._$AH=t);else{const s=t;let r,a;for(t=o[0],r=0;r<o.length-1;r++)a=tt(this,s[i+r],e,r),a===W&&(a=this._$AH[r]),n||=!O(a)||a!==this._$AH[r],a===J?t=J:t!==J&&(t+=(a??"")+o[r+1]),this._$AH[r]=a}n&&!s&&this.j(t)}j(t){t===J?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ot extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===J?void 0:t}}class nt extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==J)}}class rt extends st{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=tt(this,t,e,0)??J)===W)return;const i=this._$AH,s=t===J&&i!==J||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==J&&(i===J||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){tt(this,t)}}const ct=x.litHtmlPolyfillSupport;ct?.(Y,it),(x.litHtmlVersions??=[]).push("3.3.1");const lt=globalThis;class ht extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new it(e.insertBefore(T(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ht._$litElement$=!0,ht.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ht});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ht}),(lt.litElementVersions??=[]).push("4.2.1");const pt={attribute:!0,type:String,converter:w,reflect:!1,hasChanged:E},ut=(t=pt,e,i)=>{const{kind:s,metadata:o}=i;let n=globalThis.litPropertyMetadata.get(o);if(void 0===n&&globalThis.litPropertyMetadata.set(o,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function gt(t){return mt({...t,state:!0,attribute:!1})}let yt=class extends ht{constructor(){super(...arguments),this.history=[],this.isLoading=!0,this.error=null,this.selectedCommit=null,this.diffContent=null,this.isRollingBack=!1,this.apiClient=s()}connectedCallback(){super.connectedCallback(),this.loadHistory()}async loadHistory(){this.isLoading=!0,this.error=null;const t=await this.apiClient.getHistory(this.entityType,this.entityId,10);t.success&&t.data?this.history=t.data.history:this.error=t.error||"Failed to load history",this.isLoading=!1}async selectCommit(t){this.selectedCommit=t,this.diffContent=null;const e=await this.apiClient.getCommitDiff(t);e.success&&e.data&&(this.diffContent=e.data)}async handleRollback(){if(!this.selectedCommit)return;if(!confirm(`Are you sure you want to restore "${this.entityName}" to this version?\n\nA safety backup will be created automatically.`))return;this.isRollingBack=!0;const t=await this.apiClient.rollback({entityType:this.entityType,entityId:this.entityId,commitHash:this.selectedCommit,createBackup:!0});this.isRollingBack=!1,t.success&&t.data?(alert(`✅ Successfully restored to version ${this.selectedCommit.substring(0,7)}`),this.close(),window.location.reload()):alert(`❌ Rollback failed: ${t.error}`)}close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}formatDate(t){const e=new Date(t),i=(new Date).getTime()-e.getTime(),s=Math.floor(i/6e4),o=Math.floor(i/36e5),n=Math.floor(i/864e5);return s<60?`${s} min${1!==s?"s":""} ago`:o<24?`${o} hour${1!==o?"s":""} ago`:n<7?`${n} day${1!==n?"s":""} ago`:e.toLocaleDateString()}renderHistoryItem(t){const e=this.selectedCommit===t.commit.hash;return V`
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
    `}render(){return V`
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
        ${this.isLoading?V`<div class="loading">Loading history...</div>`:this.error?V`<div class="error">${this.error}</div>`:0===this.history.length?V`<div class="empty-state">No version history available</div>`:V`
              <ul class="history-list">
                ${this.history.map(t=>this.renderHistoryItem(t))}
              </ul>

              ${this.diffContent?V`
                    <div class="diff-viewer">
                      <div class="diff-content">${this.diffContent}</div>
                    </div>
                  `:""}

              ${this.selectedCommit?V`
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
    `}};function ft(t){const e=setInterval(()=>{document.querySelector("home-assistant, ha-panel-lovelace")&&(clearInterval(e),console.log("[HomeGuardian UI] Home Assistant ready, starting icon injection"),t.start())},500);setTimeout(()=>{clearInterval(e),console.warn("[HomeGuardian UI] Timeout waiting for Home Assistant to be ready"),t.start()},3e4)}return yt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new h(i,t,c)})`
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
  `,n([mt({type:String})],yt.prototype,"entityType",void 0),n([mt({type:String})],yt.prototype,"entityId",void 0),n([mt({type:String})],yt.prototype,"entityName",void 0),n([gt()],yt.prototype,"history",void 0),n([gt()],yt.prototype,"isLoading",void 0),n([gt()],yt.prototype,"error",void 0),n([gt()],yt.prototype,"selectedCommit",void 0),n([gt()],yt.prototype,"diffContent",void 0),n([gt()],yt.prototype,"isRollingBack",void 0),yt=n([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("homeguardian-history-popup")],yt),console.log("%c HomeGuardian UI %c v1.0.0 ","background: #4CAF50; color: white; font-weight: bold;","background: #333; color: white;"),async function(){console.log("[HomeGuardian UI] Initializing...");const t=s();await t.ping()||console.warn("[HomeGuardian UI] HomeGuardian add-on is not responding. Icon injection will be disabled until the add-on is started.");const e=new o;"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{ft(e)}):ft(e),window.homeGuardianUI={injector:e,apiClient:t,version:"1.0.0",enableDebug:()=>{localStorage.setItem("homeguardian_debug","true"),console.log("[HomeGuardian UI] Debug logging enabled")},disableDebug:()=>{localStorage.removeItem("homeguardian_debug"),console.log("[HomeGuardian UI] Debug logging disabled")}}}().catch(t=>{console.error("[HomeGuardian UI] Initialization failed:",t)}),t.IconInjector=o,t.getApiClient=s,t}({});
//# sourceMappingURL=homeguardian-ui.js.map
