/* ==========================================
   POS หมี่ไก่ฉีก — Application Logic
   ========================================== */

// ---- DEFAULT DATA ----
const defaultMenuItems = [
  {
    id: 1, name: "หมี่ไก่ฉีกดั้งเดิม", category: "อาหาร", price: 59, stock: 20,
    detail: "เส้นหมี่คลุกซอสสูตรพิเศษ พร้อมไก่ฉีกนุ่ม ๆ",
    ingredients: [
      { name: "เส้นหมี่",   unit: "g",  amountPer: 150 },
      { name: "ไก่ฉีก",    unit: "g",  amountPer: 80  },
      { name: "ซอสพิเศษ",  unit: "ml", amountPer: 30  },
    ],
  },
  {
    id: 2, name: "หมี่ไก่ฉีกเผ็ด", category: "อาหาร", price: 65, stock: 15,
    detail: "รสเผ็ดจัดจ้าน หอมพริกคั่ว",
    ingredients: [
      { name: "เส้นหมี่",  unit: "g", amountPer: 150 },
      { name: "ไก่ฉีก",   unit: "g", amountPer: 80  },
      { name: "พริกคั่ว", unit: "g", amountPer: 15  },
    ],
  },
  {
    id: 3, name: "หมี่ไก่ฉีกไข่ออนเซ็น", category: "อาหาร", price: 79, stock: 10,
    detail: "เพิ่มไข่ออนเซ็นเยิ้ม ๆ",
    ingredients: [
      { name: "เส้นหมี่",   unit: "g",    amountPer: 150 },
      { name: "ไก่ฉีก",    unit: "g",    amountPer: 80  },
      { name: "ไข่ออนเซ็น", unit: "ฟอง", amountPer: 1   },
    ],
  },
  {
    id: 4, name: "เกี๊ยวทอด", category: "ของทานเล่น", price: 39, stock: 30,
    detail: "เกี๊ยวทอดกรอบ เสิร์ฟพร้อมน้ำจิ้ม",
    ingredients: [
      { name: "เกี๊ยว",      unit: "ชิ้น", amountPer: 6  },
      { name: "น้ำมันทอด",  unit: "ml",   amountPer: 50 },
    ],
  },
  {
    id: 5, name: "ชาไทย", category: "เครื่องดื่ม", price: 35, stock: 25,
    detail: "ชาไทยหอมหวาน ดื่มเย็น ๆ",
    ingredients: [
      { name: "ชาไทย",      unit: "g",  amountPer: 20 },
      { name: "นมข้นหวาน", unit: "ml", amountPer: 30 },
      { name: "น้ำตาล",    unit: "g",  amountPer: 10 },
    ],
  },
  {
    id: 6, name: "น้ำเปล่า", category: "เครื่องดื่ม", price: 15, stock: 50,
    detail: "น้ำดื่มเย็น ๆ",
    ingredients: [
      { name: "น้ำดื่ม", unit: "ml", amountPer: 500 },
    ],
  },
];

// ---- STATE ----
let menuItems = JSON.parse(localStorage.getItem("noodleMenuItems") || "null");
if (!menuItems) {
  menuItems = defaultMenuItems;
  localStorage.setItem("noodleMenuItems", JSON.stringify(menuItems));
}

let cart             = [];
let selectedCategory = "ทั้งหมด";
let staffFilter      = "ทั้งหมด";
let payingOrderId    = null;
let selectedPayMethod = "cash";
let customMsgOrderId  = null;
let currentInvTab     = "ingredients";
let ingredientRowCount = 0;

let orders    = JSON.parse(localStorage.getItem("noodleOrders")    || "[]");
let inventory = JSON.parse(localStorage.getItem("noodleInventory") || "null");

// Init inventory on first run
if (!inventory) {
  inventory = {};
  menuItems.forEach(item => {
    inventory[item.id] = { stock: item.stock, sold: 0, maxStock: item.stock };
  });
  saveInventory();
} else {
  menuItems.forEach(item => {
    if (!inventory[item.id]) {
      inventory[item.id] = { stock: item.stock, sold: 0, maxStock: item.stock };
    }
  });
}

let ingredientUsage = JSON.parse(localStorage.getItem("noodleIngredients") || "null");
if (!ingredientUsage) {
  ingredientUsage = {};
  saveIngredientUsage();
}

// ---- SAVE HELPERS ----
function saveOrders()          { localStorage.setItem("noodleOrders",      JSON.stringify(orders));          }
function saveInventory()       { localStorage.setItem("noodleInventory",   JSON.stringify(inventory));       }
function saveMenuItems()       { localStorage.setItem("noodleMenuItems",   JSON.stringify(menuItems));       }
function saveIngredientUsage() { localStorage.setItem("noodleIngredients", JSON.stringify(ingredientUsage)); }

function money(n) { return n.toLocaleString("th-TH") + " บาท"; }

// ---- MENU ----
function setCategory(category, button) {
  selectedCategory = category;
  document.querySelectorAll(".category-buttons button").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  renderMenu();
}

function renderMenu() {
  const search   = document.getElementById("searchInput").value.toLowerCase();
  const filtered = menuItems.filter(item => {
    const matchCat  = selectedCategory === "ทั้งหมด" || item.category === selectedCategory;
    const matchName = item.name.toLowerCase().includes(search);
    return matchCat && matchName;
  });

  const grid = document.getElementById("menuGrid");
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty">ไม่พบเมนูที่ค้นหา</div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const inv = inventory[item.id];
    const qty = inv ? inv.stock : 0;
    let stockClass = "stock-ok";
    let stockText  = `เหลือ ${qty} จาน`;
    if (qty === 0)       { stockClass = "stock-out"; stockText = "หมดแล้ว"; }
    else if (qty <= 5)   { stockClass = "stock-low"; stockText = `เหลือ ${qty} จาน ⚠️`; }

    return `
      <div class="menu-card">
        <h3>${item.name}</h3>
        <p>${item.detail}</p>
        <small>${item.category}</small><br>
        <span class="stock-badge ${stockClass}">${stockText}</span><br>
        <span class="price">${money(item.price)}</span>
        <br><br>
        <button class="primary" onclick="addToCart(${item.id})" ${qty === 0 ? "disabled" : ""}>
          ${qty === 0 ? "หมดแล้ว" : "เพิ่มลงตะกร้า"}
        </button>
      </div>
    `;
  }).join("");
}

// ---- CART ----
function addToCart(id) {
  const item = menuItems.find(m => m.id === id);
  if (!item) return;
  const inv = inventory[id];
  if (!inv || inv.stock <= 0) { alert("สินค้าหมดแล้ว"); return; }

  const existing   = cart.find(c => c.id === id);
  const currentQty = existing ? existing.quantity : 0;
  if (currentQty >= inv.stock) {
    alert(`สินค้าในคลังเหลือ ${inv.stock} จานเท่านั้น`);
    return;
  }

  if (existing) existing.quantity++;
  else          cart.push({ ...item, quantity: 1 });
  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  if (amount > 0) {
    const inv = inventory[id];
    if (item.quantity >= inv.stock) {
      alert(`สินค้าในคลังเหลือ ${inv.stock} จานเท่านั้น`);
      return;
    }
  }

  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(c => c.id !== id);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

function getTotal() {
  return cart.reduce((t, i) => t + i.price * i.quantity, 0);
}

function renderCart() {
  const cartList = document.getElementById("cartList");
  cartList.innerHTML = cart.length
    ? cart.map(item => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong><br>
            <small>${money(item.price * item.quantity)}</small>
          </div>
          <div class="cart-controls">
            <button class="small" onclick="changeQuantity(${item.id}, -1)">−</button>
            <span>${item.quantity}</span>
            <button class="small" onclick="changeQuantity(${item.id}, 1)">+</button>
            <button class="danger small" onclick="removeFromCart(${item.id})">ลบ</button>
          </div>
        </div>
      `).join("")
    : `<div class="empty">ยังไม่มีสินค้าในตะกร้า</div>`;

  document.getElementById("cartTotal").textContent = money(getTotal());
}

function submitOrder() {
  if (!cart.length) { alert("กรุณาเลือกเมนูก่อนส่งคำสั่งซื้อ"); return; }

  const name = document.getElementById("customerName").value.trim() || "ลูกค้าหน้าร้าน";
  const note = document.getElementById("customerNote").value.trim();

  // Deduct stock & track ingredient usage
  cart.forEach(cartItem => {
    if (inventory[cartItem.id]) {
      inventory[cartItem.id].stock -= cartItem.quantity;
      inventory[cartItem.id].sold  += cartItem.quantity;
      if (inventory[cartItem.id].stock < 0) inventory[cartItem.id].stock = 0;
    }
    const menuDef = menuItems.find(m => m.id === cartItem.id);
    if (menuDef && menuDef.ingredients) {
      menuDef.ingredients.forEach(ing => {
        if (!ingredientUsage[ing.name]) ingredientUsage[ing.name] = { totalUsed: 0, unit: ing.unit };
        ingredientUsage[ing.name].totalUsed += ing.amountPer * cartItem.quantity;
      });
    }
  });
  saveInventory();
  saveIngredientUsage();

  const order = {
    id:        "MK" + String(Date.now()).slice(-5),
    name,
    note,
    items:     cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
    total:     getTotal(),
    status:    "รอรับออเดอร์",
    message:   "ได้รับออเดอร์แล้ว กำลังรอพนักงานรับรายการ",
    time:      new Date().toLocaleString("th-TH"),
    paid:      false,
    payMethod: null,
  };

  orders.unshift(order);
  saveOrders();

  cart = [];
  document.getElementById("customerName").value = "";
  document.getElementById("customerNote").value = "";
  renderCart();
  renderMenu();
  renderCustomerStatus();
  alert("ส่งคำสั่งซื้อเรียบร้อย เลขออเดอร์คือ " + order.id);
}

// ---- CUSTOMER STATUS ----
function renderCustomerStatus() {
  const box    = document.getElementById("customerOrderStatus");
  const notice = document.getElementById("customerNotice");
  const order  = orders[0];

  if (!order) {
    box.innerHTML    = `<div class="empty">ยังไม่มีออเดอร์ล่าสุด</div>`;
    notice.innerHTML = "";
    return;
  }

  const payBadge = order.paid
    ? `<span class="badge paid">✅ ชำระแล้ว (${order.payMethod})</span>`
    : `<span class="badge" style="background:#fde8e8;color:#c94c4c">ยังไม่ชำระ</span>`;

  box.innerHTML = `
    <div class="order-card">
      <div class="order-head">
        <strong>ออเดอร์ #${order.id}</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge ${getBadgeClass(order.status)}">${order.status}</span>
          ${payBadge}
        </div>
      </div>
      <p>${order.message}</p>
      <p>ผู้สั่ง: ${order.name}</p>
      <p>ยอดรวม: <strong>${money(order.total)}</strong></p>
      <small>${order.time}</small>
    </div>
  `;

  notice.innerHTML = `
    <div class="notice">
      <strong>แจ้งเตือนออเดอร์ #${order.id}</strong>
      ${order.message}
    </div>
  `;
}

function getBadgeClass(status) {
  if (status === "รอรับออเดอร์") return "waiting";
  if (status === "กำลังเตรียม")  return "preparing";
  if (status === "พร้อมรับ")     return "ready";
  return "done";
}

// ---- STAFF ----
function renderStaffOrders() {
  const container = document.getElementById("staffOrders");
  const filtered  = staffFilter === "ทั้งหมด"
    ? orders
    : orders.filter(o => o.status === staffFilter || (staffFilter === "ชำระแล้ว" && o.paid));

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">ยังไม่มีออเดอร์ในสถานะนี้</div>`;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const payBadge = order.paid
      ? `<span class="badge paid">✅ ชำระแล้ว</span>`
      : `<span class="badge" style="background:#fde8e8;color:#c94c4c">ยังไม่ชำระ</span>`;
    const isDone = order.status === "เสร็จสิ้น";

    return `
      <div class="order-card" id="orderCard_${order.id}">
        <div class="order-head">
          <div>
            <h3>ออเดอร์ #${order.id}</h3>
            <div>${order.name}</div>
            <small>${order.time}</small>
          </div>
          <div style="display:flex;gap:8px;flex-direction:column;align-items:flex-end">
            <span class="badge ${getBadgeClass(order.status)}">${order.status}</span>
            ${payBadge}
          </div>
        </div>

        <p>${order.items.map(item => `${item.name} x ${item.quantity}`).join("<br>")}</p>
        ${order.note ? `<p><strong>หมายเหตุ:</strong> ${order.note}</p>` : ""}
        <p>ยอดรวม: <strong>${money(order.total)}</strong></p>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          ${!isDone
            ? `<button class="primary" onclick="updateOrder('${order.id}')">เปลี่ยนสถานะ →</button>`
            : ""
          }
          <button class="warning" onclick="sendCustomMessage('${order.id}')">แจ้งลูกค้า</button>
          ${!order.paid
            ? `<button class="success" onclick="openPaymentModal('${order.id}')">
                💳 ${isDone ? "รับชำระเงิน" : "ชำระได้เลย"}
               </button>`
            : ""
          }
        </div>
      </div>
    `;
  }).join("");
}

function updateOrder(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  const flow = ["รอรับออเดอร์", "กำลังเตรียม", "พร้อมรับ", "เสร็จสิ้น"];
  const idx  = flow.indexOf(order.status);
  if (idx === flow.length - 1) return;

  order.status = flow[idx + 1];

  const messages = {
    "รอรับออเดอร์": "ได้รับออเดอร์แล้ว กำลังรอพนักงานรับรายการ",
    "กำลังเตรียม":  "พนักงานรับออเดอร์แล้ว กำลังเตรียมอาหาร",
    "พร้อมรับ":     "อาหารพร้อมรับแล้ว กรุณามารับที่หน้าร้าน",
    "เสร็จสิ้น":    "ออเดอร์เสร็จสิ้น ขอบคุณที่ใช้บริการ",
  };
  order.message = messages[order.status];

  saveOrders();
  renderStaffOrders();
  renderCustomerStatus();
}

// ---- CUSTOM MESSAGE MODAL ----
function sendCustomMessage(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  customMsgOrderId = id;
  document.getElementById("customMsgOrderLabel").textContent = `ออเดอร์ #${order.id} — ${order.name}`;
  document.getElementById("customMsgInput").value = order.message;
  document.getElementById("customMsgModal").classList.add("open");
  setTimeout(() => document.getElementById("customMsgInput").focus(), 50);
}

function closeCustomMsgModal() {
  document.getElementById("customMsgModal").classList.remove("open");
  customMsgOrderId = null;
}

function confirmCustomMessage() {
  if (!customMsgOrderId) return;
  const order = orders.find(o => o.id === customMsgOrderId);
  if (!order) return;
  const msg = document.getElementById("customMsgInput").value.trim();
  if (!msg) { alert("กรุณากรอกข้อความก่อน"); return; }
  order.message = msg;
  saveOrders();
  closeCustomMsgModal();
  renderStaffOrders();
  renderCustomerStatus();
}

// ---- PAYMENT MODAL ----
function openPaymentModal(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  payingOrderId     = id;
  selectedPayMethod = "cash";

  document.getElementById("paymentOrderSummary").innerHTML =
    `<p>${order.items.map(i => `${i.name} x ${i.quantity}`).join(", ")}</p>`;
  document.getElementById("paymentTotal").textContent    = money(order.total);
  document.getElementById("cashReceived").value          = "";
  document.getElementById("changeDisplay").style.display = "none";
  document.getElementById("cashSection").style.display   = "block";
  document.getElementById("qrSection").style.display     = "none";

  document.querySelectorAll(".pay-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("payMethodCash").classList.add("selected");
  document.getElementById("paymentModal").classList.add("open");
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("open");
  payingOrderId = null;
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  document.querySelectorAll(".pay-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("payMethod" + method.charAt(0).toUpperCase() + method.slice(1)).classList.add("selected");

  const isCash = method === "cash";
  document.getElementById("cashSection").style.display = isCash ? "block" : "none";
  document.getElementById("qrSection").style.display   = isCash ? "none"  : "block";

  if (!isCash) {
    const order = orders.find(o => o.id === payingOrderId);
    if (order) document.getElementById("qrAmount").textContent = money(order.total);
  }
  document.getElementById("changeDisplay").style.display = "none";
}

function calcChange() {
  const order    = orders.find(o => o.id === payingOrderId);
  if (!order) return;
  const received = parseFloat(document.getElementById("cashReceived").value) || 0;
  const change   = received - order.total;
  const box      = document.getElementById("changeDisplay");

  if (received > 0) {
    box.style.display = "block";
    document.getElementById("changeAmount").textContent =
      change >= 0 ? money(change) : `ยังขาดอีก ${money(Math.abs(change))}`;
    document.getElementById("changeAmount").style.color =
      change >= 0 ? "var(--green)" : "var(--red)";
  } else {
    box.style.display = "none";
  }
}

function confirmPayment() {
  const order = orders.find(o => o.id === payingOrderId);
  if (!order) return;

  if (selectedPayMethod === "cash") {
    const received = parseFloat(document.getElementById("cashReceived").value) || 0;
    if (received < order.total) {
      alert("รับเงินมาไม่พอ กรุณากรอกจำนวนให้ถูกต้อง");
      return;
    }
    const change = received - order.total;
    if (change > 0) alert(`เงินทอน: ${money(change)}`);
  }

  const methodNames = { cash: "เงินสด", promptpay: "พร้อมเพย์", card: "บัตรเครดิต", wallet: "วอลเล็ต" };
  order.paid      = true;
  order.payMethod = methodNames[selectedPayMethod] || selectedPayMethod;
  order.message   = `ชำระเงินแล้ว (${order.payMethod}) ขอบคุณที่ใช้บริการ`;
  if (order.status !== "เสร็จสิ้น") order.status = "เสร็จสิ้น";

  saveOrders();
  closePaymentModal();
  renderStaffOrders();
  renderCustomerStatus();
  alert(`✅ รับชำระเงินเรียบร้อย ออเดอร์ #${order.id}`);
}

// ---- INVENTORY ----
function renderInventory() {
  renderInventorySummary();
  if (currentInvTab === "ingredients") renderIngredientTable();
  else                                  renderMenuStock();
}

function renderIngredientTable() {
  const container = document.getElementById("ingredientTable");

  const allIngredients = {};
  menuItems.forEach(item => {
    if (!item.ingredients) return;
    item.ingredients.forEach(ing => {
      if (!allIngredients[ing.name]) allIngredients[ing.name] = { unit: ing.unit, totalUsed: 0 };
    });
  });
  Object.entries(ingredientUsage).forEach(([name, data]) => {
    if (!allIngredients[name]) allIngredients[name] = { unit: data.unit, totalUsed: 0 };
    allIngredients[name].totalUsed = data.totalUsed;
  });

  const entries = Object.entries(allIngredients);
  if (!entries.length) {
    container.innerHTML = `<div class="empty">ยังไม่มีข้อมูลวัตถุดิบ</div>`;
    return;
  }

  const maxUsed = Math.max(...entries.map(([, v]) => v.totalUsed), 1);

  container.innerHTML = `
    <table class="ing-table">
      <thead>
        <tr>
          <th>วัตถุดิบ</th>
          <th>หน่วย</th>
          <th>ใช้ไปแล้ว</th>
          <th>ปริมาณการใช้</th>
          <th style="text-align:right">
            <button class="danger" style="font-size:12px;padding:4px 10px" onclick="resetIngredients()">รีเซ็ตทั้งหมด</button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(([name, data]) => {
          const pct = Math.round((data.totalUsed / maxUsed) * 100);
          let barColor = "#3f8f5b";
          if (pct > 75)      barColor = "#c94c4c";
          else if (pct > 40) barColor = "#e07b3c";
          return `
            <tr>
              <td><strong>${name}</strong></td>
              <td style="color:var(--gray)">${data.unit}</td>
              <td><strong>${data.totalUsed.toLocaleString("th-TH")}</strong> ${data.unit}</td>
              <td>
                <div class="ing-used-bar-bg">
                  <div class="ing-used-bar" style="width:${pct}%;background:${barColor}"></div>
                </div>
              </td>
              <td style="text-align:right">
                <button class="small" style="font-size:12px;background:var(--gray)" onclick="resetOneIngredient('${name}')">รีเซ็ต</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
    <p style="font-size:12px;color:var(--gray);margin-top:12px">* ปริมาณคำนวณจากออเดอร์ที่ส่งจริง ตามสูตรต่อจานที่ตั้งไว้ในแต่ละเมนู</p>
  `;
}

function resetIngredients() {
  if (!confirm("รีเซ็ตวัตถุดิบทั้งหมดใช่ไหม?")) return;
  ingredientUsage = {};
  saveIngredientUsage();
  renderInventory();
}

function resetOneIngredient(name) {
  if (!confirm(`รีเซ็ต "${name}" ใช่ไหม?`)) return;
  delete ingredientUsage[name];
  saveIngredientUsage();
  renderInventory();
}

function renderMenuStock() {
  const grid = document.getElementById("inventoryGrid");
  grid.innerHTML = menuItems.map(item => {
    const inv      = inventory[item.id] || { stock: 0, sold: 0, maxStock: item.stock };
    const pct      = inv.maxStock > 0 ? Math.round((inv.stock / inv.maxStock) * 100) : 0;
    let barClass   = "ok";
    if (pct === 0)      barClass = "out";
    else if (pct <= 25) barClass = "low";
    const stockLabel = inv.stock === 0 ? "หมดแล้ว" : `เหลือ ${inv.stock} จาน`;
    const ingList    = item.ingredients && item.ingredients.length
      ? `<div style="font-size:12px;color:var(--gray);margin-top:6px;line-height:1.7">
           <strong>สูตรต่อจาน:</strong><br>
           ${item.ingredients.map(i => `${i.name} ${i.amountPer} ${i.unit}`).join(" · ")}
         </div>`
      : "";

    return `
      <div class="inv-card">
        <h4>${item.name}</h4>
        <small style="color:var(--gray)">${item.category} · ${money(item.price)}</small>
        <div class="inv-bar-bg" style="margin-top:10px">
          <div class="inv-bar ${barClass}" style="width:${pct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:4px">
          <span>${stockLabel}</span><span>${pct}%</span>
        </div>
        <div class="inv-sold">ขายไปแล้ว: <strong>${inv.sold}</strong> จาน</div>
        ${ingList}
        <div class="inv-controls">
          <span style="font-size:13px">เติมสต็อก:</span>
          <input type="number" id="invInput_${item.id}" value="10" min="1" max="200" />
          <button class="primary" style="font-size:13px;padding:7px 12px" onclick="restockItem(${item.id})">เติม</button>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="danger"  style="font-size:12px;padding:5px 10px" onclick="resetItem(${item.id})">รีเซ็ต</button>
          <button class="warning" style="font-size:12px;padding:5px 10px" onclick="deleteMenuItem(${item.id})">ลบเมนู</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderInventorySummary() {
  const invVals      = menuItems.map(m => inventory[m.id] || { stock: 0, sold: 0 });
  const totalSold    = invVals.reduce((s, i) => s + i.sold, 0);
  const totalRevenue = orders.filter(o => o.paid).reduce((s, o) => s + o.total, 0);
  const outItems     = menuItems.filter(m => (inventory[m.id] || { stock: 0 }).stock === 0).length;
  const lowItems     = menuItems.filter(m => { const s = (inventory[m.id] || {}).stock || 0; return s > 0 && s <= 5; }).length;
  const totalIngUsed = Object.values(ingredientUsage).length;

  document.getElementById("inventorySummary").innerHTML = `
    <div class="summary-card"><div class="num">${totalSold}</div><div class="label">จานที่ขายไป</div></div>
    <div class="summary-card"><div class="num">${money(totalRevenue)}</div><div class="label">รายได้ชำระแล้ว</div></div>
    <div class="summary-card"><div class="num" style="color:var(--red)">${outItems}</div><div class="label">เมนูที่หมด</div></div>
    <div class="summary-card"><div class="num" style="color:var(--orange)">${lowItems}</div><div class="label">เมนูใกล้หมด</div></div>
    <div class="summary-card"><div class="num" style="color:var(--brown)">${totalIngUsed}</div><div class="label">วัตถุดิบที่ใช้</div></div>
  `;
}

function restockItem(id) {
  const input = document.getElementById("invInput_" + id);
  const qty   = parseInt(input.value) || 0;
  if (qty <= 0) { alert("กรอกจำนวนที่ต้องการเติม"); return; }
  inventory[id].stock    += qty;
  inventory[id].maxStock  = Math.max(inventory[id].maxStock, inventory[id].stock);
  saveInventory();
  renderInventory();
  renderMenu();
}

function resetItem(id) {
  if (!confirm("รีเซ็ตสต็อกเมนูนี้ใช่ไหม?")) return;
  const item             = menuItems.find(m => m.id === id);
  inventory[id].stock    = item.stock;
  inventory[id].sold     = 0;
  inventory[id].maxStock = item.stock;
  saveInventory();
  renderInventory();
  renderMenu();
}

function deleteMenuItem(id) {
  if (!confirm("ลบเมนูนี้ออกจากระบบถาวรใช่ไหม?")) return;
  menuItems = menuItems.filter(m => m.id !== id);
  delete inventory[id];
  saveMenuItems();
  saveInventory();
  renderInventory();
  renderMenu();
}

// ---- ADD MENU MODAL ----
function openAddMenuModal() {
  ingredientRowCount = 0;
  document.getElementById("newMenuName").value           = "";
  document.getElementById("newMenuPrice").value          = "";
  document.getElementById("newMenuStock").value          = "";
  document.getElementById("newMenuDetail").value         = "";
  document.getElementById("ingredientInputs").innerHTML  = "";
  addIngredientRow();
  document.getElementById("addMenuModal").classList.add("open");
}

function closeAddMenuModal() {
  document.getElementById("addMenuModal").classList.remove("open");
}

function addIngredientRow() {
  ingredientRowCount++;
  const row       = document.createElement("div");
  row.className   = "form-row";
  row.id          = "ingRow_" + ingredientRowCount;
  row.style.marginBottom = "8px";
  row.style.alignItems   = "center";
  row.innerHTML = `
    <div class="form-group" style="grid-column:span 2">
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center">
        <input type="text"   placeholder="ชื่อวัตถุดิบ เช่น เส้นหมี่" id="ing_name_${ingredientRowCount}" style="margin:0" />
        <input type="number" placeholder="ปริมาณ"                      id="ing_amt_${ingredientRowCount}"  style="margin:0" min="0" step="0.1" />
        <input type="text"   placeholder="หน่วย เช่น g"               id="ing_unit_${ingredientRowCount}" style="margin:0" />
        <button class="danger" style="padding:8px 10px;white-space:nowrap"
          onclick="document.getElementById('ingRow_${ingredientRowCount}').remove()">✕</button>
      </div>
    </div>
  `;
  document.getElementById("ingredientInputs").appendChild(row);
}

function saveNewMenu() {
  const name     = document.getElementById("newMenuName").value.trim();
  const category = document.getElementById("newMenuCategory").value;
  const price    = parseFloat(document.getElementById("newMenuPrice").value);
  const stock    = parseInt(document.getElementById("newMenuStock").value);
  const detail   = document.getElementById("newMenuDetail").value.trim();

  if (!name)              { alert("กรอกชื่อเมนูด้วย"); return; }
  if (!price || price<=0) { alert("กรอกราคาด้วย"); return; }
  if (!stock || stock<=0) { alert("กรอกสต็อกเริ่มต้นด้วย"); return; }

  const ingredients = [];
  document.querySelectorAll("#ingredientInputs [id^='ingRow_']").forEach(row => {
    const idx   = row.id.split("_")[1];
    const iName = document.getElementById("ing_name_"  + idx)?.value.trim();
    const iAmt  = parseFloat(document.getElementById("ing_amt_"  + idx)?.value);
    const iUnit = document.getElementById("ing_unit_" + idx)?.value.trim();
    if (iName && iAmt > 0 && iUnit) ingredients.push({ name: iName, unit: iUnit, amountPer: iAmt });
  });

  const newId   = Date.now();
  const newItem = { id: newId, name, category, price, detail: detail || "-", stock, ingredients };
  menuItems.push(newItem);
  inventory[newId] = { stock, sold: 0, maxStock: stock };

  saveMenuItems();
  saveInventory();
  closeAddMenuModal();
  renderMenu();
  renderInventory();
  alert(`✅ เพิ่มเมนู "${name}" เรียบร้อยแล้ว`);
}

// ---- NAV ----
document.querySelectorAll("nav > button[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("nav > button[data-page]").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(button.dataset.page).classList.add("active");
    if (button.dataset.page === "staffPage")     renderStaffOrders();
    if (button.dataset.page === "inventoryPage") renderInventory();
  });
});

// Inventory tabs
document.querySelectorAll(".inv-tab[data-inv-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".inv-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentInvTab = btn.dataset.invTab;
    document.getElementById("invIngredientSection").style.display = currentInvTab === "ingredients" ? "block" : "none";
    document.getElementById("invMenuSection").style.display       = currentInvTab === "menu"        ? "block" : "none";
    renderInventory();
  });
});

// Staff filter tabs
document.querySelectorAll(".tab-button[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    staffFilter = btn.dataset.filter;
    renderStaffOrders();
  });
});

// ---- CLOCK ----
function updateClock() {
  const el = document.getElementById("clock");
  if (el) el.textContent = new Date().toLocaleTimeString("th-TH");
}
setInterval(updateClock, 1000);
updateClock();

// ---- INIT ----
renderMenu();
renderCart();
renderCustomerStatus();
renderStaffOrders();
