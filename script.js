'use strict';
document.documentElement.classList.add('js');
const header = document.querySelector('header');
const navigation = document.querySelector('#navigation');
const menu = document.querySelector('.menu-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
const sections = [...document.querySelectorAll('section[id]')];
const links = [...navigation.querySelectorAll('a')];
const animations = new Map();
const shown = new WeakSet();
const targets = [...document.querySelectorAll('.hero h1, .hero .intro, .hero .actions, .section h2, .section .eyebrow, .about-copy > p, .profile-label, .small-note, .section-heading > p, .project-info > h3, .project-info > p, .tool-card > div, .tool-group-heading, .skill-list > div, .credential-column article, .timeline-item > div, .contact > p, .contact-actions')];
let framePending = false;
let navigationTimer;
let navigating = false;
let navigationTarget;
let menuAnimation;
function setMenu(open) {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuAnimation?.cancel();
  if (open && !motion.matches && window.Motion) {
    const control = Motion.animate(navigation,{opacity:[0,1],y:[-8,0]},{duration:.22});
    menuAnimation={cancel:()=>control.stop()};
  } else if (open && !motion.matches && navigation.animate) menuAnimation = navigation.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}
menu.addEventListener('click', () => setMenu(!navigation.classList.contains('open')));
document.addEventListener('click', event => {
  if (!navigation.contains(event.target) && !menu.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {setMenu(false);menu.focus();}
});
matchMedia('(min-width:701px)').addEventListener('change',()=>setMenu(false));
function reveal(element, delay=0) {
  if (motion.matches || !element.animate) return;
  animations.get(element)?.cancel();
  if (window.gsap) {
    const tween=gsap.fromTo(element,{opacity:0,y:20},{opacity:1,y:0,duration:.5,delay:delay/1000,ease:'power2.out',clearProps:'opacity,transform',onComplete:()=>animations.delete(element)});
    animations.set(element,{cancel:()=>{tween.kill();gsap.set(element,{clearProps:'opacity,transform'});}});
    return;
  }
  const isText = !element.matches('.project, .tool-card');
  const animation = element.animate([
    {opacity:0,transform:`translateY(${isText?20:12}px)`},
    {opacity:1,transform:'translateY(0)'}
  ],{duration:500,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
  animations.set(element,animation);
  animation.onfinish=()=>animations.delete(element);
}
function update() {
  framePending=false;
  const top=header.getBoundingClientRect().bottom+16;
  const total=document.documentElement.scrollHeight-innerHeight;
  header.style.setProperty('--reading-progress',String(total>0?Math.min(1,Math.max(0,scrollY/total)):0));
  header.classList.toggle('is-scrolled',scrollY>12);
  let active=null;
  sections.forEach(section=>{if(section.getBoundingClientRect().top<=top+90)active=section.id;});
  links.forEach(link=>{
    const selected=link.hash==='#'+active;
    link.classList.toggle('active',selected);
    if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
  let stagger=0;
  targets.forEach(element=>{
    if(!element.getClientRects().length)return;
    const rect=element.getBoundingClientRect();
    if(rect.bottom<top||rect.top>=innerHeight)shown.delete(element);
    if(!navigating&&rect.top<innerHeight-35&&rect.bottom>top&&!shown.has(element)){
      shown.add(element);reveal(element,Math.min(stagger++*35,140));
    }
  });
}
function schedule() {
  if(!framePending){framePending=true;requestAnimationFrame(update);}
  if(navigating){clearTimeout(navigationTimer);navigationTimer=setTimeout(()=>{
    navigating=false;
    if(navigationTarget){
      if(!navigationTarget.matches('a, button, input, [tabindex]')) navigationTarget.setAttribute('tabindex','-1');
      navigationTarget.focus({preventScroll:true});
      navigationTarget=null;
    }
    schedule();
  },150);}
}
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const target=link.hash?document.getElementById(link.hash.slice(1)):document.body;
  if(!target||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();setMenu(false);navigating=true;navigationTarget=target;
  targets.filter(element=>target.contains(element)).forEach(element=>shown.delete(element));
  const y=target===document.body?0:target.getBoundingClientRect().top+scrollY-header.offsetHeight-18;
  window.scrollTo({top:Math.max(0,y),behavior:motion.matches?'instant':'smooth'});
  history.replaceState(null,'',link.hash||location.pathname+location.search);
  schedule();
}));
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule);
window.addEventListener('pageshow',schedule);
document.querySelectorAll('details').forEach(detail=>detail.addEventListener('toggle',schedule));
motion.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations.clear();menuAnimation?.cancel();schedule();});
document.querySelectorAll('.button, .nav-contact').forEach(button=>button.addEventListener('pointerdown',event=>{
  if(motion.matches||event.button!==0||!button.animate)return;
  const rect=button.getBoundingClientRect();
  const ripple=document.createElement('span');ripple.className='button-ripple';ripple.setAttribute('aria-hidden','true');
  ripple.style.left=(event.clientX-rect.left)+'px';ripple.style.top=(event.clientY-rect.top)+'px';
  button.append(ripple);
  if (window.anime?.animate) {
    ripple.style.transform='translate(-50%,-50%)';
    anime.animate(ripple,{scale:[0,14],opacity:[.35,0],duration:450,ease:'outQuad',onComplete:()=>ripple.remove()});
    return;
  }
  const animation=ripple.animate([{transform:'translate(-50%,-50%) scale(0)',opacity:.35},{transform:'translate(-50%,-50%) scale(14)',opacity:0}],{duration:450,easing:'ease-out'});
  animation.onfinish=()=>ripple.remove();
  animation.oncancel=()=>ripple.remove();
}));
schedule();
if (window.ScrollTrigger) {
  ScrollTrigger.create({start:0,end:'max',onUpdate:self=>header.style.setProperty('--reading-progress',self.progress)});
}
