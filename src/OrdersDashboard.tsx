import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Copy, Trash2, ArrowLeft, Search, ArrowUpDown } from "lucide-react";

const statuses = [
  "NEW",
  "RESERVE_ATTEMPTION",
  "RESERVED",
  "CONFIRMED",
  "NEEDS_CLARIFICATION",
  "SHIPPING",
  "DELIVERED",
  "CANCELED",
  "COMPLETED",
];

const products = [
  {
    name: "Кольцо с бриллиантом",
    sku: "KB-001",
    price: 7950,
    sizes: [16, 17, 18],
    img:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
          <rect width='100%' height='100%' fill='#e5e7eb'/>
          <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='28'>💍</text>
        </svg>`
      ),
  },
  {
    name: "Серьги золотые",
    sku: "ER-210",
    price: 5600,
    sizes: ["—"],
    img:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
          <rect width='100%' height='100%' fill='#e5e7eb'/>
          <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='28'>👂</text>
        </svg>`
      ),
  },
  {
    name: "Подвеска с сапфиром",
    sku: "PN-078",
    price: 11200,
    sizes: ["—"],
    img:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
          <rect width='100%' height='100%' fill='#e5e7eb'/>
          <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='28'>💎</text>
        </svg>`
      ),
  },
];

const cities = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Новосибирск",
  "Екатеринбург",
  "Нижний Новгород",
];

const SELECT_ALL = "__all__";

type OrderItem = { id: number; name: string; sku: string; size: string | number; quantity: number; price: number };
type Recipient = { enabled: boolean; name: string; phone: string };
type Comment = { id: number; author: string; date: string; text: string };
type Order = {
  id: number;
  date: string;
  client: { name: string; phone: string; email: string };
  delivery: { type: string; city: string; address: string; cost?: number | string; date?: string; interval?: string; comment?: string };
  discount: number;
  payment: string;
  paymentStatus: "Оплачен" | "Не оплачен";
  status: (typeof statuses)[number];
  needConfirmation?: boolean;
  needManagerHelp?: boolean;
  recipient: Recipient;
  comments: Comment[];
  items: OrderItem[];
};

function normalizeOrder(raw: Partial<Order>): Order {
  return {
    id: raw?.id ?? 0,
    date: raw?.date ?? "",
    client: raw?.client ?? { name: "", phone: "", email: "" },
    delivery: {
      type: raw?.delivery?.type ?? "Курьер",
      city: raw?.delivery?.city ?? "",
      address: raw?.delivery?.address ?? "",
      cost: raw?.delivery?.cost ?? 0,
      date: raw?.delivery?.date ?? "",
      interval: raw?.delivery?.interval ?? "",
      comment: raw?.delivery?.comment ?? "",
    },
    discount: raw?.discount ?? 0,
    payment: raw?.payment ?? "Карта",
    paymentStatus: (raw?.paymentStatus as Order["paymentStatus"]) ?? "Не оплачен",
    status: (raw?.status as Order["status"]) ?? "NEW",
    needManagerHelp: raw?.needManagerHelp ?? false,
    recipient: raw?.recipient ?? { enabled: false, name: "", phone: "" },
    comments: raw?.comments ?? [],
    items: raw?.items ?? [],
  };
}

export default function OrdersDashboard() {
  const [view, setView] = useState<"list" | "detail">("list");

  const orders: Order[] = [
    {
      id: 1001,
      date: "15.01.2025 13:30",
      client: { name: "Иванов Иван Иванович", phone: "+7 (999) 123-45-67", email: "ivanov@example.com" },
      delivery: { type: "Курьер", city: "Москва", address: "ул. Ленина, д. 10, кв. 25" },
      discount: 500,
      payment: "Карта",
      paymentStatus: "Оплачен",
      status: "CONFIRMED",
      needConfirmation: false,
      needManagerHelp: false,
      recipient: { enabled: false, name: "", phone: "" },
      comments: [],
      items: [{ id: 1, name: "Кольцо с бриллиантом", sku: "KB-001", size: 17, quantity: 2, price: 7950 }],
    },
    {
      id: 1002,
      date: "16.01.2025 11:10",
      client: { name: "Петров Петр", phone: "+7 (921) 555-44-33", email: "petrov@example.com" },
      delivery: { type: "Самовывоз", city: "Санкт-Петербург", address: "Невский пр., 20" },
      discount: 0,
      payment: "СБП",
      paymentStatus: "Не оплачен",
      status: "RESERVED",
      needConfirmation: false,
      needManagerHelp: false,
      recipient: { enabled: false, name: "", phone: "" },
      comments: [],
      items: [
        { id: 2, name: "Серьги золотые", sku: "ER-210", size: "—", quantity: 1, price: 5600 },
        { id: 3, name: "Подвеска с сапфиром", sku: "PN-078", size: "—", quantity: 1, price: 11200 },
      ],
    },
  ];

  const [order, setOrder] = useState<Order>(() => normalizeOrder(orders[0]));
  const [newComment, setNewComment] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    deliveryType: "",
    payMethod: "",
    payStatus: "",
    costMin: "",
    costMax: "",
    orderStatus: "",
    needConfirm: "",
  });

  const isFiltered = useMemo(() => {
    const f: Record<string, string> = filters as any;
    return Object.keys(f).some((k) => String(f[k] || "") !== "");
  }, [filters]);

  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<{ by: "date"; dir: "asc" | "desc" }>({ by: "date", dir: "desc" });

  const parseRuDate = (s: string) => {
    const [datePart, timePart = "00:00"] = String(s || "").split(" ");
    const [dd, mm, yyyy] = datePart.split(".").map((n) => parseInt(n, 10));
    const [HH = 0, MM = 0] = timePart.split(":").map((n) => parseInt(n, 10));
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return 0;
    return new Date(yyyy, mm - 1, dd, HH || 0, MM || 0).getTime();
  };

  const sizesForSku = (sku: string) => {
    const p = products.find((x) => x.sku === sku);
    return p?.sizes ?? ["—"];
  };

  const imgForItem = (it: { sku?: string; name?: string }) => {
    const sku = it.sku || "";
    const name = it.name || "";
    const make = (emoji: string) =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
           <rect width='100%' height='100%' fill='#e5e7eb'/>
           <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='28'>${emoji}</text>
         </svg>`
      );
    const bySku: Record<string, string> = { "KB-001": make("💍"), "ER-210": make("👂"), "PN-078": make("💎") };
    if (bySku[sku]) return bySku[sku];
    if (/кольцо/i.test(name)) return make("💍");
    if (/серьг/i.test(name)) return make("👂");
    if (/подвес/i.test(name)) return make("💎");
    return make("⭐");
  };

  const totalSum = order.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
  const [itemsEditMode, setItemsEditMode] = useState(false);
  const itemsOriginalRef = useRef<OrderItem[]>([]);
  const productUrl = (sku?: string) => (sku ? `/products/${sku}` : undefined);
  const updateClient = (field: keyof Order["client"], value: any) => setOrder((prev) => ({ ...prev, client: { ...prev.client, [field]: value } }));
  const updateDelivery = (field: keyof Order["delivery"], value: any) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, [field]: value } }));

  // Items
  const addItem = () => {
    const newItem: OrderItem = { id: Date.now(), name: "", sku: "", size: "", quantity: 1, price: 0 };
    setOrder((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };
  const beginItemsEdit = () => {
    itemsOriginalRef.current = JSON.parse(JSON.stringify(order.items));
    setItemsEditMode(true);
  };
  const cancelItemsEdit = () => {
    setOrder((prev) => ({ ...prev, items: itemsOriginalRef.current || prev.items }));
    setItemsEditMode(false);
  };
  const saveItemsEdit = () => {
    setItemsEditMode(false);
  };
  const updateItem = (id: number, field: keyof OrderItem, value: any) => {
    setOrder((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) }));
  };
  const setProductByName = (rowId: number, name: string) => {
    const p = products.find((x) => x.name === name);
    if (!p) return;
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === rowId ? { ...it, name: p.name, sku: p.sku, price: p.price, size: (p.sizes as any)[0] ?? it.size } : it)),
    }));
  };
  const setProductBySku = (rowId: number, sku: string) => {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === rowId ? { ...it, name: p.name, sku: p.sku, price: p.price, size: (p.sizes as any)[0] ?? it.size } : it)),
    }));
  };
  const incQty = (rowId: number) => setOrder((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === rowId ? { ...it, quantity: it.quantity + 1 } : it)) }));
  const decQty = (rowId: number) => setOrder((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === rowId ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it)) }));
  const cloneItem = (id: number) =>
    setOrder((prev) => {
      const it = prev.items.find((x) => x.id === id);
      if (!it) return prev;
      return { ...prev, items: [...prev.items, { ...it, id: Date.now() }] };
    });
  const removeItem = (id: number) => setOrder((prev) => ({ ...prev, items: prev.items.filter((x) => x.id !== id) }));

  const addComment = () => {
    if (!newComment.trim()) return;
    const c: Comment = { id: Date.now(), author: "Менеджер Петрова", date: new Date().toLocaleDateString(), text: newComment.trim() };
    setOrder((prev) => ({ ...prev, comments: [...prev.comments, c] }));
    setNewComment("");
  };

  const handleSave = () => {
    console.log("SAVE_ORDER", order);
    alert("Изменения сохранены (демо)");
  };

  const applyFilters = (list: Order[], f: any) => {
    return list.filter((o) => {
      const sum = o.items.reduce((a, i) => a + i.price * i.quantity, 0) - (o.discount || 0);
      const passSearch = f.search
        ? [String(o.id), o.client.name, o.client.phone, o.client.email, o.delivery.city, o.delivery.address]
            .join(" ")
            .toLowerCase()
            .includes(f.search.toLowerCase())
        : true;
      const passStatus = f.orderStatus ? o.status === f.orderStatus : true;
      const passPayStatus = f.payStatus ? o.paymentStatus === f.payStatus : true;
      const passPayMethod = f.payMethod ? o.payment === f.payMethod : true;
      const passDelivery = f.deliveryType ? o.delivery.type === f.deliveryType : true;
      const passMin = f.costMin ? sum >= Number(f.costMin) : true;
      const passMax = f.costMax ? sum <= Number(f.costMax) : true;
      const passNeedConfirm = f.needConfirm === "yes" ? !!o.needConfirmation : f.needConfirm === "no" ? !o.needConfirmation : true;
      return passSearch && passStatus && passPayStatus && passPayMethod && passDelivery && passMin && passMax && passNeedConfirm;
    });
  };

  const filtered = useMemo(() => {
    const arr = applyFilters(orders, filters);
    return [...arr].sort((a, b) => {
      const da = parseRuDate(a.date);
      const db = parseRuDate(b.date);
      return sort.dir === "desc" ? db - da : da - db;
    });
  }, [orders, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const visibleOrders = filtered.slice(start, end);

  // Runtime tests (do not change unless broken)
  useEffect(() => {
    console.assert(statuses[0] === "NEW", "[TEST] start NEW");
    console.assert(statuses[statuses.length - 1] === "COMPLETED", "[TEST] last COMPLETED");
    console.assert(statuses.includes("CANCELED"), "[TEST] contains CANCELED");
    console.assert(statuses.indexOf("SHIPPING") < statuses.indexOf("DELIVERED"), "[TEST] SHIPPING before DELIVERED");
    const def = normalizeOrder({});
    console.assert(def.status === "NEW" && def.paymentStatus === "Не оплачен", "[TEST] normalizeOrder defaults");
    orders.forEach((o) => console.assert(["Оплачен", "Не оплачен"].includes(o.paymentStatus), "[TEST] payment statuses 2-way"));
    console.assert(SELECT_ALL === "__all__", "[TEST] SELECT_ALL sentinel");
    console.assert(statuses.indexOf(order.status) !== -1, "[TEST] current order status is valid");
    console.assert(products.length > 0, "[TEST] products exist");
    console.assert(parseRuDate("16.01.2025 11:10") > parseRuDate("15.01.2025 13:30"), "[TEST] parseRuDate ordering");
  }, []);

  const PaymentStatus = ({ status }: { status: string }) => {
    const paid = status === "Оплачен";
    const root = paid
      ? "inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
      : "inline-flex items-center gap-1 text-xs font-medium text-rose-700";
    const dot = paid ? "bg-emerald-600" : "bg-rose-600";
    const emoji = paid ? "✅" : "⛔";
    return (
      <span className={root}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`}></span>
        <span className="-ml-0.5">{emoji}</span>
        {status}
      </span>
    );
  };

  const StatusPills = ({ current }: { current: string }) => {
    const currentIdx = statuses.indexOf(current);
    return (
      <div className="flex flex-wrap gap-1 max-w-[360px]">
        {statuses.map((s, i) => {
          const isCurrent = i === currentIdx;
          const isPast = i < currentIdx;
          const base = "text-[10px] leading-4 px-2 py-1 rounded-full border";
          const cls = isCurrent
            ? "bg-indigo-600 text-white border-indigo-600"
            : isPast
            ? "bg-gray-200 text-gray-600 border-gray-300"
            : "bg-white text-gray-400 border-gray-200";
          return (
            <span key={s} className={`${base} ${cls}`} title={s}>
              {s}
            </span>
          );
        })}
      </div>
    );
  };

  if (view === "list") {
    return (
      <div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-gray-50 min-h-screen space-y-12">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Управление заказами</h1>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                {searchOpen && (
                  <Input
                    autoFocus
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setPage(1);
                    }}
                    placeholder="Поиск: ID, клиент, телефон, email..."
                    className="w-64 mr-2 h-9"
                  />
                )}
                <Button variant="outline" size="icon" onClick={() => setSearchOpen((v) => !v)} title="Поиск">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Card className="border border-gray-200 rounded-xl shadow-md bg-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-2 items-end text-sm">
                <div className="col-span-3">
                  <label className="block text-[11px] text-gray-500 mb-1">Дата</label>
                  <div className="flex items-center gap-2">
                    <Input className="h-9" placeholder="ДД.ММ.ГГГГ" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                    <span className="text-gray-400">—</span>
                    <Input className="h-9" placeholder="ДД.ММ.ГГГГ" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Тип доставки</label>
                  <Select value={filters.deliveryType || undefined} onValueChange={(v) => { setFilters({ ...filters, deliveryType: v === SELECT_ALL ? "" : v }); setPage(1); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL}>Все</SelectItem>
                      <SelectItem value="Курьер">Курьер</SelectItem>
                      <SelectItem value="Самовывоз">Самовывоз</SelectItem>
                      <SelectItem value="СДЭК">СДЭК</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Способ оплаты</label>
                  <Select value={filters.payMethod || undefined} onValueChange={(v) => { setFilters({ ...filters, payMethod: v === SELECT_ALL ? "" : v }); setPage(1); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL}>Все</SelectItem>
                      <SelectItem value="Карта">Банковская карта</SelectItem>
                      <SelectItem value="СБП">СБП</SelectItem>
                      <SelectItem value="Кредит">Кредит</SelectItem>
                      <SelectItem value="Рассрочка">Рассрочка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Статус оплаты</label>
                  <Select value={filters.payStatus || undefined} onValueChange={(v) => { setFilters({ ...filters, payStatus: v === SELECT_ALL ? "" : v }); setPage(1); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL}>Все</SelectItem>
                      <SelectItem value="Оплачен">Оплачен</SelectItem>
                      <SelectItem value="Не оплачен">Не оплачен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Стоимость</label>
                  <div className="flex items-center gap-2">
                    <Input className="h-9" placeholder="от" value={filters.costMin} onChange={(e) => { setFilters({ ...filters, costMin: e.target.value }); setPage(1); }} />
                    <span className="text-gray-400">—</span>
                    <Input className="h-9" placeholder="до" value={filters.costMax} onChange={(e) => { setFilters({ ...filters, costMax: e.target.value }); setPage(1); }} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Нужно подтверждение</label>
                  <Select value={filters.needConfirm || undefined} onValueChange={(v) => { setFilters({ ...filters, needConfirm: v === SELECT_ALL ? "" : v }); setPage(1); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL}>Все</SelectItem>
                      <SelectItem value="yes">Да</SelectItem>
                      <SelectItem value="no">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] text-gray-500 mb-1">Статус заказа</label>
                  <Select value={filters.orderStatus || undefined} onValueChange={(v) => { setFilters({ ...filters, orderStatus: v === SELECT_ALL ? "" : v }); setPage(1); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL}>Все</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 flex gap-2 justify-end pt-1">
                  {isFiltered && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({ search: "", dateFrom: "", dateTo: "", deliveryType: "", payMethod: "", payStatus: "", costMin: "", costMax: "", orderStatus: "", needConfirm: "" });
                        setPage(1);
                      }}
                    >
                      Сбросить
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 rounded-xl shadow-md bg-white">
            <CardContent className="p-0">
              <table className="w-full text-sm table-fixed">
                <thead className="text-gray-500 border-b border-gray-200">
                  <tr className="text-left">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-4 py-3">
                      <button className="inline-flex items-center gap-1 text-gray-700 hover:text-indigo-600" onClick={() => setSort((s) => ({ by: "date", dir: s.dir === "desc" ? "asc" : "desc" }))}>
                        Дата
                        <ArrowUpDown className="w-4 h-4 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Сводка заказа</th>
                    <th className="px-4 py-3">Клиент</th>
                    <th className="px-4 py-3">Доставка</th>
                    <th className="px-4 py-3">Оплата</th>
                    <th className="px-6 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleOrders.map((o) => {
                    const qty = o.items.reduce((a, i) => a + i.quantity, 0);
                    const total = o.items.reduce((a, i) => a + i.price * i.quantity, 0) - (o.discount || 0);
                    return (
                      <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setOrder(normalizeOrder(o)); setView("detail"); }}>
                        <td className="px-6 py-3 font-semibold text-indigo-600">#{o.id}</td>
                        <td className="px-4 py-3">{o.date}</td>
                        <td className="px-4 py-3 space-y-1">
                          <div className="text-xs text-gray-500"><span className="mr-1 opacity-70">📦</span>Позиций: {qty}</div>
                          <div className="text-xs text-green-600">Скидка: {o.discount || 0} ₽</div>
                          <div className="text-sm text-gray-900 font-medium">Итого: {total} ₽</div>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <div className="font-medium">{o.client.name}</div>
                          <div className="text-gray-500 text-xs"><span className="font-medium text-gray-600">Телефон:</span> {o.client.phone}</div>
                          <div className="text-gray-500 text-xs"><span className="font-medium text-gray-600">Email:</span> {o.client.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">{o.delivery.type}</span></div>
                          <div className="text-xs text-gray-500"><span className="font-medium text-gray-600">Адрес:</span> {o.delivery.city}, {o.delivery.address}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{o.payment}</span></div>
                          <PaymentStatus status={o.paymentStatus} />
                        </td>
                        <td className="py-3 align-top">
                          <StatusPills current={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-6 py-4 text-sm">
                <div className="text-gray-500">
                  Показаны {start + 1}–{Math.min(end, filtered.length)} из {filtered.length}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</Button>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
                  ))}
                  <Button variant="outline" disabled={currentPage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Вперёд</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-gray-50 min-h-screen space-y-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setView("list")} title="К списку заказов">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Заказ #{order.id}</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{order.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={handleSave}>Сохранить</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {statuses.map((s, i) => {
            const currentIndex = statuses.indexOf(order.status);
            const done = i <= currentIndex;
            return (
              <div key={s} className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${done ? "bg-indigo-600" : "bg-gray-300"}`}></div>
                <span className={`ml-2 text-xs ${done ? "text-indigo-700 font-medium" : "text-gray-400"}`}>{s}</span>
                {i < statuses.length - 1 && (
                  <div className={`mx-2 w-10 h-0.5 ${done ? "bg-indigo-400" : "bg-gray-200"}`}></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-8 col-span-1">
            <Card className="border border-gray-200 rounded-xl bg-white">
              <CardHeader className="px-6 py-4">
                <CardTitle>Информация о заказе</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm text-gray-700">
                <p><b>Дата заказа:</b> {order.date}</p>
                <div>
                  <label className="block mb-1 text-gray-500">Статус заказа</label>
                  <Select value={order.status} onValueChange={(v) => setOrder({ ...order, status: v as Order["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-500">Тип оплаты</label>
                  <Select value={order.payment} onValueChange={(v) => setOrder({ ...order, payment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Карта">Банковская карта</SelectItem>
                      <SelectItem value="Рассрочка">Рассрочка</SelectItem>
                      <SelectItem value="СБП">СБП</SelectItem>
                      <SelectItem value="Кредит">Кредит</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-500">Статус оплаты</label>
                  <Select value={order.paymentStatus} onValueChange={(v) => setOrder({ ...order, paymentStatus: v as Order["paymentStatus"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Оплачен">Оплачен</SelectItem>
                      <SelectItem value="Не оплачен">Не оплачен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-600">Требуется подтверждение менеджера</span>
                  <input type="checkbox" checked={order.needManagerHelp} onChange={(e) => setOrder({ ...order, needManagerHelp: e.target.checked })} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 rounded-xl bg-white">
              <CardHeader className="px-6 py-4"><CardTitle>Информация о клиенте</CardTitle></CardHeader>
              <CardContent className="p-6 text-sm text-gray-700 space-y-3">
                <div>
                  <label className="block mb-1 text-gray-500">Имя</label>
                  <Input value={order.client.name} onChange={(e) => updateClient("name", e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-gray-500">Телефон</label>
                  <Input value={order.client.phone} onChange={(e) => updateClient("phone", e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-gray-500">Email</label>
                  <Input value={order.client.email} onChange={(e) => updateClient("email", e.target.value)} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-600">Другой получатель</span>
                  <Switch checked={order.recipient.enabled} onCheckedChange={(v) => setOrder((prev) => ({ ...prev, recipient: { ...prev.recipient, enabled: v } }))} />
                </div>
                {order.recipient.enabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block mb-1 text-gray-500">ФИО получателя</label>
                      <Input value={order.recipient.name} onChange={(e) => setOrder((prev) => ({ ...prev, recipient: { ...prev.recipient, name: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500">Телефон получателя</label>
                      <Input value={order.recipient.phone} onChange={(e) => setOrder((prev) => ({ ...prev, recipient: { ...prev.recipient, phone: e.target.value } }))} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 rounded-xl bg-white">
              <CardHeader className="px-6 py-4"><CardTitle>Доставка</CardTitle></CardHeader>
              <CardContent className="p-6 text-sm text-gray-700 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Тип доставки</label>
                    <Select value={order.delivery.type} onValueChange={(v) => updateDelivery("type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Курьер">Курьер</SelectItem>
                        <SelectItem value="Самовывоз">Самовывоз</SelectItem>
                        <SelectItem value="СДЭК">СДЭК</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Стоимость доставки</label>
                    <Input value={order.delivery.cost as any} onChange={(e) => updateDelivery("cost", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-medium">Город</label>
                  <Select value={order.delivery.city} onValueChange={(v) => updateDelivery("city", v)}>
                    <SelectTrigger><SelectValue placeholder="Выберите город" /></SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-medium">Адрес:</label>
                  <Input value={order.delivery.address} onChange={(e) => updateDelivery("address", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Планируемая дата</label>
                    <Input type="date" value={order.delivery.date} onChange={(e) => updateDelivery("date", e.target.value)} />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Интервал времени</label>
                    <Input value={order.delivery.interval} onChange={(e) => updateDelivery("interval", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-medium">Комментарий</label>
                  <Textarea value={order.delivery.comment} onChange={(e) => updateDelivery("comment", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 col-span-2">
            <Card className="border border-gray-200 rounded-xl bg-white">
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Состав заказа</CardTitle>
                  <div className="flex items-center gap-2">
                    {itemsEditMode ? (
                      <>
                        <Button variant="outline" onClick={addItem}>+ Добавить</Button>
                        <Button variant="ghost" onClick={cancelItemsEdit}>Отменить</Button>
                        <Button onClick={saveItemsEdit}>Сохранить</Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={beginItemsEdit}>Редактировать</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm border rounded-md overflow-hidden">
                  <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr className="text-left">
                      <th className="px-3 py-3 w-8">#</th>
                      <th className="py-3 pl-14 pr-3">Название</th>
                      <th>Артикул</th>
                      <th>Размер</th>
                      <th>Количество</th>
                      <th>Цена за ед.</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-3 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={imgForItem(item)} alt="Товар" className="w-10 h-10 rounded-md object-cover border" />
                            {itemsEditMode ? (
                              <Select value={item.name || undefined} onValueChange={(v) => setProductByName(item.id, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.sku} value={p.name}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : item.name ? (
                              <a href={productUrl(item.sku)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                {item.name}
                              </a>
                            ) : (
                              <span className="text-gray-400">Не выбран</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {itemsEditMode ? (
                            <Select value={item.sku || undefined} onValueChange={(v) => setProductBySku(item.id, v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.sku} value={p.sku}>{p.sku}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-gray-700">{item.sku || "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {itemsEditMode ? (
                            <Select
                              value={item.size ? String(item.size) : undefined}
                              onValueChange={(v) => updateItem(item.id, "size", /^\d+$/.test(v) ? Number(v) : v)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {sizesForSku(item.sku).map((s) => (
                                  <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-gray-700">{item.size || "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => decQty(item.id)}>-</Button>
                            <span className="min-w-[2ch] text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" onClick={() => incQty(item.id)}>+</Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">{item.price} ₽</td>
                        <td className="px-4 py-3 font-medium">{item.price * item.quantity} ₽</td>
                        <td className="px-4 py-3 text-right">
                          {itemsEditMode && (
                            <div className="inline-flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => cloneItem(item.id)} title="Клонировать"><Copy className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} title="Удалить"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end gap-8 p-4 text-sm">
                  <div className="text-green-600">Скидка: {order.discount} ₽</div>
                  <div className="font-semibold">Итого: {totalSum - (order.discount || 0)} ₽</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 rounded-xl bg-white">
              <CardHeader className="px-6 py-4"><CardTitle>Комментарии менеджера</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-4">
                {order.comments.length === 0 ? (
                  <div className="text-sm text-gray-500">Комментариев пока нет</div>
                ) : (
                  <div className="space-y-2">
                    {order.comments.map((c) => (
                      <div key={c.id} className="border rounded-md p-3 bg-gray-50">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{c.author}</span>
                          <span>{c.date}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-800">{c.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Добавить комментарий..." />
                  <div className="text-right">
                    <Button onClick={addComment}>Добавить комментарий</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
