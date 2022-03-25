import{r as s,j as e,a as t,L as h,P as C,X as F,M as H,F as u,C as A,b as U,c as W,G as E,d as D,I,e as M,f as N,g as x,A as L,h as R,i as P,k as q,l as b,S as Q,m as X,u as T,n as Z,o as J,R as O,p,q as Y,s as G,B as V}from"./vendor.cd55d8c2.js";const K=function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))_(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&_(r)}).observe(document,{childList:!0,subtree:!0});function o(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerpolicy&&(a.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?a.credentials="include":n.crossorigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function _(n){if(n.ep)return;n.ep=!0;const a=o(n);fetch(n.href,a)}};K();function $({info:i}){const[c,o]=s.exports.useState(!1);return s.exports.useEffect(()=>{window.innerWidth<1100?o(!1):o(!0),window.addEventListener("resize",()=>{window.innerWidth<1100?o(!1):o(!0)})},[]),e("div",{className:"header",children:t("div",{className:"header__wrapper",children:[t(h,{to:"/",onClick:()=>{document.getElementById("home").checked=!0},className:"header__wrapper__logo",children:[e("span",{children:"M"}),e("div",{children:"ehfooz-ur-rehman"})]}),t("div",{className:"header__wrapper__menu",children:[t("div",{className:"header__wrapper__nav__phone",children:[e(C,{size:20,color:"currentColor"}),e("span",{children:i.number})]}),e("div",{className:"header__wrapper__nav__bar"}),e("button",{title:"menu button",className:"header__wrapper__menu__btn",onClick:()=>{o(!c)},children:c?e(F,{size:20,color:"currentColor"}):e(H,{size:20,color:"currentColor"})})]}),c?e(ee,{setIsNavOpen:o}):null]})})}function ee({setIsNavOpen:i}){return t("div",{className:"header__wrapper__nav",children:[e(k,{to:"/",id:"home",setIsNavOpen:i,children:"Home"}),e(k,{toSection:"about__section",id:"about",setIsNavOpen:i,children:"About Us"}),e(k,{toSection:"services__section",id:"services",setIsNavOpen:i,children:"Services"}),e(k,{to:"/portfolio",id:"portfolio",setIsNavOpen:i,children:"Portfolio"}),e(k,{to:"/contact",id:"contact",setIsNavOpen:i,children:"Contact"}),e("div",{className:"header__wrapper__nav__bar"}),t("div",{className:"header__wrapper__nav__phone",children:[e(C,{size:20,color:"currentColor"}),e("span",{children:"+92 313 7178074"})]})]})}function te(){const[i,c]=s.exports.useState(""),[o,_]=s.exports.useState(""),[n,a]=s.exports.useState(""),[r,m]=s.exports.useState(""),[f,d]=s.exports.useState(!1);s.exports.useEffect(()=>{setTimeout(()=>{d(!1)},1e3)},[f]);function v(l){l.preventDefault(),N.post("https://mehfooz-ur-rehman.herokuapp.com/api/v1/set_contact",{name:i,email:o,subject:n,message:r}).then(()=>{c(""),_(""),a(""),m(""),d(!0),window.scrollTo({top:0,behavior:"smooth"})}).catch(y=>{console.log("contact error:"+y)})}return t(u,{children:[f?e("div",{className:"screen__popup",children:t("div",{className:"screen__popup__content",children:[e(A,{size:50,color:"currentColor"}),e("div",{className:"screen__popup__content__heading",children:"Successfully Sent"})]})}):null,t("div",{className:"contact__section",children:[t("div",{className:"contact__section__left",children:[t("div",{className:"contact__section__left__sub__heading",children:[e("div",{className:"contact__section__left__sub__heading__bar"}),"Contact Me"]}),e("div",{className:"contact__section__left__heading",children:"Contact With Me"}),e("div",{className:"contact__section__left__info",children:"Let's build you simple, beautiful and intuitive solutions"}),t("div",{className:"contact__section__left__link",children:[e("div",{className:"contact__section__left__link__icon",children:e(U,{size:20,color:"currentColor"})}),e("span",{children:"Samundri - Faisalabad - Pakistan"})]}),t("div",{className:"contact__section__left__link",children:[e("div",{className:"contact__section__left__link__icon",children:e(W,{size:20,color:"currentColor"})}),e("span",{children:"mehfoozijaz786@gmail.com"})]}),t("div",{className:"contact__section__left__link",children:[e("div",{className:"contact__section__left__link__icon",children:e(C,{size:20,color:"currentColor"})}),e("span",{children:"+92 313 7178074"})]}),t("div",{className:"contact__section__left__socials",children:[e("a",{href:"https://github.com/MehfoozurRehman",className:"contact__section__left__socials__link",children:e(E,{size:20,color:"currentColor"})}),e("a",{href:"https://web.facebook.com/MehfoozurRehmanIjaz/",className:"contact__section__left__socials__link",children:e(D,{size:20,color:"currentColor"})}),e("a",{href:"https://www.instagram.com/mehfoozurrehman___/",className:"contact__section__left__socials__link",children:e(I,{size:20,color:"currentColor"})}),e("a",{href:"https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/",className:"contact__section__left__socials__link",children:e(M,{size:20,color:"currentColor"})})]})]}),t("form",{onSubmit:v,className:"contact__section__right",children:[e("div",{className:"contact__section__right__label",children:"Name"}),e("input",{type:"text",placeholder:"Name",className:"contact__section__right__input__box",value:i,onChange:l=>{c(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Email Address"}),e("input",{type:"text",placeholder:"Email Address",className:"contact__section__right__input__box",value:o,onChange:l=>{_(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Subject"}),e("input",{type:"text",placeholder:"Subject",className:"contact__section__right__input__box",value:n,onChange:l=>{a(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Message"}),e("textarea",{placeholder:"Message",rows:"10",className:"contact__section__right__input__area",value:r,onChange:l=>{m(l.target.value)},required:!0}),e("button",{title:"Send",className:"contact__section__right__btn",children:"Send"})]})]})]})}function g({children:i,defaultChecked:c,onClick:o}){return t("div",{className:"header__wrapper__nav__link",children:[e("input",{type:"radio",defaultChecked:c,className:"header__wrapper__nav__link__input",name:"portfolio__filters__input",onClick:o}),e("div",{className:"header__wrapper__nav__link__content",children:i})]})}function S({data:i,filter:c}){const[o,_]=s.exports.useState([]);s.exports.useEffect(()=>{N.get(i.languages&&i.languages,{Authorization:"Bearer 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"}).then(a=>{_(a.data)})},[]);let n;return i.category.map(a=>{n=a.value===c}),e(u,{children:c===""?t(h,{to:"/project-detail",state:{state:i},onClick:()=>{window.scrollTo({top:0,behavior:"smooth"})},className:"project__card",children:[e("div",{className:"project__card__name",children:i.name}),e("div",{className:"project__card__description",children:i.description}),e("div",{className:"project__card__languages",children:JSON.stringify(o).replace(/[0-9]/g,"").replace(/"/g,"").replace(/:/g,"").replace(/,/g,", ").replace(/}/g,"").replace(/{/g,"").split(", ").map(a=>e("div",{className:"project__card__languages__entry",children:a}))}),e(x,{publicId:i.image,alt:i.image,className:"project__card__image"})]}):c!=""&&n?t(h,{to:"/project-detail",state:{state:i},onClick:()=>{window.scrollTo({top:0,behavior:"smooth"})},className:"project__card",children:[e("div",{className:"project__card__name",children:i.name}),e("div",{className:"project__card__description",children:i.description}),e("div",{className:"project__card__languages",children:JSON.stringify(o).replace(/[0-9]/g,"").replace(/"/g,"").replace(/:/g,"").replace(/,/g,", ").replace(/}/g,"").replace(/{/g,"").split(", ").map(a=>e("div",{className:"project__card__languages__entry",children:a}))}),e(x,{publicId:i.image,alt:i.image,className:"project__card__image"})]}):null})}function ie(){return e("div",{className:"footer",children:t("div",{className:"footer__wrapper",children:[t("div",{className:"footer__top",children:[t("div",{className:"footer__wrapper__nav",children:[e(h,{to:"/",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),document.getElementById("home").checked=!0},className:"footer__wrapper__nav__link",children:"Home"}),e(h,{to:"/",onClick:()=>{document.getElementById("about__section").scrollIntoView(),document.getElementById("about").checked=!0},className:"footer__wrapper__nav__link",children:"About Us"}),e(h,{to:"/",onClick:()=>{document.getElementById("services__section").scrollIntoView(),document.getElementById("services").checked=!0},className:"footer__wrapper__nav__link",children:"Services"}),e(h,{to:"/portfolio",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),document.getElementById("portfolio").checked=!0},className:"footer__wrapper__nav__link",children:"Portfolio"}),e(h,{to:"/contact",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),document.getElementById("contact").checked=!0},className:"footer__wrapper__nav__link",children:"Contact"})]}),e("button",{title:"Back to top",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"})},className:"footer__wrapper__backtotop",children:e(L,{size:20,color:"currentColor"})})]}),e("div",{className:"footer__bottom",children:"@2022 - copyright right reserved"})]})})}function w({name:i,icon:c}){return t("div",{className:"service__card",children:[c,e("div",{className:"service__card__heading",children:i})]})}function ce({data:i}){function c(o="",_=0){return o.substring(0,_)}return t("div",{className:"testimonials__card",children:[t("div",{className:"testimonials__card__header",children:[e("div",{className:"testimonials__card__header__box",children:e("img",{src:R(i.email,{size:200}),alt:"pic",className:"testimonials__card__header__box__img"})}),t("div",{className:"testimonials__card__header__content",children:[e("div",{className:"testimonials__card__header__content__heading",children:i.name}),e("div",{className:"testimonials__card__header__content__sub__heading",children:i.designation})]})]}),e("div",{className:"testimonials__card__header__info",children:c(i.message,250)})]})}function ne(){const[i,c]=s.exports.useState("");s.exports.useState("");const[o,_]=s.exports.useState([]);return s.exports.useEffect(()=>{N.get("https://mehfooz-ur-rehman.herokuapp.com/api/v1/get_project").then(n=>{_(n.data)}).catch(n=>{console.log(n)})},[]),t(u,{children:[t("div",{className:"portfolio__section__header",children:[t("div",{className:"portfolio__section__left",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"Portfolio"]}),e("div",{className:"services__section__right__heading",style:{marginBottom:0},children:"Some of my distinguished woks"})]}),e("div",{className:"portfolio__section__right",children:t("div",{className:"portfolio__filters",children:[e(g,{onClick:()=>{c("")},defaultChecked:!0,children:"All"}),e(g,{onClick:()=>{c("Web App")},children:"Web App"}),e(g,{onClick:()=>{c("Mobile App")},children:"Mobile App"}),e(g,{onClick:()=>{c("UI/UX Design")},children:"UI/UX Design"})]})})]}),e("div",{className:"portfolio__projects",children:o.filter((n,a)=>a<6).map((n,a)=>e(S,{data:n,filter:i},a))}),e("div",{className:"project__section__left__link",style:{width:"100%",maxWidth:"1440px",margin:"0em auto",padding:"0em 2em",marginTop:"1em",marginBottom:"6em"},children:t(h,{to:"/portfolio",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),document.getElementById("portfolio").checked=!0},className:"project__section__left__link__entry",style:{marginTop:"0em"},children:["View More",e(P,{size:20,color:"currentColor"})]})})]})}var oe="/assets/profile.973181b9.png";function ae({info:i}){return t("section",{className:"home__section",id:"home__section",children:[t("div",{className:"home__section__left",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"HEY I'M ",i.name]}),e("div",{className:"home__section__left__heading",children:i.slogan}),e("div",{className:"home__section__left__info",children:i.role}),t("div",{className:"home__section__left__buttons",children:[e(h,{to:"/contact",onClick:()=>{document.getElementById("contact").checked=!0},className:"home__section__left__buttons__primary",children:"Hire me"}),e(h,{to:"/portfolio",onClick:()=>{document.getElementById("portfolio").checked=!0},className:"home__section__left__buttons__secondary",children:"Check Out My work"})]})]}),t("div",{className:"home__section__right",children:[e("button",{title:"play",className:"home__section__right__play__button",children:e(q,{size:20,color:"currentColor",fill:"currentColor"})}),t("div",{className:"home__section__right__experience",children:[e(b,{size:20,color:"currentColor"}),t("div",{className:"home__section__right__experience__content",children:[e("div",{className:"home__section__right__experience__content__heading",children:"Experience"}),t("div",{className:"home__section__right__experience__content__info",children:[e("span",{children:"1.5"}),"Year"]})]})]}),t("div",{className:"home__section__overlay",children:[e("a",{href:"https://github.com/MehfoozurRehman",className:"home__section__overlay__link",children:e(E,{size:20,color:"currentColor"})}),e("a",{href:"https://web.facebook.com/MehfoozurRehmanIjaz/",className:"home__section__overlay__link",children:e(D,{size:20,color:"currentColor"})}),e("a",{href:"https://www.instagram.com/mehfoozurrehman___/",className:"home__section__overlay__link",children:e(I,{size:20,color:"currentColor"})}),e("a",{href:"https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/",className:"home__section__overlay__link",children:e(M,{size:20,color:"currentColor"})})]}),e("img",{src:oe,alt:"pic"})]})]})}function se({info:i}){const[c,o]=s.exports.useState([]),[_,n]=s.exports.useState("large");return s.exports.useEffect(()=>{window.innerWidth<600?n("small"):window.innerWidth<1100?n("medium"):n("large"),window.addEventListener("resize",()=>{window.innerWidth<600?n("small"):window.innerWidth<1100?n("medium"):n("large")})},[]),s.exports.useEffect(()=>{N.get("https://mehfooz-ur-rehman.herokuapp.com/api/v1/get_testimonial").then(a=>{o(a.data)})},[]),t("section",{className:"testimonials__section",id:"testimonials__section",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"Testimonials"]}),e("div",{className:"services__section__right__heading",children:"What clients say"}),e("div",{className:"testimonials__section__content",children:e(Q,{spaceBetween:50,slidesPerView:_==="large"?3.5:_==="medium"?2:_==="small"?1:3.5,children:c.map((a,r)=>e(X,{children:e(ce,{data:a})},r))})}),e("div",{className:"porfolio__loadmore",style:{marginTop:-50},children:e(h,{to:"/write-testimonial",onClick:()=>{setTimeout(()=>{window.scrollTo({top:0,behavior:"smooth"})},10)},title:"load more",className:"contact__section__right__btn",style:{textDecoration:"none"},children:"Write Testimonial"})})]})}function _e(){return t("section",{className:"services__section",id:"services__section",children:[t("div",{className:"services__section__left",children:[t("div",{className:"services__section__left__col",children:[e(w,{icon:e(b,{size:40,color:"currentColor"}),name:"Web Development"}),e(w,{icon:e(b,{size:40,color:"currentColor"}),name:"UI / UX Design"}),e(w,{icon:e(b,{size:40,color:"currentColor"}),name:"Mobile Development"})]}),t("div",{className:"services__section__left__col",children:[e(w,{icon:e(b,{size:40,color:"currentColor"}),name:"Frontend Development"}),e(w,{icon:e(b,{size:40,color:"currentColor"}),name:"Backend Development"})]})]}),t("div",{className:"services__section__right",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"What I do"]}),t("div",{className:"services__section__right__heading",children:[e("span",{children:"Better design,"}),e("span",{children:"Better experiences"})]}),e("div",{className:"services__section__right__info",children:"I can help you build nice, modern and intuative designs and then make them reality. I will help you build your digital identity without the hastle. I can build you websites, mobile apps and cms to get you started and more."})]})]})}function re(){return t("section",{className:"about__section",id:"about__section",children:[t("div",{className:"about__section__left",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"About Us"]}),t("div",{className:"services__section__right__heading",children:[e("span",{children:"Hey, Im here"}),e("span",{children:"to help your next project"})]}),e("div",{className:"services__section__right__info",style:{marginBottom:"1em"},children:"I'm a Web Developer and UI/UX Designer from Samundri, Pakistan, working in web development. I enjoy turning complex problems into simple, beautiful and intuitive solutions."}),e("div",{className:"services__section__right__info",children:"My job is to build functional and user-friendly and at the same time attractive websites for you. Moreover, I add a personal touch to your product and make sure that it is eye-catching and easy to use. My aim is to bring across your message and identity in the most creative way."}),t("div",{className:"home__section__left__buttons",style:{marginTop:40},children:[e(h,{to:"/portfolio",onClick:()=>{document.getElementById("portfolio").checked=!0,window.scrollTo({top:0,behavior:"smooth"})},className:"home__section__left__buttons__primary",children:"My Portfolio"}),e("a",{href:"https://docs.google.com/document/d/1Z3e-5Ti2Zw9aol5RH5BUoiL8AC7HROHHQQkfvX6MQbQ/edit?usp=sharing",className:"home__section__left__buttons__secondary",children:"Download CV"})]})]}),t("div",{className:"about__section__right",children:[e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-1.fna.fbcdn.net/v/t39.30808-6/268797386_2713631368941015_3386990957194230084_n.jpg?_nc_cat=111&ccb=1-5&_nc_sid=e3f864&_nc_eui2=AeEtp0F0DheoJxsWBQFdsJH1prZUiQGoaP-mtlSJAaho_x-kCZNlCC6OHsvy8kdgA9myBuojeBv6arO8H7pgDDNM&_nc_ohc=kTrnRBy_x4wAX_YG5hS&_nc_ht=scontent.flhe7-1.fna&oh=00_AT-2jms_zFgQ3HkvwPqB1tXrcAaa3yBgMFRlQhkuBuQDPQ&oe=623BE4D0",alt:"pic",className:"about__section__right__box__img"})}),e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-1.fna.fbcdn.net/v/t39.30808-6/269254259_2713629602274525_2480075525282422773_n.jpg?_nc_cat=108&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeE2CcauD7qz5ZEoc24kfg7RGR32PmqEdO8ZHfY-aoR07-VEUEdnd-mIzEVDE0-z4zQ_osj36SGCCmmQgGxNAlNu&_nc_ohc=ayU4XoaKDmcAX8bA_z0&_nc_ht=scontent.flhe7-1.fna&oh=00_AT-4wZmcXiteEA28GuC5rPI8qEFk64zeqWXHpRS5QKh-Zg&oe=623C3211",alt:"pic",className:"about__section__right__box__img"})}),e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36652474_1853178834986277_334298457361612800_n.jpg?_nc_cat=103&ccb=1-5&_nc_sid=730e14&_nc_eui2=AeFNhO9vJFsHbRPMeP2rN7Tw4TpsD7rw8hThOmwPuvDyFEcjwzI-YsogkrYOHl32ba-G4rdNjG80-ILNp6yMvoNx&_nc_ohc=SHFEEavY7hUAX9Nap9-&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-zrxfZQvok_9twx4nH9YFI4nZqnmdqxSGkvxMgMttH3Q&oe=625D3396",alt:"pic",className:"about__section__right__box__img"})}),e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36895766_1858282574475903_3559164176137977856_n.jpg?_nc_cat=109&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeEtZt6Hr4AseM-g_9g9F7ZJYwFa1ACKuc5jAVrUAIq5zpNJPZ8X15c9-kOc-zd4wCAuY7YndpQNfzCiywxIe1dr&_nc_ohc=a0wdEqh7t4oAX-SNZlx&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-wsZ03hFPIM1YgiTo27Tq1PPqGxPuwwe6QxOf6ZGJw3g&oe=625EA7E9",alt:"pic",className:"about__section__right__box__img"})}),e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-1.fna.fbcdn.net/v/t1.6435-9/84111559_2217934178510739_6426804021658386432_n.jpg?_nc_cat=102&ccb=1-5&_nc_sid=19026a&_nc_eui2=AeH0DMZqW4Yuf8JSdjRDEjvMZwSFMkH7WxJnBIUyQftbElFjzjIV85YzO3CqRmagQop2DtwZivyaKvhrjRIo4KAX&_nc_ohc=pQE6C0P3SwsAX8rQt-X&_nc_ht=scontent.flhe7-1.fna&oh=00_AT8syU9hhF_8N1wKygzDkxM2kidfGbpldsGfNHbmxpmKAA&oe=625B762D",alt:"pic",className:"about__section__right__box__img"})}),e("div",{className:"about__section__right__box",children:e("img",{src:"https://scontent.flhe7-2.fna.fbcdn.net/v/t1.6435-9/36743652_1853177414986419_6191639233464107008_n.jpg?_nc_cat=100&ccb=1-5&_nc_sid=730e14&_nc_eui2=AeFSWZoZJLzlt9Y1DwX3oQBIOJLD5EE5Sug4ksPkQTlK6OSLWvPuOKzF8No3vx_a7IoqQsG13cn7FJhNEn0S8EtE&_nc_ohc=A9NC7mrYSvcAX-QldVa&_nc_ht=scontent.flhe7-2.fna&oh=00_AT-PiNtdhg6UiIoGyZfyv4O6JxLlJC7ntfmZDisVTQC_cQ&oe=625C8DC1",alt:"pic",className:"about__section__right__box__img"})})]})]})}function k({children:i,to:c,id:o,toSection:_,setIsNavOpen:n}){const a=T();return t("div",{className:"header__wrapper__nav__link",children:[e("input",{type:"radio",defaultChecked:c===window.location.pathname,className:"header__wrapper__nav__link__input",name:"header__wrapper__nav__link__input",id:o,onClick:_?()=>{a("/"),setTimeout(()=>{document.getElementById(_).scrollIntoView()},300),window.innerWidth<1100?n(!1):n(!0)}:()=>{a(c),window.innerWidth<1100?n(!1):n(!0)}}),e("div",{className:"header__wrapper__nav__link__content",children:i})]})}function le({image:i,name:c}){return t("div",{className:"skills__section__content__entry",children:[e("img",{src:i,alt:c,className:"skills__section__content__entry__img"}),e("span",{children:c})]})}function de({info:i}){return t("section",{className:"skills__section",children:[t("div",{className:"services__section__right__sub__heading",children:[e("div",{className:"services__section__right__sub__heading__bar"}),"Skills"]}),e("div",{className:"services__section__right__heading",children:"What can I do"}),e("div",{className:"skills__section__content",children:i.skills.map((c,o)=>e(le,{image:c.image,name:c.name},o))})]})}function he({info:i}){const{isUser:c}=s.exports.useContext(B);return console.log(c),t(u,{children:[e(ae,{info:i}),e(_e,{}),e(re,{}),e(de,{info:i}),e(ne,{}),e(se,{info:i})]})}function me(){const[i,c]=s.exports.useState(""),[o,_]=s.exports.useState(9),[n,a]=s.exports.useState([]);return s.exports.useEffect(()=>{N.get("https://mehfooz-ur-rehman.herokuapp.com/api/v1/get_project").then(r=>{a(r.data)}).catch(r=>{console.log(r)})},[]),t(u,{children:[t("div",{className:"screen__header",children:[t("div",{className:"screen__header__left",children:[e("div",{className:"screen__header__name",children:"Portfolio"}),t("div",{className:"screen__header__breadcrum",children:[e("div",{className:"screen__header__breadcrum__bar"})," Home / Portfolio"]})]}),e("div",{className:"screen__header__right",children:e(ue,{setFilter:c})})]}),e("div",{className:"portfolio__projects",children:n.filter((r,m)=>i===""?m<o:m).map((r,m)=>e(S,{data:r,filter:i},m))}),e("div",{className:"porfolio__loadmore",children:i===""?e("button",{title:"load more",className:"contact__section__right__btn",onClick:()=>{_(o+o)},children:"Load More"}):null})]})}function ue({setFilter:i}){return t("div",{className:"portfolio__filters",children:[e(g,{onClick:()=>{i("")},defaultChecked:!0,children:"All"}),e(g,{onClick:()=>{i("Web App")},children:"Web App"}),e(g,{onClick:()=>{i("Mobile App")},children:"Mobile App"}),e(g,{onClick:()=>{i("UI/UX Design")},children:"UI/UX Design"})]})}function pe(){const i=T(),{state:c}=Z(),[o,_]=s.exports.useState([]);s.exports.useEffect(()=>{c!=null?N.get("https://mehfooz-ur-rehman.herokuapp.com/api/v1/get_project").then(d=>{_(d.data)}).catch(d=>{console.log(d)}):i("/")},[]);var n=new Date(c.state.createdAt),a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=n.getFullYear(),m=a[n.getMonth()],f=n.getDate();return t(u,{children:[t("div",{className:"screen__header",children:[t("div",{className:"screen__header__left",children:[e("div",{className:"screen__header__name",children:"Project Details"}),t("div",{className:"screen__header__breadcrum",children:[e("div",{className:"screen__header__breadcrum__bar"})," Home / Project Details"]})]}),e("div",{className:"screen__header__left__right"})]}),t("div",{className:"project__section",children:[t("div",{className:"project__section__left",children:[e("div",{className:"project__section__left__heading",children:"Project Brief:"}),e("div",{className:"project__section__left__info",children:c.state.description}),e("div",{className:"project__section__left__bar"}),e("div",{className:"project__section__left__heading",children:"Project Detials:"}),t("div",{className:"project__section__left__about",children:[e("span",{children:"Category:"}),c.state.category.map(d=>d.value)]}),t("div",{className:"project__section__left__about",children:[e("span",{children:"Date:"}),f+"-"+m+"-"+r]}),t("div",{className:"project__section__left__about",children:[e("span",{children:"Client:"}),c.state.client]}),e("div",{className:"project__section__left__link",children:t("a",{href:c.state.url,className:"project__section__left__link__entry",children:["Launch Project",e(P,{size:20,color:"currentColor"})]})})]}),e(x,{publicId:c.state.image,alt:"pic",className:"project__section__right"})]}),e("div",{className:"project__section",style:{marginBottom:0},children:e("div",{className:"project__section__left",children:e("div",{className:"project__section__left__heading",children:"Related Projects"})})}),e("div",{className:"portfolio__projects",children:o.filter((d,v)=>v<3&&d.category===c.state.category).map((d,v)=>e(S,{data:d},v))}),e("div",{className:"porfolio__loadmore"})]})}function ge(){return e(u,{children:t("div",{className:"screen__header",children:[t("div",{className:"screen__header__left",children:[e("div",{className:"screen__header__name",children:"Contact"}),t("div",{className:"screen__header__breadcrum",children:[e("div",{className:"screen__header__breadcrum__bar"})," Home / Contact"]})]}),e("div",{className:"screen__header__left__right"})]})})}const fe="MEHFOOZ-UR-REHMAN",ve="Let's Build You A Digital Identity",Ne="Web Developer & UI/UX Designer",be="+92 313 7178074",we=[{image:"https://cdn-icons-png.flaticon.com/512/732/732212.png",name:"HTML 5"},{image:"https://cdn-icons-png.flaticon.com/512/732/732190.png",name:"CSS 3"},{image:"https://cdn-icons-png.flaticon.com/512/5968/5968292.png",name:"JavaScript"},{image:"https://cdn-icons-png.flaticon.com/512/1260/1260667.png",name:"React Js"},{image:"https://cdn-icons-png.flaticon.com/512/1260/1260775.png",name:"React Native"},{image:"https://cdn-icons-png.flaticon.com/512/919/919825.png",name:"Node Js"},{image:"https://cdn.worldvectorlogo.com/logos/adobe-xd.svg",name:"Adobe Xd"},{image:"https://cdn-icons-png.flaticon.com/512/5968/5968672.png",name:"Bootstrap"},{image:"https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/erkxwhl1gd48xfhe2yld",name:"MongoDb"}];var z={name:fe,slogan:ve,role:Ne,number:be,skills:we};function ke(){const[i,c]=s.exports.useState(""),[o,_]=s.exports.useState(""),[n,a]=s.exports.useState(""),[r,m]=s.exports.useState(""),[f,d]=s.exports.useState(!1);s.exports.useEffect(()=>{setTimeout(()=>{d(!1)},1e3)},[f]);function v(l){l.preventDefault(),N.post("https://mehfooz-ur-rehman.herokuapp.com/api/v1/set_testimonial",{name:i,email:o,designation:n,message:r}).then(()=>{c(""),_(""),a(""),m(""),d(!0),window.scrollTo({top:0,behavior:"smooth"})}).catch(y=>{console.log("testimonial error:"+y)})}return t(u,{children:[f?e("div",{className:"screen__popup",children:t("div",{className:"screen__popup__content",children:[e(A,{size:50,color:"currentColor"}),e("div",{className:"screen__popup__content__heading",children:"Successfully Sent"})]})}):null,t("div",{className:"screen__header",children:[t("div",{className:"screen__header__left",children:[e("div",{className:"screen__header__name",children:"Send me your valuable comments"}),t("div",{className:"screen__header__breadcrum",children:[e("div",{className:"screen__header__breadcrum__bar"})," Home / Write Testimonials"]})]}),e("div",{className:"screen__header__left__right"})]}),e("div",{className:"contact__section",children:t("form",{onSubmit:v,className:"contact__section__right",style:{width:"100%"},children:[e("div",{className:"contact__section__right__label",children:"Name"}),e("input",{type:"text",placeholder:"Name",className:"contact__section__right__input__box",value:i,onChange:l=>{c(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Email Address"}),e("input",{type:"text",placeholder:"Email Address",className:"contact__section__right__input__box",value:o,onChange:l=>{_(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Designation"}),e("input",{type:"text",placeholder:"Designation",className:"contact__section__right__input__box",value:n,onChange:l=>{a(l.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Message"}),e("textarea",{placeholder:"Message",rows:"10",className:"contact__section__right__input__area",value:r,onChange:l=>{m(l.target.value)},required:!0}),e("button",{title:"Send",className:"contact__section__right__btn",children:"Send"})]})})]})}function ye(){const{setIsDashboard:i}=s.exports.useContext(j),[c,o]=s.exports.useState(""),[_,n]=s.exports.useState("");return s.exports.useEffect(()=>(i(!0),()=>{i(!1)}),[]),e(u,{children:e("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",width:"100vw"},children:t("form",{onSubmit:()=>{console.log(c,_)},className:"contact__section__right",style:{maxWidth:500,padding:20},children:[t(h,{to:"/",onClick:()=>{document.getElementById("home").checked=!0},className:"header__wrapper__logo",style:{marginLeft:"auto",marginRight:"auto",fontSize:35},children:[e("span",{style:{fontSize:50},children:"M"}),e("div",{children:"ehfooz-ur-rehman"})]}),e("div",{className:"contact__section__right__label",style:{fontSize:30,fontWeight:"bold"},children:"Login"}),e("div",{className:"contact__section__right__label",children:"Email Address"}),e("input",{type:"text",placeholder:"Email Address",className:"contact__section__right__input__box",value:c,onChange:r=>{o(r.target.value)},required:!0}),e("div",{className:"contact__section__right__label",children:"Password"}),e("input",{type:"text",placeholder:"Password",className:"contact__section__right__input__box",value:_,onChange:r=>{n(r.target.value)},required:!0}),e("button",{title:"Send",className:"contact__section__right__btn",style:{marginLeft:"auto",marginRight:"auto",width:"100%",marginTop:40},children:"Login"})]})})})}function xe(){const{setIsDashboard:i}=s.exports.useContext(j);return s.exports.useEffect(()=>(i(!0),()=>{i(!1)}),[]),e(u,{children:"1"})}function Ce({info:i}){return t(O,{children:[t(p,{path:"/",children:[e(p,{path:"",element:e(he,{info:i})}),e(p,{path:"portfolio",element:e(me,{})}),e(p,{path:"project-detail",element:e(pe,{})}),e(p,{path:"contact",element:e(ge,{})}),e(p,{path:"write-testimonial",element:e(ke,{})})]}),e(p,{path:"/login",element:e(ye,{})}),e(p,{path:"/dashboard",element:e(xe,{})})]})}const B=s.exports.createContext(),j=s.exports.createContext();function Se(){const[i,c]=s.exports.useState(!1),[o,_]=s.exports.useState(!1);return e(J,{cloudName:"mehfoozurrehman",children:e(B.Provider,{value:{isUser:i,setIsUser:c},children:t(j.Provider,{value:{isDashboard:o,setIsDashboard:_},children:[o?null:e($,{info:z}),e(Ce,{info:z}),o?null:t(u,{children:[e(te,{}),e(ie,{})]})]})})})}Y.render(e(G.StrictMode,{children:e(V,{children:e(Se,{})})}),document.getElementById("root"));
