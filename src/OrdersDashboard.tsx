// Orders Admin Prototype — compact, fast, and stable
// PATCH 2025-11-03
// - Fix: stray "return outside of function" by scoping all hooks/returns inside OrdersDashboard()
// - Fix: all <SelectTrigger>/<SelectValue> pairs properly closed
// - Keep actions column, modals, filters, compact statuses, clickable names when not editing
// - Shrink file size to avoid Canvas length warnings

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// tiny inline icons
const IcArrowLeft = (p:any)=>(<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="15 18 9 12 15 6"/><line x1="9" y1="12" x2="21" y2="12"/></svg>);
const IcArrowUpDown=(p:any)=>(<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="7 7 12 2 17 7"/><polyline points="7 17 12 22 17 17"/><line x1="12" y1="2" x2="12" y2="22"/></svg>);
const IcSearch=(p:any)=>(<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IcCalendar=(p:any)=>(<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IcClock=(p:any)=>(<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>);
const CopyIcon=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>);
const EditIcon=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>);
const TrashIcon=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>);
const CommentIcon=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>);

const STATUSES=["NEW","RESERVE_ATTEMPTION","RESERVED","CONFIRMED","NEEDS_CLARIFICATION","SHIPPING","DELIVERED","CANCELED","COMPLETED"] as const;
type OrderStatus=typeof STATUSES[number];
type PaymentStatusT="Оплачен"|"Не оплачен";
const CITIES=["Москва","Санкт-Петербург","Казань","Новосибирск","Екатеринбург","Нижний Новгород"];
const ALL="__all__";

const makeImg=(letter:string,fill="#e5e7eb")=>`data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' rx='8' fill='${fill}' /><text x='50%' y='54%' font-family='Arial, Helvetica, sans-serif' text-anchor='middle' dominant-baseline='middle' font-size='28' fill='#111827'>${letter}</text></svg>`)}`;
const PRODUCTS=[{name:"Кольцо с бриллиантом",sku:"KB-001",price:7950,sizes:[16,17,18],img:makeImg("R")},{name:"Серьги золотые",sku:"ER-210",price:5600,sizes:["—"],img:makeImg("E")},{name:"Подвеска с сапфиром",sku:"PN-078",price:11200,sizes:["—"],img:makeImg("P")} ] as const;

type OrderItem={id:number;name:string;sku:string;size:string|number;quantity:number;price:number};
type Recipient={enabled:boolean;name:string;phone:string};
type CommentT={id:number;author:string;date:string;text:string};
type Order={id:number;date:string;client:{name:string;phone:string;email:string};delivery:{type:string;city:string;address:string;cost?:number|string;date?:string;interval?:string;comment?:string};discount:number;payment:string;paymentStatus:PaymentStatusT;status:OrderStatus;needConfirmation?:boolean;needManagerHelp?:boolean;recipient:Recipient;comments:CommentT[];items:OrderItem[]};

const normalizeOrder=(raw:Partial<Order>):Order=>({id:raw.id??0,date:raw.date??"",client:raw.client??{name:"",phone:"",email:""},delivery:{type:raw.delivery?.type??"Курьер",city:raw.delivery?.city??"",address:raw.delivery?.address??"",cost:raw.delivery?.cost??0,date:raw.delivery?.date??"",interval:raw.delivery?.interval??"",comment:raw.delivery?.comment??""},discount:raw.discount??0,payment:raw.payment??"Карта",paymentStatus:(raw.paymentStatus as PaymentStatusT)??"Не оплачен",status:(raw.status as OrderStatus)??"NEW",needManagerHelp:raw.needManagerHelp??false,recipient:raw.recipient??{enabled:false,name:"",phone:""},comments:raw.comments??[],items:raw.items??[]});

const DEMO_ORDERS:Order[]=[{id:1001,date:"15.01.2025 13:30",client:{name:"Иванов Иван Иванович",phone:"+7 (999) 123-45-67",email:"ivanov@example.com"},delivery:{type:"Курьер",city:"Москва",address:"ул. Ленина, д. 10, кв. 25"},discount:500,payment:"Карта",paymentStatus:"Оплачен",status:"CONFIRMED",needConfirmation:false,needManagerHelp:false,recipient:{enabled:false,name:"",phone:""},comments:[],items:[{id:1,name:"Кольцо с бриллиантом",sku:"KB-001",size:17,quantity:2,price:7950}]},{id:1002,date:"16.01.2025 11:10",client:{name:"Петров Петр",phone:"+7 (921) 555-44-33",email:"petrov@example.com"},delivery:{type:"Самовывоз",city:"Санкт-Петербург",address:"Невский пр., 20"},discount:0,payment:"СБП",paymentStatus:"Не оплачен",status:"RESERVED",needConfirmation:false,needManagerHelp:false,recipient:{enabled:false,name:"",phone:""},comments:[],items:[{id:2,name:"Серьги золотые",sku:"ER-210",size:"—",quantity:1,price:5600},{id:3,name:"Подвеска с сапфиром",sku:"PN-078",size:"—",quantity:1,price:11200}]}];

const parseRuDate=(s:string)=>{const [d,t="00:00"]=String(s||"").split(" ");const [dd,mm,yyyy]=d.split(".").map(n=>parseInt(n,10));const [HH=0,MM=0]=t.split(":").map(n=>parseInt(n,10));if(isNaN(dd)||isNaN(mm)||isNaN(yyyy))return 0;return new Date(yyyy,mm-1,dd,HH||0,MM||0).getTime()};

const PaymentStatus=({status}:{status:PaymentStatusT})=>{const paid=status==="Оплачен";const root=paid?"inline-flex items-center gap-1 text-xs font-medium text-emerald-700":"inline-flex items-center gap-1 text-xs font-medium text-rose-700";const dot=paid?"bg-emerald-600":"bg-rose-600";const emoji=paid?"✅":"⛔";return(<span className={root}><span className={`h-1.5 w-1.5 rounded-full ${dot}`}></span><span className="-ml-0.5">{emoji}</span>{status}</span>)};

const StatusChips = ({ current }: { current: string }) => {
  const idx = STATUSES.indexOf(current as OrderStatus);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STATUSES.map((s, i) => {
        const isPast = i < idx;
        const isCurrent = i === idx;
        const base =
          "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] leading-[18px] border transition-colors";
        const cls = isCurrent
          ? "bg-indigo-600 text-white border-indigo-600"
          : isPast
          ? "bg-gray-100 text-gray-600 border-gray-200"
          : "bg-white text-gray-400 border-gray-200";
        return (
          <span key={s} className={`${base} ${cls}`}>{s}</span>
        );
      })}
    </div>
  );
};

// Chain-like status view for the detail page (dot + connector line)
const StatusChain = ({ current }: { current: string }) => {
  // Desktop: single-row, no horizontal scroll. We stretch connectors to fill the row
  // so 9 statuses always fit across the container width.
  const idx = STATUSES.indexOf(current as OrderStatus);
  return (
    <div className="flex items-center gap-3 md:gap-4 w-full select-none overflow-hidden">
      {STATUSES.map((s, i) => {
        const past = i <= idx;
        const isLast = i === STATUSES.length - 1;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${past ? "bg-indigo-600" : "bg-gray-300"}`}></span>
              <span className={`text-sm font-medium tracking-tight ${past ? "text-indigo-600" : "text-gray-400"}`}>{s}</span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={`flex-1 h-[2px] ${i < idx ? "bg-indigo-400" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function useDebounced<T>(value:T, delay=300){
  const [v,setV]=useState(value);
  useEffect(()=>{const t=setTimeout(()=>setV(value),delay);return()=>clearTimeout(t)},[value,delay]);
  return v as T;
}

export default function OrdersDashboard(){
  // global state
  const [orders,setOrders]=useState<Order[]>(DEMO_ORDERS);
  const [filters,setFilters]=useState({search:"",deliveryType:"",payMethod:"",payStatus:"",costMin:"",costMax:"",orderStatus:"",needConfirm:"",dateFrom:"",dateTo:""});
  const [view,setView]=useState<"list"|"detail">("list");
  const [order,setOrder]=useState<Order>(normalizeOrder(DEMO_ORDERS[0]));

  // modals
  const[commentModalOpen,setCommentModalOpen]=useState(false);
  const[deleteModalOpen,setDeleteModalOpen]=useState(false);
  const[targetOrderId,setTargetOrderId]=useState<number|undefined>();
  const[newComment,setNewComment]=useState("");
  const[deleteReason,setDeleteReason]=useState("");
  const[deleteReasonOther,setDeleteReasonOther]=useState("");

  // list helpers
  const debouncedSearch=useDebounced(filters.search,300);
  const isFiltered=useMemo(()=>{const f={...filters,search:debouncedSearch};return Object.values(f).some(v=>String(v||"")!=="")},[filters,debouncedSearch]);
  const[page,setPage]=useState(1);const[perPage]=useState(5);
  const[searchOpen,setSearchOpen]=useState(false);
  const[sort,setSort]=useState<{by:"date";dir:"asc"|"desc"}>({by:"date",dir:"desc"});

  const applyFilters=(list:Order[])=>list.filter(o=>{const sum=o.items.reduce((a,i)=>a+i.price*i.quantity,0)-(o.discount||0);const searchStr=[String(o.id),o.client.name,o.client.phone,o.client.email,o.delivery.city,o.delivery.address].join(" ").toLowerCase();const passSearch=debouncedSearch?searchStr.includes(debouncedSearch.toLowerCase()):true;const passStatus=filters.orderStatus?o.status===filters.orderStatus:true;const passPayStatus=filters.payStatus?o.paymentStatus===filters.payStatus:true;const passPayMethod=filters.payMethod?o.payment===filters.payMethod:true;const passDelivery=filters.deliveryType?o.delivery.type===filters.deliveryType:true;const passMin=filters.costMin?sum>=Number(filters.costMin):true;const passMax=filters.costMax?sum<=Number(filters.costMax):true;const passNeedConfirm=filters.needConfirm==="yes"?!!o.needConfirmation:filters.needConfirm==="no"?!o.needConfirmation:true;const dateTs=parseRuDate(o.date);const fromTs=filters.dateFrom?new Date(filters.dateFrom).setHours(0,0,0,0):0;const toTs=filters.dateTo?new Date(filters.dateTo).setHours(23,59,59,999):Infinity;const passFrom=filters.dateFrom?dateTs>=fromTs:true;const passTo=filters.dateTo?dateTs<=toTs:true;return passSearch&&passStatus&&passPayStatus&&passPayMethod&&passDelivery&&passMin&&passMax&&passNeedConfirm&&passFrom&&passTo});
  const filteredSorted=useMemo(()=>{const arr=applyFilters(orders);return[...arr].sort((a,b)=>sort.dir==="desc"?parseRuDate(b.date)-parseRuDate(a.date):parseRuDate(a.date)-parseRuDate(b.date))},[orders,filters,debouncedSearch,sort]);
  const pageCount=Math.max(1,Math.ceil(filteredSorted.length/perPage));const currPage=Math.min(page,pageCount);const start=(currPage-1)*perPage;const end=start+perPage;const visible=filteredSorted.slice(start,end);

  const copyOrder=async(o:Order)=>{const qty=o.items.reduce((a,i)=>a+i.quantity,0);const total=o.items.reduce((a,i)=>a+i.price*i.quantity,0)-(o.discount||0);const text=`Заказ #${o.id} — ${o.client.name}
Тел: ${o.client.phone}
Email: ${o.client.email}
Доставка: ${o.delivery.type}, ${o.delivery.city}, ${o.delivery.address}
Оплата: ${o.payment} (${o.paymentStatus})
Позиций: ${qty}
Итого: ${total} ₽`;try{await navigator.clipboard.writeText(text);alert("Сводка заказа скопирована")}catch{alert(text)}};
  const editOrder=(o:Order)=>{setOrder(normalizeOrder(o));setView("detail")};
  const askDeleteOrder=(o:Order)=>{setTargetOrderId(o.id);setDeleteReason("");setDeleteReasonOther("");setDeleteModalOpen(true)};
  const openCommentModal=(o:Order)=>{setTargetOrderId(o.id);setNewComment("");setCommentModalOpen(true)};

  // items editing (detail)
  const[itemsEditMode,setItemsEditMode]=useState(false);
  const itemsOriginalRef=useRef<OrderItem[]>([]);
  const sizesForSku=(sku:string)=>PRODUCTS.find(p=>p.sku===sku)?.sizes??["—"];
  const imgForItem=(it:{sku?:string;name?:string})=>PRODUCTS.find(p=>p.sku===it.sku)?.img||makeImg("*");
  const addItem=()=>{const it:OrderItem={id:Date.now(),name:"",sku:"",size:"",quantity:1,price:0};setOrder(prev=>({...prev,items:[...prev.items,it]}))};
  const beginItemsEdit=()=>{itemsOriginalRef.current=JSON.parse(JSON.stringify(order.items));setItemsEditMode(true)};
  const cancelItemsEdit=()=>{setOrder(prev=>({...prev,items:itemsOriginalRef.current||prev.items}));setItemsEditMode(false)};
  const saveItemsEdit=()=>setItemsEditMode(false);
  const updateItem=(id:number,field:keyof OrderItem,value:any)=>setOrder(prev=>({...prev,items:prev.items.map(it=>it.id===id?{...it,[field]:value}:it)}));
  const setProductByName=(id:number,name:string)=>{const p=PRODUCTS.find(x=>x.name===name);if(!p)return;setOrder(prev=>({...prev,items:prev.items.map(it=>it.id===id?{...it,name:p.name,sku:p.sku,price:p.price,size:(p.sizes as any)[0]??it.size}:it)}))};
  const setProductBySku=(id:number,sku:string)=>{const p=PRODUCTS.find(x=>x.sku===sku);if(!p)return;setOrder(prev=>({...prev,items:prev.items.map(it=>it.id===id?{...it,name:p.name,sku:p.sku,price:p.price,size:(p.sizes as any)[0]??it.size}:it)}))};
  const incQty=(id:number)=>updateItem(id,"quantity",order.items.find(i=>i.id===id)!.quantity+1);
  const decQty=(id:number)=>updateItem(id,"quantity",Math.max(1,order.items.find(i=>i.id===id)!.quantity-1));
  const cloneItem=(id:number)=>{const it=order.items.find(x=>x.id===id);if(!it)return;setOrder(prev=>({...prev,items:[...prev.items,{...it,id:Date.now()}]}))};
  const removeItem=(id:number)=>setOrder(prev=>({...prev,items:prev.items.filter(x=>x.id!==id)}));

  const Row=memo(function Row({o}:{o:Order}){const qty=o.items.reduce((a,i)=>a+i.quantity,0);const total=o.items.reduce((a,i)=>a+i.price*i.quantity,0)-(o.discount||0);return(<tr className="hover:bg-gray-50"><td className="px-6 py-3 align-top font-semibold text-indigo-600">#{o.id}</td><td className="px-4 py-3 align-top">
  {(() => { const [date, time] = String(o.date).split(" "); return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-900">
        <IcCalendar className="w-4 h-4 text-gray-500" /><span className="leading-none">{date || o.date}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <IcClock className="w-4 h-4 text-gray-400" /><span className="leading-none">{time || ""}</span>
      </div>
    </div>
  ); })()}
</td><td className="px-4 py-3 align-top space-y-1"><div className="text-xs text-gray-500"><span className="mr-1 opacity-70">📦</span>Позиций: {qty}</div><div className="text-xs text-green-600">Скидка: {o.discount||0} ₽</div><div className="text-sm text-gray-900 font-medium">Итого: {total} ₽</div></td><td className="px-4 py-3 align-top space-y-1"><div className="font-medium">{o.client.name}</div><div className="text-gray-500 text-xs"><span className="font-medium text-gray-600">Телефон:</span> {o.client.phone}</div><div className="text-gray-500 text-xs"><span className="font-medium text-gray-600">Email:</span> {o.client.email}</div></td><td className="px-4 py-3 align-top"><div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">{o.delivery.type}</span></div><div className="text-xs text-gray-500"><span className="font-medium text-gray-600">Адрес:</span> {o.delivery.city}, {o.delivery.address}</div></td><td className="px-4 py-3 align-top"><div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{o.payment}</span></div><PaymentStatus status={o.paymentStatus} /></td><td className="px-4 py-3 align-top"><StatusChips current={o.status} /></td><td className="px-4 py-3 align-top"><div className="flex flex-col gap-2 w-40"><ActionButton icon="copy" label="Копировать" onClick={()=>copyOrder(o)}/><ActionButton icon="edit" label="Редактировать" onClick={()=>editOrder(o)}/><ActionButton icon="comment" label="Комментарий" onClick={()=>openCommentModal(o)}/><ActionButton icon="trash" label="Удалить" tone="danger" onClick={()=>askDeleteOrder(o)}/></div></td></tr>)});

  if(view==="list"){
    return(
      <div className="p-10 bg-gray-50 min-h-screen space-y-12">
        <div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-bold text-gray-900">Управление заказами</h1><div className="flex items-center gap-2"><div className="relative flex items-center">{searchOpen&&(<Input autoFocus value={filters.search} onChange={(e)=>{setFilters({...filters,search:e.target.value});setPage(1)}} placeholder="Поиск: ID, клиент, телефон, email..." className="w-64 mr-2 h-9"/>)}<Button variant="outline" size="icon" onClick={()=>setSearchOpen(v=>!v)} title="Поиск"><IcSearch className="w-4 h-4"/></Button></div></div></div>

        <Card className="border border-gray-200 rounded-xl shadow-md bg-white"><CardContent className="p-6"><div className="grid grid-cols-12 gap-2 items-end text-sm">
          <div className="col-span-3"><label className="block text-[11px] text-gray-500 mb-1">Дата</label><div className="flex items-center gap-2"><Input type="date" className="h-9" value={filters.dateFrom} onChange={(e)=>{setFilters({...filters,dateFrom:e.target.value});setPage(1)}}/><span className="text-gray-400">—</span><Input type="date" className="h-9" value={filters.dateTo} onChange={(e)=>{setFilters({...filters,dateTo:e.target.value});setPage(1)}}/></div></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Тип доставки</label><Select value={filters.deliveryType||undefined} onValueChange={(v)=>{setFilters({...filters,deliveryType:v===ALL?"":v});setPage(1)}}><SelectTrigger className="h-9"><SelectValue placeholder="Все"/></SelectTrigger><SelectContent><SelectItem value={ALL}>Все</SelectItem><SelectItem value="Курьер">Курьер</SelectItem><SelectItem value="Самовывоз">Самовывоз</SelectItem><SelectItem value="СДЭК">СДЭК</SelectItem></SelectContent></Select></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Способ оплаты</label><Select value={filters.payMethod||undefined} onValueChange={(v)=>{setFilters({...filters,payMethod:v===ALL?"":v});setPage(1)}}><SelectTrigger className="h-9"><SelectValue placeholder="Все"/></SelectTrigger><SelectContent><SelectItem value={ALL}>Все</SelectItem><SelectItem value="Карта">Банковская карта</SelectItem><SelectItem value="СБП">СБП</SelectItem><SelectItem value="Кредит">Кредит</SelectItem><SelectItem value="Рассрочка">Рассрочка</SelectItem></SelectContent></Select></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Статус оплаты</label><Select value={filters.payStatus||undefined} onValueChange={(v)=>{setFilters({...filters,payStatus:v===ALL?"":v});setPage(1)}}><SelectTrigger className="h-9"><SelectValue placeholder="Все"/></SelectTrigger><SelectContent><SelectItem value={ALL}>Все</SelectItem><SelectItem value="Оплачен">Оплачен</SelectItem><SelectItem value="Не оплачен">Не оплачен</SelectItem></SelectContent></Select></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Стоимость</label><div className="flex items-center gap-2"><Input className="h-9" placeholder="от" value={filters.costMin} onChange={(e)=>{setFilters({...filters,costMin:e.target.value});setPage(1)}}/><span className="text-gray-400">—</span><Input className="h-9" placeholder="до" value={filters.costMax} onChange={(e)=>{setFilters({...filters,costMax:e.target.value});setPage(1)}}/></div></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Нужно подтверждение</label><Select value={filters.needConfirm||undefined} onValueChange={(v)=>{setFilters({...filters,needConfirm:v===ALL?"":v});setPage(1)}}><SelectTrigger className="h-9"><SelectValue placeholder="Все"/></SelectTrigger><SelectContent><SelectItem value={ALL}>Все</SelectItem><SelectItem value="yes">Да</SelectItem><SelectItem value="no">Нет</SelectItem></SelectContent></Select></div>
          <div className="col-span-2"><label className="block text-[11px] text-gray-500 mb-1">Статус заказа</label><Select value={filters.orderStatus||undefined} onValueChange={(v)=>{setFilters({...filters,orderStatus:v===ALL?"":v});setPage(1)}}><SelectTrigger className="h-9"><SelectValue placeholder="Все"/></SelectTrigger><SelectContent><SelectItem value={ALL}>Все</SelectItem>{STATUSES.map(s=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
          <div className="col-span-12 flex gap-2 justify-end pt-1">{isFiltered&&(<Button variant="outline" onClick={()=>{setFilters({search:"",deliveryType:"",payMethod:"",payStatus:"",costMin:"",costMax:"",orderStatus:"",needConfirm:"",dateFrom:"",dateTo:""});setPage(1)}}>Сбросить</Button>)}</div>
        </div></CardContent></Card>

        <Card className="border border-gray-200 rounded-xl shadow-md bg-white"><CardContent className="p-0"><table className="w-full text-sm table-fixed"><thead className="text-gray-500 border-b border-gray-200"><tr className="text-left"><th className="px-6 py-3">ID</th><th className="px-4 py-3 align-top"><button className="inline-flex items-center gap-1 text-gray-700 hover:text-indigo-600" onClick={()=>setSort(s=>({by:"date",dir:s.dir==="desc"?"asc":"desc"}))}>Дата<IcArrowUpDown className="w-4 h-4 opacity-60"/></button></th><th className="px-4 py-3 align-top">Сводка заказа</th><th className="px-4 py-3 align-top">Клиент</th><th className="px-4 py-3 align-top">Доставка</th><th className="px-4 py-3 align-top">Оплата</th><th className="px-6 py-3">Статус</th><th className="px-4 py-3 w-40">Действия</th></tr></thead><tbody className="divide-y divide-gray-200">{visible.map(o=>(<Row key={o.id} o={o}/>))}</tbody></table><div className="flex items-center justify-between px-6 py-4 text-sm"><div className="text-gray-500">Показаны {start+1}–{Math.min(end,filteredSorted.length)} из {filteredSorted.length}</div><div className="flex gap-2"><Button variant="outline" disabled={currPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Назад</Button>{Array.from({length:pageCount}).map((_,i)=>(<Button key={i} variant={currPage===i+1?"default":"outline"} onClick={()=>setPage(i+1)}>{i+1}</Button>))}<Button variant="outline" disabled={currPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>Вперёд</Button></div></div></CardContent></Card>

        {commentModalOpen&&( <Modal onClose={()=>setCommentModalOpen(false)} title={`Комментарий к заказу #${targetOrderId}`}><div className="space-y-3"><Textarea placeholder="Оставьте комментарий…" value={newComment} onChange={(e)=>setNewComment(e.target.value)}/><div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=>setCommentModalOpen(false)}>Отмена</Button><Button onClick={()=>{if(!targetOrderId||!newComment.trim())return;setOrders(prev=>prev.map(o=>o.id===targetOrderId?{...o,comments:[...o.comments,{id:Date.now(),author:"Менеджер",date:new Date().toLocaleDateString(),text:newComment.trim()}]}:o));setCommentModalOpen(false);setNewComment("")}}>Сохранить</Button></div></div></Modal> )}

        {deleteModalOpen&&( <Modal onClose={()=>setDeleteModalOpen(false)} title={`Удалить заказ #${targetOrderId}?`}><div className="space-y-4"><div><label className="block text-sm text-gray-600 mb-1">Причина</label><Select value={deleteReason||undefined} onValueChange={(v)=>setDeleteReason(v)}><SelectTrigger><SelectValue placeholder="Выберите причину"/></SelectTrigger><SelectContent><SelectItem value="duplicate">Дублирующийся заказ</SelectItem><SelectItem value="wrong">Неверные данные</SelectItem><SelectItem value="client">Отмена клиентом</SelectItem><SelectItem value="other">Другое</SelectItem></SelectContent></Select></div>{deleteReason==="other"&&(<div><label className="block text-sm text-gray-600 mb-1">Опишите причину</label><Textarea value={deleteReasonOther} onChange={(e)=>setDeleteReasonOther(e.target.value)}/></div>)}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=>setDeleteModalOpen(false)}>Отмена</Button><Button variant="destructive" onClick={()=>{if(!targetOrderId)return;setOrders(prev=>prev.filter(o=>o.id!==targetOrderId));setDeleteModalOpen(false)}}>Удалить</Button></div></div></Modal> )}
      </div>
    );
  }

  // detail view
  return(
    <div className="p-10 bg-gray-50 min-h-screen space-y-12">
      <div className="flex justify-between items-center"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={()=>setView("list")} title="К списку заказов"><IcArrowLeft className="w-5 h-5"/></Button><h1 className="text-2xl font-bold text-gray-900">Заказ #{order.id}</h1><span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{order.status}</span></div><Button onClick={()=>{setOrders(prev=>prev.map(o=>o.id===order.id?order:o));alert("Изменения сохранены (демо)")}}>Сохранить</Button></div>
      <div className="py-1"><StatusChain current={order.status} /></div>

      <div className="grid grid-cols-3 gap-8">
        <div className="space-y-8 col-span-1">
          <Card className="border border-gray-200 rounded-xl bg-white"><CardHeader className="px-6 py-4"><CardTitle>Информация о заказе</CardTitle></CardHeader><CardContent className="p-6 space-y-3 text-sm text-gray-700"><p><b>Дата заказа:</b> {order.date}</p><div><label className="block mb-1 text-gray-500">Статус заказа</label><Select value={order.status} onValueChange={(v)=>setOrder({...order,status:v as OrderStatus})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div><div><label className="block mb-1 text-gray-500">Тип оплаты</label><Select value={order.payment} onValueChange={(v)=>setOrder({...order,payment:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Карта">Банковская карта</SelectItem><SelectItem value="Рассрочка">Рассрочка</SelectItem><SelectItem value="СБП">СБП</SelectItem><SelectItem value="Кредит">Кредит</SelectItem></SelectContent></Select></div><div><label className="block mb-1 text-gray-500">Статус оплаты</label><Select value={order.paymentStatus} onValueChange={(v)=>setOrder({...order,paymentStatus:(v as PaymentStatusT)})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Оплачен">Оплачен</SelectItem><SelectItem value="Не оплачен">Не оплачен</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between pt-2"><span className="text-gray-600">Требуется подтверждение менеджера</span><input type="checkbox" checked={order.needManagerHelp} onChange={(e)=>setOrder({...order,needManagerHelp:e.target.checked})}/></div></CardContent></Card>

          <Card className="border border-gray-200 rounded-xl bg-white"><CardHeader className="px-6 py-4"><CardTitle>Информация о клиенте</CardTitle></CardHeader><CardContent className="p-6 text-sm text-gray-700 space-y-4"><div className="flex items-start justify-between"><div className="space-y-3 w-full"><div><label className="block mb-1 text-gray-500">Имя</label><Input value={order.client.name} readOnly className="bg-gray-50 cursor-not-allowed" /></div><div><label className="block mb-1 text-gray-500">Телефон</label><Input value={order.client.phone} readOnly className="bg-gray-50 cursor-not-allowed" /></div><div><label className="block mb-1 text-gray-500">Email</label><Input value={order.client.email} readOnly className="bg-gray-50 cursor-not-allowed" /></div></div><a href={`#/users/${encodeURIComponent(order.client.email||order.client.phone||order.client.name)}`} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline mt-1" title="Открыть профиль клиента"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Открыть профиль</span></a></div><div className="flex items-center justify-between pt-2"><span className="text-gray-600">Другой получатель</span><Switch checked={order.recipient.enabled} onCheckedChange={v=>setOrder(prev=>({...prev,recipient:{...prev.recipient,enabled:v}}))}/></div>{order.recipient.enabled&&(<div className="grid grid-cols-2 gap-4 pt-2"><div><label className="block mb-1 text-gray-500">ФИО получателя</label><Input value={order.recipient.name} onChange={(e)=>setOrder(prev=>({...prev,recipient:{...prev.recipient,name:e.target.value}}))}/></div><div><label className="block mb-1 text-gray-500">Телефон получателя</label><Input value={order.recipient.phone} onChange={(e)=>setOrder(prev=>({...prev,recipient:{...prev.recipient,phone:e.target.value}}))}/></div></div>)}</CardContent></Card>

          <Card className="border border-gray-200 rounded-xl bg-white"><CardHeader className="px-6 py-4"><CardTitle>Доставка</CardTitle></CardHeader><CardContent className="p-6 text-sm text-gray-700 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block mb-1 text-gray-600 font-medium">Тип доставки</label><Select value={order.delivery.type} onValueChange={(v)=>setOrder(p=>({...p,delivery:{...p.delivery,type:v}}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Курьер">Курьер</SelectItem><SelectItem value="Самовывоз">Самовывоз</SelectItem><SelectItem value="СДЭК">СДЭК</SelectItem></SelectContent></Select></div><div><label className="block mb-1 text-gray-600 font-medium">Стоимость доставки</label><Input value={order.delivery.cost as any} onChange={(e)=>setOrder(p=>({...p,delivery:{...p.delivery,cost:e.target.value}}))}/></div></div><div><label className="block mb-1 text-gray-600 font-medium">Город</label><Select value={order.delivery.city} onValueChange={(v)=>setOrder(p=>({...p,delivery:{...p.delivery,city:v}}))}><SelectTrigger><SelectValue placeholder="Выберите город"/></SelectTrigger><SelectContent>{CITIES.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div><div><label className="block mb-1 text-gray-600 font-medium">Адрес:</label><Input value={order.delivery.address} onChange={(e)=>setOrder(p=>({...p,delivery:{...p.delivery,address:e.target.value}}))}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block mb-1 text-gray-600 font-medium">Планируемая дата</label><Input type="date" value={order.delivery.date} onChange={(e)=>setOrder(p=>({...p,delivery:{...p.delivery,date:e.target.value}}))}/></div><div><label className="block mb-1 text-gray-600 font-medium">Интервал времени</label><Input value={order.delivery.interval} onChange={(e)=>setOrder(p=>({...p,delivery:{...p.delivery,interval:e.target.value}}))}/></div></div><div><label className="block mb-1 text-gray-600 font-medium">Комментарий</label><Textarea value={order.delivery.comment} onChange={(e)=>setOrder(p=>({...p,delivery:{...p.delivery,comment:e.target.value}}))}/></div></CardContent></Card>
        </div>

        <div className="space-y-8 col-span-2">
          <Card className="border border-gray-200 rounded-xl bg-white"><CardHeader className="px-6 py-4 border-b"><div className="flex items-center justify-between w-full"><CardTitle>Состав заказа</CardTitle><div className="flex items-center gap-2">{itemsEditMode?(<><Button variant="outline" onClick={addItem}>+ Добавить</Button><Button variant="ghost" onClick={cancelItemsEdit}>Отменить</Button><Button onClick={saveItemsEdit}>Сохранить</Button></>):(<Button variant="outline" onClick={beginItemsEdit}>Редактировать</Button>)}</div></div></CardHeader><CardContent><table className="w-full text-sm border rounded-md overflow-hidden"><thead className="bg-gray-50 text-gray-500 border-b"><tr className="text-left"><th className="px-3 py-3 w-8">#</th><th className="py-3 pl-14 pr-3">Название</th><th>Артикул</th><th>Размер</th><th>Количество</th><th>Цена за ед.</th><th>Сумма</th><th></th></tr></thead><tbody>{order.items.map((item,idx)=>(<tr key={item.id} className="border-b"><td className="px-3 py-3 text-gray-500">{idx+1}</td><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={imgForItem(item)} alt="Товар" className="w-10 h-10 rounded-md object-cover border"/>{itemsEditMode?(<Select value={item.name||undefined} onValueChange={(v)=>setProductByName(item.id,v)}><SelectTrigger><SelectValue placeholder="Выберите товар"/></SelectTrigger><SelectContent>{PRODUCTS.map(p=>(<SelectItem key={p.sku} value={p.name}>{p.name}</SelectItem>))}</SelectContent></Select>):(<a href="#" className="text-indigo-600 hover:underline">{item.name||"—"}</a>)}</div></td><td className="px-2 py-3">{itemsEditMode?(<Select value={item.sku||undefined} onValueChange={(v)=>setProductBySku(item.id,v)}><SelectTrigger><SelectValue placeholder="SKU"/></SelectTrigger><SelectContent>{PRODUCTS.map(p=>(<SelectItem key={p.sku} value={p.sku}>{p.sku}</SelectItem>))}</SelectContent></Select>):(<span>{item.sku||"—"}</span>)}</td><td className="px-2 py-3">{itemsEditMode?(<Select value={item.size?String(item.size):undefined} onValueChange={(v)=>updateItem(item.id,"size",v)}><SelectTrigger><SelectValue placeholder="Размер"/></SelectTrigger><SelectContent>{sizesForSku(item.sku).map(s=>(<SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>))}</SelectContent></Select>):(<span>{String(item.size||"—")}</span>)}</td><td className="px-2 py-3">
  {itemsEditMode ? (
    <div className="inline-flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => decQty(item.id)}>-</Button>
      <span className="w-6 text-center">{item.quantity}</span>
      <Button variant="outline" size="icon" onClick={() => incQty(item.id)}>+</Button>
    </div>
  ) : (
    <span className="inline-block min-w-10 px-2 py-1 text-center rounded-md border bg-gray-50 text-gray-800">{item.quantity}</span>
  )}
</td><td className="px-2 py-3">{item.price} ₽</td><td className="px-2 py-3 font-medium">{item.price*item.quantity} ₽</td><td className="px-2 py-3 text-right">{itemsEditMode?(<div className="inline-flex gap-2"><Button variant="outline" size="sm" onClick={()=>cloneItem(item.id)}>Дубль</Button><Button variant="destructive" size="sm" onClick={()=>removeItem(item.id)}>Удалить</Button></div>):null}</td></tr>))}</tbody></table>

{/* Итоги под таблицей */}
{(() => {
  const qty = order.items.reduce((a,i)=>a+i.quantity,0);
  const subtotal = order.items.reduce((a,i)=>a+i.price*i.quantity,0);
  const discount = Number(order.discount||0);
  const shipping = Number(order.delivery.cost||0);
  const total = subtotal - discount + shipping;
  return (
    <div className="flex justify-end">
      <div className="mt-4 w-full sm:w-auto">
        <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-1 text-sm">
          <div className="text-gray-600">Позиций:</div><div className="text-right tabular-nums">{qty}</div>
          <div className="text-gray-600">Сумма товаров:</div><div className="text-right tabular-nums">{subtotal} ₽</div>
          <div className="text-gray-600">Скидка:</div><div className="text-right tabular-nums text-green-600">−{discount} ₽</div>
          <div className="text-gray-600">Доставка:</div><div className="text-right tabular-nums">{shipping} ₽</div>
        </div>
        <div className="h-px my-3 bg-gray-200" />
        <div className="flex items-baseline justify-end gap-8">
          <div className="text-base font-semibold text-gray-900">Итого:</div>
          <div className="text-base font-semibold text-gray-900 tabular-nums">{total} ₽</div>
        </div>
      </div>
    </div>
  );
})()}

</CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function Modal({children,onClose,title}:{children:any;onClose:()=>void;title:string}){return(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="bg-white rounded-xl w-[520px] max-w-[90vw] shadow-lg"><div className="px-5 py-3 border-b font-semibold text-gray-800">{title}</div><div className="p-5">{children}</div><div className="px-5 pb-5 text-right"><Button variant="outline" onClick={onClose}>Закрыть</Button></div></div></div>)}

function ActionButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: "copy" | "edit" | "comment" | "trash";
  label: string;
  onClick: () => void;
  tone?: "danger" | "default";
}) {
  const Icon = icon === "copy" ? CopyIcon : icon === "edit" ? EditIcon : icon === "comment" ? CommentIcon : TrashIcon;
  const color =
    tone === "danger"
      ? "text-rose-600 group-hover:text-rose-700"
      : "text-gray-700 group-hover:text-indigo-600";
  const hoverBg = tone === "danger" ? "group-hover:bg-rose-50" : "group-hover:bg-indigo-50";

  return (
    <button
      onClick={onClick}
      className={`group w-full h-12 rounded-xl border ${hoverBg} transition-all overflow-hidden flex items-center justify-center`}
    >
      <div className="relative flex items-center w-full">
        {/* icon */}
        <span className="inline-flex items-center justify-center w-full transition-all group-hover:w-10 group-hover:pl-4">
          <Icon className={`w-5 h-5 ${color} transition-all`} />
        </span>
        {/* label (reveals on hover) */}
        <span className={`absolute right-3 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sm ${
          tone === "danger" ? "text-rose-700" : "text-gray-700"
        }`}>
          {label}
        </span>
      </div>
    </button>
  );
}

// --- lightweight runtime checks (dev) ---
if (typeof window !== "undefined") {
  console.info("[Test] parseRuDate ok:", parseRuDate("15.01.2025 13:30") > 0);
  console.info("[Test] statuses count:", STATUSES.length === 9);
}
