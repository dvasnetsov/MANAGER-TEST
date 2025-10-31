import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash2, ArrowLeft, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const statuses = [
  "NEW",
  "RESERVE_ATTEMPTION",
  "RESERVED",
  "CONFIRMED",
  "NEEDS_CLARIFICATION",
  "SHIPPING",
  "DELIVERED",
  "CANCELED",
  "COMPLETED"
];

const products = [
  { name: "Кольцо с бриллиантом", sku: "KB-001", price: 7950, sizes: [16, 17, 18] },
  { name: "Серьги золотые", sku: "ER-210", price: 5600, sizes: ["—"] },
  { name: "Подвеска с сапфиром", sku: "PN-078", price: 11200, sizes: ["—"] },
];

const SELECT_ALL = "__all__";

function normalizeOrder(raw: any) {
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
    paymentStatus: raw?.paymentStatus ?? "Не оплачен",
    status: raw?.status ?? "NEW",
    needManagerHelp: raw?.needManagerHelp ?? false,
    recipient: raw?.recipient ?? { enabled: false, name: "", phone: "" },
    comments: raw?.comments ?? [],
    items: raw?.items ?? [],
  };
}

export default function OrdersDashboard() {
  const [view, setView] = useState<"list" | "detail">("list");

  const orders = [
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
      items: [
        { id: 1, name: "Кольцо с бриллиантом", sku: "KB-001", size: 17, quantity: 2, price: 7950 },
      ],
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
      items: [
        { id: 2, name: "Серьги золотые", sku: "ER-210", size: "—", quantity: 1, price: 5600 },
        { id: 3, name: "Подвеска с сапфиром", sku: "PN-078", size: "—", quantity: 1, price: 11200 },
      ],
    },
  ];

  const [order, setOrder] = useState(() => normalizeOrder(orders[0]));
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
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [searchOpen, setSearchOpen] = useState(false);

  const sizesForSku = (sku: string) => {
    const p = products.find((x) => x.sku === sku);
    return p?.sizes ?? ["—"];
  };
  const totalSum = order.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
  const updateClient = (field: string, value: any) => setOrder((prev) => ({ ...prev, client: { ...prev.client, [field]: value } }));
  const updateDelivery = (field: string, value: any) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, [field]: value } }));

  // Items
  const addItem = () => {
    const base = products[0];
    const newItem = { id: Date.now(), name: base.name, sku: base.sku, size: (base.sizes as any)[0] ?? "—", quantity: 1, price: base.price };
    setOrder((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };
  const updateItem = (id: number, field: string, value: any) => {
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
  const cloneItem = (id: number) => setOrder((prev) => {
    const it = prev.items.find((x) => x.id === id);
    if (!it) return prev;
    return { ...prev, items: [...prev.items, { ...it, id: Date.now() }] };
  });
  const removeItem = (id: number) => setOrder((prev) => ({ ...prev, items: prev.items.filter((x) => x.id !== id) }));

  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { id: Date.now(), author: "Менеджер Петрова", date: new Date().toLocaleDateString(), text: newComment.trim() };
    setOrder((prev) => ({ ...prev, comments: [...prev.comments, c] }));
    setNewComment("");
  };

  const handleSave = () => {
    console.log("SAVE_ORDER", order);
    alert("Изменения сохранены (демо)");
  };

  const applyFilters = (list: any[], f: any) => {
    return list.filter((o) => {
      const sum = o.items.reduce((a: number, i: any) => a + i.price * i.quantity, 0) - (o.discount || 0);
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

  const filtered = useMemo(() => applyFilters(orders, filters), [orders, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const visibleOrders = filtered.slice(start, end);

  useEffect(() => {
    console.assert(statuses[0] === "NEW", "[TEST] start NEW");
    console.assert(statuses[statuses.length - 1] === "COMPLETED", "[TEST] last COMPLETED");
  }, []);

  const PaymentStatus = ({ status }: { status: string }) => {
    const map: Record<string, { cls: string; emoji: string }> = {
      "Оплачен": { cls: "text-green-600", emoji: "✅" },
      "Не оплачен": { cls: "text-red-600", emoji: "⛔" },
      "Частично": { cls: "text-amber-600", emoji: "🟡" },
    };
    const conf = map[status] || { cls: "text-gray-600", emoji: "" };
    return <div className={`text-xs ${conf.cls}`}>{conf.emoji} {status}</div>;
  };

  if (view === "list") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-gray-50 min-h-screen space-y-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Управление заказами</h1>
          <div className="relative flex items-center">
            {searchOpen && (
              <Input
                autoFocus
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                placeholder="Поиск: ID, клиент, телефон, email..."
                className="w-64 mr-2 h-9"
              />
            )}
            <Button variant="outline" size="icon" onClick={() => setSearchOpen((v) => !v)} title="Поиск">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 rounded-xl shadow-sm">
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
                    <SelectItem value="Частично">Частично</SelectItem>
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
                <Button variant="outline" onClick={() => { setFilters({ search: "", dateFrom: "", dateTo: "", deliveryType: "", payMethod: "", payStatus: "", costMin: "", costMax: "", orderStatus: "", needConfirm: "" }); setPage(1); }}>Сбросить</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b">
                <tr className="text-left">
                  <th className="py-2">ID</th>
                  <th>Дата</th>
                  <th>Сводка заказа</th>
                  <th>Клиент</th>
                  <th>Доставка</th>
                  <th>Оплата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((o) => {
                  const qty = o.items.reduce((a, i) => a + i.quantity, 0);
                  const total = o.items.reduce((a, i) => a + i.price * i.quantity, 0) - (o.discount || 0);
                  return (
                    <tr key={o.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setOrder(normalizeOrder(o)); setView("detail"); }}>
                      <td className="py-3 font-semibold text-indigo-600">#{o.id}</td>
                      <td className="py-3">{o.date}</td>
                      <td className="py-3">
                        <div className="text-xs text-gray-500"><span className="mr-1 opacity-70">📦</span>Позиций: {qty}</div>
                        <div className="text-xs text-green-600">Скидка: {o.discount || 0} ₽</div>
                        <div className="text-sm text-gray-900 font-medium">Итого: {total} ₽</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{o.client.name}</div>
                        <div className="text-gray-500 text-xs">{o.client.phone}</div>
                        <div className="text-gray-500 text-xs">{o.client.email}</div>
                      </td>
                      <td className="py-3">
                        <div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">{o.delivery.type}</span></div>
                        <div className="text-xs text-gray-500">{o.delivery.city}, {o.delivery.address}</div>
                      </td>
                      <td className="py-3">
                        <div className="mb-1"><span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{o.payment}</span></div>
                        <PaymentStatus status={o.paymentStatus} />
                      </td>
                      <td className="py-3">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{o.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-gray-500">Показаны {start + 1}–{Math.min(end, filtered.length)} из {filtered.length}</div>
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
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-gray-50 min-h-screen space-y-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")} title="К списку заказов">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Заказ #{order.id}</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{order.status}</span>
        </div>
        <Button variant="default" onClick={handleSave}>Сохранить</Button>
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
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Информация о заказе</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-sm text-gray-700">
              <p><b>Дата заказа:</b> {order.date}</p>
              <div>
                <label className="block mb-1 text-gray-500">Статус заказа</label>
                <Select value={order.status} onValueChange={(v) => setOrder({ ...order, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                <Select value={order.paymentStatus} onValueChange={(v) => setOrder({ ...order, paymentStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Оплачен">Оплачен</SelectItem>
                    <SelectItem value="Не оплачен">Не оплачен</SelectItem>
                    <SelectItem value="Частично">Частично</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-600">Требуется подтверждение менеджера</span>
                <input type="checkbox" checked={order.needManagerHelp} onChange={(e) => setOrder({ ...order, needManagerHelp: e.target.checked })} />
              </div>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
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
                  <Input value={order.delivery.cost} onChange={(e) => updateDelivery("cost", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-gray-600 font-medium">Город</label>
                <Input value={order.delivery.city} onChange={(e) => updateDelivery("city", e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-gray-600 font-medium">Адрес доставки</label>
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
          <Card>
            <CardHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify между w-full">
                <CardTitle>Состав заказа</CardTitle>
                <Button variant="outline" onClick={addItem}>+ Добавить</Button>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm border rounded-md overflow-hidden">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr className="text-left">
                    <th className="px-3 py-3 w-8">#</th>
                    <th className="px-3 py-3">Название</th>
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
                      <td className="py-3">
                        <Select value={item.name} onValueChange={(v) => setProductByName(item.id, v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (<SelectItem key={p.sku} value={p.name}>{p.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3">
                        <Select value={item.sku} onValueChange={(v) => setProductBySku(item.id, v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (<SelectItem key={p.sku} value={p.sku}>{p.sku}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3">
                        <Select value={String(item.size)} onValueChange={(v) => updateItem(item.id, "size", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {sizesForSku(item.sku).map((sz) => (<SelectItem key={String(sz)} value={String(sz)}>{String(sz)}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => decQty(item.id)}>-</Button>
                          <div className="w-8 text-center">{item.quantity}</div>
                          <Button variant="outline" size="icon" onClick={() => incQty(item.id)}>+</Button>
                        </div>
                      </td>
                      <td className="py-3">{item.price} ₽</td>
                      <td className="py-3">{item.quantity * item.price} ₽</td>
                      <td className="pr-2 py-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => setOrder((prev) => ({ ...prev, items: [...prev.items, { ...item, id: Date.now() }] }))}><Copy className="w-4 h-4 text-gray-500 hover:text-gray-800" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-4">
                <div className="text-green-600 text-sm">Скидка: -{order.discount} ₽</div>
                <div className="text-gray-900 text-lg font-medium">Итого: {totalSum} ₽</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4"><CardTitle>Комментарии менеджера</CardTitle></CardHeader>
            <CardContent className="p-6 text-sm text-gray-700 space-y-4">
              {order.comments.length === 0 ? (
                <p className="text-gray-400 text-center">Комментариев пока нет</p>
              ) : (
                <div className="space-y-3">
                  {order.comments.map((c) => (
                    <div key={c.id} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{c.date}</span><span>{c.author}</span></div>
                      <div className="text-gray-800">{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <Textarea placeholder="Добавить комментарий..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 w-full" onClick={addComment}>✈ Добавить комментарий</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
