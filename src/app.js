import { productsApi } from './api.js';

const $ = id => document.getElementById(id);
const money = value => 'Bs ' + new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const number = value => new Intl.NumberFormat('es-BO').format(value);
const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Sin fecha';
let products = [], query = '', requestSequence = 0, currentProduct = null, pendingDelete = null, toastTimer, saving = false, deleting = false;

function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('toast-text').textContent = message;
  $('toast').classList.toggle('error', error);
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, error ? 7000 : 4500);
}

function connection(status) {
  $('connection').className = `connection ${status}`;
  $('connection-text').textContent = status === 'online' ? 'Conectado' : status === 'offline' ? 'Sin conexión' : 'Conectando';
}

function render() {
  const count = products.length;
  $('stat-products').textContent = number(count);
  $('stat-units').textContent = number(products.reduce((sum, row) => sum + row.stock, 0));
  $('stat-value').textContent = money(products.reduce((sum, row) => sum + row.precio * row.stock, 0));
  $('nav-count').textContent = query ? '·' : number(count);
  $('result-count').textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
  $('table-summary').textContent = query ? `${count} ${count === 1 ? 'resultado' : 'resultados'} en esta búsqueda` : `${count} ${count === 1 ? 'producto registrado' : 'productos registrados'}`;
  $('filter-note').hidden = !query;
  $('filter-text').textContent = `Resultados para “${query}” · El resumen muestra esta búsqueda.`;
  $('empty').hidden = count > 0;
  $('table-wrap').hidden = count === 0;
  $('empty-title').textContent = query ? 'No encontramos ese producto' : 'Tu catálogo empieza aquí';
  $('empty-description').textContent = query ? 'Prueba con otro nombre o vuelve a ver todos tus productos.' : 'Agrega tu primer producto y ten sus precios y existencias siempre a mano.';
  $('empty-add').hidden = Boolean(query);
  $('product-rows').replaceChildren();
  for (const product of products) {
    const row = $('product-row').content.cloneNode(true);
    row.querySelector('tr').dataset.id = product.id;
    row.querySelector('.product-name').textContent = product.nombre;
    row.querySelector('.product-avatar').textContent = product.nombre.slice(0, 1).toUpperCase();
    row.querySelector('.product-id').textContent = `#${String(product.id).padStart(4, '0')}`;
    row.querySelector('.price-cell').textContent = money(product.precio);
    row.querySelector('.date-cell').textContent = date(product.createdAt);
    const stock = row.querySelector('.stock-badge');
    stock.textContent = product.stock === 0 ? 'Sin stock' : `${number(product.stock)} ${product.stock === 1 ? 'unidad' : 'unidades'}`;
    stock.classList.toggle('low', product.stock > 0 && product.stock <= 5);
    stock.classList.toggle('zero', product.stock === 0);
    for (const button of row.querySelectorAll('[data-action]')) {
      button.setAttribute('aria-label', `${button.dataset.action === 'view' ? 'Ver' : button.dataset.action === 'edit' ? 'Editar' : 'Eliminar'} ${product.nombre}`);
    }
    $('product-rows').append(row);
  }
}

async function load() {
  const sequence = ++requestSequence;
  $('loading').hidden = false;
  $('load-error').hidden = $('table-wrap').hidden = $('empty').hidden = true;
  $('refresh').disabled = true;
  connection('');
  try {
    const result = await productsApi.list(query);
    if (sequence !== requestSequence) return;
    if (!Array.isArray(result)) throw new Error('El servidor no devolvió una lista de productos.');
    products = result;
    render();
    connection('online');
  } catch (error) {
    if (sequence !== requestSequence) return;
    $('load-error-text').textContent = error.message;
    $('load-error').hidden = false;
    $('table-summary').textContent = 'Catálogo no disponible';
    for (const id of ['stat-products', 'stat-units', 'stat-value', 'nav-count']) $(id).textContent = '—';
    connection('offline');
  } finally {
    if (sequence === requestSequence) {
      $('loading').hidden = true;
      $('refresh').disabled = false;
    }
  }
}

function openForm(product = null) {
  currentProduct = product;
  $('product-form').reset();
  $('form-title').textContent = product ? 'Editar producto' : 'Nuevo producto';
  $('save-product').textContent = product ? 'Guardar cambios' : 'Crear producto';
  $('product-name').value = product?.nombre ?? '';
  $('product-price').value = product?.precio ?? '';
  $('product-stock').value = product?.stock ?? '';
  $('form-error').hidden = true;
  $('product-dialog').showModal();
  $('product-name').focus();
}

async function viewProduct(id, edit = false, button) {
  button.disabled = true;
  try {
    const product = await productsApi.get(id);
    if (edit) { openForm(product); return; }
    currentProduct = product;
    $('details-title').textContent = product.nombre;
    $('product-details').replaceChildren();
    for (const [label, value] of [['Identificador', `#${product.id}`], ['Precio unitario', money(product.precio)], ['Unidades en stock', number(product.stock)], ['Valor en inventario', money(product.precio * product.stock)], ['Fecha de registro', date(product.createdAt)]]) {
      const pair = document.createElement('div'), term = document.createElement('dt'), description = document.createElement('dd');
      term.textContent = label; description.textContent = value;
      pair.append(term, description); $('product-details').append(pair);
    }
    $('details-dialog').showModal();
  } catch (error) { toast(error.message, true); }
  finally { button.disabled = false; }
}

$('product-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (saving) return;
  const payload = { nombre: $('product-name').value.trim(), precio: Number($('product-price').value), stock: Number($('product-stock').value) };
  if (!payload.nombre || !Number.isFinite(payload.precio) || payload.precio < 0 || payload.precio > 99999999.99 || !Number.isInteger(payload.stock) || payload.stock < 0 || payload.stock > 2147483647) {
    $('form-error').textContent = 'Revisa el nombre, el precio y las unidades del producto.'; $('form-error').hidden = false; return;
  }
  saving = true;
  const editing = Boolean(currentProduct);
  $('save-product').disabled = $('cancel-form').disabled = $('close-form').disabled = true;
  $('save-product').textContent = 'Guardando…';
  $('form-error').hidden = true;
  try {
    if (editing) await productsApi.update(currentProduct.id, payload);
    else await productsApi.create(payload);
    $('product-dialog').close();
    toast(editing ? 'Cambios guardados correctamente.' : 'Producto creado correctamente.');
    if (!editing) { query = ''; $('search-input').value = ''; }
    await load();
  } catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; }
  finally {
    saving = false;
    $('save-product').disabled = $('cancel-form').disabled = $('close-form').disabled = false;
    $('save-product').textContent = editing ? 'Guardar cambios' : 'Crear producto';
  }
});

$('product-rows').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const id = Number(button.closest('tr').dataset.id);
  if (button.dataset.action === 'delete') {
    pendingDelete = products.find(row => row.id === id);
    if (!pendingDelete) return;
    $('delete-name').textContent = pendingDelete.nombre;
    $('delete-error').hidden = true;
    $('delete-dialog').showModal();
  } else void viewProduct(id, button.dataset.action === 'edit', button);
});

$('confirm-delete').addEventListener('click', async () => {
  if (deleting || !pendingDelete) return;
  deleting = true;
  $('confirm-delete').disabled = $('cancel-delete').disabled = true;
  $('confirm-delete').textContent = 'Eliminando…';
  $('delete-error').hidden = true;
  try {
    await productsApi.remove(pendingDelete.id);
    $('delete-dialog').close(); pendingDelete = null;
    toast('Producto eliminado del catálogo.');
    await load();
  } catch (error) { $('delete-error').textContent = error.message; $('delete-error').hidden = false; }
  finally {
    deleting = false;
    $('confirm-delete').disabled = $('cancel-delete').disabled = false;
    $('confirm-delete').textContent = 'Eliminar producto';
  }
});

for (const id of ['new-product', 'empty-add']) $(id).addEventListener('click', () => openForm());
for (const id of ['close-form', 'cancel-form']) $(id).addEventListener('click', () => { if (!saving) $('product-dialog').close(); });
$('product-dialog').addEventListener('cancel', event => { if (saving) event.preventDefault(); });
$('delete-dialog').addEventListener('cancel', event => { if (deleting) event.preventDefault(); });
$('close-details').addEventListener('click', () => $('details-dialog').close());
$('details-edit').addEventListener('click', () => { $('details-dialog').close(); openForm(currentProduct); });
$('cancel-delete').addEventListener('click', () => { if (!deleting) $('delete-dialog').close(); });
for (const id of ['refresh', 'retry']) $(id).addEventListener('click', load);
$('search-form').addEventListener('submit', event => { event.preventDefault(); query = $('search-input').value.trim(); void load(); });
$('clear-search').addEventListener('click', () => { query = ''; $('search-input').value = ''; void load(); });
$('search-input').addEventListener('search', () => { if (!$('search-input').value) { query = ''; void load(); } });
void load();
