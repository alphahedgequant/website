/* AHQ competitions: Web Push only; no cache interception or user tracking. */
self.addEventListener("push",event=>{
 let payload={title:"AlphaHedgeQuant competition update",body:"A verified tournament result is available.",url:"/competitions"};
 try{if(event.data)payload={...payload,...event.data.json()}}catch{}
 const title=String(payload.title||"AlphaHedgeQuant").slice(0,120);
 const body=String(payload.body||"Verified tournament update").slice(0,250);
 const target=payload.url==="/competitions"?"/competitions":"/competitions";
 event.waitUntil(self.registration.showNotification(title,{
   body,icon:"/favicon.ico",tag:String(payload.tag||"ahq-chess-results").slice(0,80),
   renotify:false,data:{url:target},timestamp:Date.now()
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 const target=new URL("/competitions",self.location.origin).href;
 event.waitUntil((async()=>{
   const windows=await clients.matchAll({type:"window",includeUncontrolled:true});
   const found=windows.find(win=>win.url.startsWith(self.location.origin)&&win.url.includes("/competitions"));
   if(found){await found.focus();return;}
   await clients.openWindow(target);
 })());
});
