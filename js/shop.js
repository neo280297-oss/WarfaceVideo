(function(){
  const STORAGE_CART = 'shop_cart_v1';
  const STORAGE_ORDERS = 'shop_orders_v1';

  function readCart(){
    return JSON.parse(localStorage.getItem(STORAGE_CART) || '[]');
  }
  function writeCart(cart){
    localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  }
  function readOrders(){
    return JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]');
  }
  function writeOrders(orders){
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
  }

  function findProductNodeById(id){
    return document.querySelector(`.container[data-id="${id}"]`);
  }
  function productFromNode(node){
    return {
      id: node.dataset.id,
      name: node.dataset.name,
      category: node.dataset.category,
      price: Number(node.dataset.price||0),
      image: (node.querySelector('img')||{}).src || ''
    };
  }
  function applyFilters(){
    const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const category = (document.getElementById('categorySelect')?.value || '');
    const min = Number(document.getElementById('minPrice')?.value || 0);
    const max = Number(document.getElementById('maxPrice')?.value || 0);
    const sort = document.getElementById('sortSelect')?.value || '';

    const container = document.querySelector('.body_3');
    if(!container) return;
    const items = Array.from(container.querySelectorAll('.container'));
    const filtered = items.filter(node => {
      const name = (node.dataset.name||'').toLowerCase();
      const cat = node.dataset.category || '';
      const price = Number(node.dataset.price||0);
      if(search && !name.includes(search)) return false;
      if(category && category !== '' && cat !== category) return false;
      if(min && price < min) return false;
      if(max && max > 0 && price > max) return false;
      return true;
    });

    items.forEach(node => node.style.display = 'none');
    if(sort === 'price-asc') filtered.sort((a,b)=> Number(a.dataset.price) - Number(b.dataset.price));
    if(sort === 'price-desc') filtered.sort((a,b)=> Number(b.dataset.price) - Number(a.dataset.price));

    filtered.forEach(n => n.style.display = 'block');
  }
  function showModal(title, innerHtml, actions = []){
    console.log('showModal', title);
    const existing = document.querySelector('.modal-overlay');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';

    const h = document.createElement('h3'); h.textContent = title;
    const content = document.createElement('div'); content.innerHTML = innerHtml || '';
    const actionsWrap = document.createElement('div'); actionsWrap.className = 'actions';

    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.textContent = a.text;
      btn.className = a.className || 'button_1';
      btn.addEventListener('click', ()=>{
        try{ a.onClick && a.onClick(); }catch(e){console.error(e)}
        overlay.remove();
      });
      actionsWrap.appendChild(btn);
    });

    modal.appendChild(h);
    modal.appendChild(content);
    modal.appendChild(actionsWrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(()=>{
      overlay.querySelector('button')?.focus();
      const computed = window.getComputedStyle(overlay);
      if(computed.display === 'none' || computed.visibility === 'hidden'){
        alert(title + '\n' + (content.textContent || ''));
      }
    }, 60);

    overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  }

  function addToCart(productId, qty = 1){
    const node = findProductNodeById(productId);
    if(!node) return;
    const p = productFromNode(node);
    const cart = readCart();
    const existing = cart.find(i => i.id === p.id);
    if(existing) existing.qty += qty; else cart.push({...p, qty});
    writeCart(cart);
  }

  function showConfirmAddModal(productId){
    const node = findProductNodeById(productId);
    const p = productFromNode(node);
    const html = `<div style="display:flex;gap:12px;align-items:center;"><img src="${p.image}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;"/><div><strong>${p.name}</strong><div>${formatPrice(p.price)}</div></div></div><p style="margin-top:12px;">Вы уверены, что хотите добавить этот товар в корзину?</p>`;
    showModal('Подтвердите добавление', html, [
      { text: 'Добавить в корзину', className:'button_1', onClick: ()=> { addToCart(p.id,1); showAddToCartModal(productId); } },
      { text: 'Купить сейчас', className:'button_1', onClick: ()=> { proceedToCheckout([ {...p, qty:1} ]); } },
      { text: 'Отмена', className:'button_submit' }
    ]);
  }

  function showAddToCartModal(productId){
    const node = findProductNodeById(productId);
    const p = productFromNode(node);
    const html = `<div style="display:flex;gap:12px;align-items:center;"><img src="${p.image}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;"/><div><strong>${p.name}</strong><div>${formatPrice(p.price)}</div></div></div><p style="margin-top:8px;">Товар добавлен в корзину.</p>`;
    showModal('Товар добавлен', html, [
      { text: 'Оформить заказ', className:'button_1', onClick: ()=> { proceedToCheckout(readCart()); } },
      { text: 'Перейти в корзину', className:'button_1', onClick: ()=> { window.location.href = '2page.html'; } },
      { text: 'Продолжить', className:'button_submit' }
    ]);
  }

  function proceedToCheckout(items){
    const total = items.reduce((s,i)=> s + (Number(i.price)||0)* (i.qty||1), 0);
    const html = `<div>Итог: <strong>${formatPrice(total)}</strong><p>Нажмите "Подтвердить" чтобы симулировать оплату.</p></div>`;
    showModal('Оформление заказа', html, [
      { text: 'Подтвердить', className:'button_1', onClick: ()=> { finalizeOrder(items); } },
      { text: 'Отмена', className:'button_submit' }
    ]);
  }

  function finalizeOrder(items){
    const total = items.reduce((s,i)=> s + (Number(i.price)||0) * (i.qty||1), 0);
    const orderId = 'ORD' + Math.random().toString(36).slice(2,9).toUpperCase();
    const orders = readOrders();
    const order = { id: orderId, items, total, date: new Date().toISOString(), status: 'Принят' };
    orders.unshift(order);
    writeOrders(orders);
    writeCart([]);
    showModal('Оплата успешна ✅', `<p>Ваш заказ <strong>${orderId}</strong> принят. Статус: <em>Принят</em></p>`, [
      { text: 'Ок', className:'button_1' }
    ]);
    renderOrders();
    renderCart();
  }

  function formatPrice(n){ return (n||0).toLocaleString('ru-RU') + ' тг'; }

  function renderCart(){
    const root = document.getElementById('cartContainer');
    const actions = document.getElementById('cartActions');
    if(!root) return;
    const cart = readCart();
    root.innerHTML = '';
    actions.innerHTML = '';
    if(cart.length === 0){
      root.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
      return;
    }
    cart.forEach(item => {
      const div = document.createElement('div'); div.className = 'cart-item';
      div.innerHTML = `<img src="${item.image}" alt=""/><div style="flex:1"><strong>${item.name}</strong><div>${formatPrice(item.price)} × ${item.qty}</div></div><div style="text-align:right"><button class="button_1" data-id="${item.id}">Удалить</button></div>`;
      root.appendChild(div);
      div.querySelector('button')?.addEventListener('click', ()=>{
        const c = readCart().filter(i=> i.id !== item.id);
        writeCart(c);
        renderCart();
      });
    });
    const total = cart.reduce((s,i)=> s + Number(i.price)*i.qty,0);
    const totalDiv = document.createElement('div'); totalDiv.className = 'cart-total'; totalDiv.textContent = 'Итог: ' + formatPrice(total);
    root.appendChild(totalDiv);

    const checkoutBtn = document.createElement('button'); checkoutBtn.className = 'button_1'; checkoutBtn.textContent = 'Оформить заказ';
    checkoutBtn.addEventListener('click', ()=> { proceedToCheckout(cart); });
    actions.appendChild(checkoutBtn);

    const clearBtn = document.createElement('button'); clearBtn.className='button_submit'; clearBtn.textContent='Очистить корзину';
    clearBtn.addEventListener('click', ()=>{ writeCart([]); renderCart(); });
    actions.appendChild(clearBtn);
  }

  function renderOrders(){
    const root = document.getElementById('ordersContainer');
    if(!root) return;
    const orders = readOrders();
    if(orders.length === 0){
      root.innerHTML = '<p class="text_231">Статус вашего заказа неизвестен либо вы ещё не заказали товар</p>';
      return;
    }
    root.innerHTML = '';
    orders.forEach(o => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc'; div.style.padding = '12px'; div.style.marginBottom = '12px';
      const d = new Date(o.date).toLocaleString();
      let itemsHtml = o.items.map(it=> `<div>${it.name} — ${it.qty} × ${formatPrice(it.price)}</div>`).join('');
      div.innerHTML = `<div>Заказ <strong>${o.id}</strong> — ${d} — <em>${o.status}</em></div>${itemsHtml}<div class="cart-total">Итог: ${formatPrice(o.total)}</div>`;
      root.appendChild(div);
    });
  }

  function bindBuyButtons(){
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        const id = btn.dataset.id;
        console.log('buy click', id);
        const node = findProductNodeById(id);
        if(node){
          node.style.transition = 'box-shadow .18s ease';
          node.style.boxShadow = '0 0 0 3px rgba(16,80,153,0.45)';
          setTimeout(()=>{ node.style.boxShadow = ''; }, 450);
        }
        showConfirmAddModal(id);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    console.log('shop.js loaded');
    ['searchInput','categorySelect','minPrice','maxPrice','sortSelect'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    });
    document.getElementById('clearFilters')?.addEventListener('click', ()=>{
      ['searchInput','categorySelect','minPrice','maxPrice','sortSelect'].forEach(id=>{ const el = document.getElementById(id); if(el) el.value = '' });
      applyFilters();
    });
    const urlParams = new URLSearchParams(window.location.search);
    const preCategory = urlParams.get('category');
    if(preCategory){ const catSelect = document.getElementById('categorySelect'); if(catSelect) catSelect.value = preCategory; }

    applyFilters();
    bindBuyButtons();
    renderCart();
    renderOrders();
  });
})();
