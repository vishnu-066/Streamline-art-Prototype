(function(){
  'use strict';
  var KEY='streamlineCart';
  function read(){try{var x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
  function write(items){localStorage.setItem(KEY,JSON.stringify(items));updateBadges(items)}
  function text(root,selectors){for(var i=0;i<selectors.length;i++){var el=root.querySelector(selectors[i]);if(el&&el.textContent.trim())return el.textContent.trim()}return''}
  function number(value){var n=parseFloat(String(value||'').replace(/[^0-9.]/g,''));return isNaN(n)?0:n}
  function updateBadges(items){
    var count=(items||read()).reduce(function(sum,item){return sum+(+item.qty||1)},0);
    document.querySelectorAll('#navCartBadge,.nav-cart-badge,#cartBadge').forEach(function(badge){badge.textContent=count;badge.style.display=count?'flex':''});
  }
  function productFromButton(button){
    var root=button.closest('.pdp-wrap,.plp-product-card,.product-card,.plp-card,.qv-modal,.quick-view-modal')||document;
    var name=text(root,['.pdp-title','.plp-product-name','.product-name','.plp-card-title','.qv-title','h1','h2','h3']);
    var sku=text(root,['.pdp-sku-tag','.plp-sku','.product-sku','.qv-sku']).replace(/^SKU\s*:?\s*/i,'');
    var price=number(text(root,['.pdp-price','.plp-price','.product-price','.qv-price','[class*="price"]']));
    var image=root.querySelector('#pdpMainImg,.plp-product-image img,.product-image img,.plp-card-img img,.qv-image img,img');
    var qtyEl=root.querySelector('#pdpQty,.pdp-qty-input,[class*="qty"] input');
    return{name:name||'Streamline Artwork',sku:sku||name||String(Date.now()),price:price,image:image?(image.currentSrc||image.src):'',qty:Math.max(1,+(qtyEl&&qtyEl.value)||1),url:location.pathname.split('/').pop()||'index.html'};
  }
  document.addEventListener('click',function(event){
    var button=event.target.closest('.pdp-atc,.plp-add-to-cart,.qv-cart-btn');
    if(!button||button.disabled)return;
    var item=productFromButton(button),items=read(),found=-1;
    for(var i=0;i<items.length;i++){if(items[i].sku===item.sku){found=i;break}}
    if(found>-1)items[found].qty=(+items[found].qty||1)+item.qty;else items.push(item);
    write(items);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){updateBadges()});else updateBadges();
})();
