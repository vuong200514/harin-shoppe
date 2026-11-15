(function(){
'use strict';
const E=window.HarinExport;
const $=id=>document.getElementById(id);
const nowStamp=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('')+'_'+[d.getHours(),d.getMinutes()].map(x=>String(x).padStart(2,'0')).join('');};
const DEFAULT_CHART_URL='https://res.cloudinary.com/p8nrkuot/image/upload/v1794772267/bang_quy_doi_kich_co_harin_studios.png';
const defaultProduct=()=>({name:'',category:'',price:'',sku:'',material:'',origin:'',stock:50,hasSizes:true,sizes:'S, M, L',chartMode:'image',chartGroup:'top',chartUrl:DEFAULT_CHART_URL,images:[]});
const state={products:[defaultProduct()],selected:0,format:'advanced',shipping:{...E.SHIPPING},cloudName:'',cloudPreset:'',autoUpload:true,uploading:false};
function esc(s){return String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function cur(){return state.products[state.selected];}
function safeSave(){try{const payload={...state,uploading:false,products:state.products.map(p=>({...p,images:p.images.filter(i=>i.url).map(i=>({name:i.name,url:i.url}))}))};localStorage.setItem('harin_product_studio_v2',JSON.stringify(payload));}catch(err){console.warn('Autosave unavailable',err);}}
function load(){try{let s=JSON.parse(localStorage.getItem('harin_product_studio_v2')||'null');const previous=!s;if(!s)s=JSON.parse(localStorage.getItem('harin_product_studio_v1')||'null');if(!s||!Array.isArray(s.products)||!s.products.length)return;
  state.products=s.products.map(p=>({...defaultProduct(),...p,stock:p.stock===undefined?50:p.stock,chartMode:previous?'image':(p.chartMode||'image'),chartUrl:String(p.chartUrl||DEFAULT_CHART_URL).trim().replace(/,+$/,'').trim(),images:(p.images||[]).filter(i=>i.url).slice(0,9)}));
  state.selected=Math.min(Math.max(s.selected||0,0),state.products.length-1);
  state.format=s.format==='basic'?'basic':'advanced';state.shipping={...E.SHIPPING,...(s.shipping||{})};
  state.cloudName=String(s.cloudName||'');state.cloudPreset=String(s.cloudPreset||'');state.autoUpload=s.autoUpload!==false;
}catch(err){console.warn('Could not load previous state',err);}}
let toastTimer;
function toast(text,error=false){const el=$('toast');el.textContent=text;el.style.background=error?'#a93d31':'#292825';el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4500);}
function renderList(){const cont=$('productList');cont.textContent='';$('productCounter').textContent=state.products.length+' sản phẩm';state.products.forEach((p,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='product-tab'+(state.selected===i?' active':'');const child=document.createElement('span');child.className='tab-main';const ttl=document.createElement('span');ttl.className='tab-title';ttl.textContent=p.name||'Chưa đặt tên';const sub=document.createElement('span');sub.className='tab-sub';sub.textContent=(p.price?Number(p.price).toLocaleString('vi-VN')+'đ':'Chưa có giá')+' · '+(p.images||[]).length+' ảnh';const num=document.createElement('span');num.className='tab-number';num.textContent=String(i+1).padStart(2,'0');child.append(ttl,sub);btn.append(num,child);btn.onclick=()=>{state.selected=i;render();};cont.appendChild(btn);});}
function countVariants(p){const sizes=p.hasSizes?E.buildRows([p],{format:'advanced'}).rowCount:1;return sizes;}
function setInputs(){const p=cur();$('productIndex').textContent='Sản phẩm '+String(state.selected+1).padStart(2,'0');const fields={itemName:'name',itemPrice:'price',itemSku:'sku',itemMaterial:'material',itemOrigin:'origin',chartGroup:'chartGroup',chartUrl:'chartUrl'};
  for(const [id,key] of Object.entries(fields))$(id).value=p[key]??'';
  $('itemCategory').value=p.category||'';$('basicCategory').value=p.category||'';
  $('hasSizes').checked=!!p.hasSizes;$('sizeInputWrap').classList.toggle('hidden',!p.hasSizes);renderSizeChoices();$('stockInput').value=p.stock??50;
  document.querySelectorAll('[data-ship]').forEach(input=>{input.checked=state.shipping[input.dataset.ship]==='M\u1edf';syncShipLabel(input);});
  $('chartSaved').checked=p.chartMode!=='image';$('chartImage').checked=p.chartMode==='image';
  $('chartGroupBox').style.display=p.chartMode==='image'?'none':'';$('chartUrlBox').style.display=p.chartMode==='image'?'':'none';
  $('formatType').value=state.format;$('basicWarning').classList.toggle('hidden',state.format!=='basic');
  $('itemCategory').parentElement.style.display=state.format==='basic'?'none':'';$('basicCategoryBox').style.display=state.format==='basic'?'':'';
  $('cloudName').value=state.cloudName;$('cloudPreset').value=state.cloudPreset;$('autoUploadSwitch').checked=state.autoUpload;updateCloudStatus();
}
function renderPreview(){const p=cur();$('previewTitle').textContent=E.fullTitle(p.name||'Tên sản phẩm của bạn');$('previewPrice').textContent=p.price?Number(p.price).toLocaleString('vi-VN')+' ₫':'Chưa nhập';const n=countVariants(p);$('previewVariants').textContent=p.hasSizes?n+' size':'Không phân loại';$('previewStock').textContent=(n*Number(p.stock||0)).toLocaleString('vi-VN');$('previewImages').textContent=(p.images||[]).filter(x=>x.url).length+' / '+(p.images||[]).length;
  const valid=E.validate(state.products,state.format,{shipping:state.shipping});const checkpoints=[
    [state.products.every(p=>p.name&&p.name.trim()),'Tên sản phẩm đã có tiền tố'],
    [state.products.every(p=>p.price&&Number(p.price)>=1000),'Đã nhập giá hợp lệ'],
    [state.products.every(p=>/^\d+$/.test(String(p.category||''))),'Đã chọn ngành hàng'],
    [valid.missingUrls===0,'Ảnh chính đã có URL công khai'],
    [state.products.every(p=>p.chartMode==='saved'||!!p.chartUrl),'Bảng size có ID hoặc URL'],
    [Object.values(state.shipping).includes('M\u1edf'),'Có ít nhất 1 kênh vận chuyển']
  ];
  const el=$('checklist');el.textContent='';for(const [good,label] of checkpoints){const div=document.createElement('div');div.className='step';const badge=document.createElement('span');badge.className='step-index';badge.style.background=good?'var(--green-pale)':'#fff2eb';badge.style.color=good?'var(--green)':'#c47745';badge.textContent=good?'✓':'!';const msg=document.createElement('span');msg.textContent=label;div.append(badge,msg);el.append(div);}
}
function imageSrc(i){if(i.preview)return i.preview;if(i.url)return i.url;return '';}
function cloudReady(){return !!(state.cloudName.trim()&&state.cloudPreset.trim());}
function updateCloudStatus(){const el=$('cloudReadyStatus');if(el){el.textContent=cloudReady()?'✓ Đã cấu hình Cloudinary · '+(state.autoUpload?'tự đăng ảnh khi chọn':'chế độ đăng thủ công'):'Chưa cấu hình Cloudinary — nhập Cloud name và preset hoặc đặt biến Render';el.style.color=cloudReady()?'var(--green)':'#bb683b';}}
function imageGrid(){const grid=$('imageGrid');grid.textContent='';const p=cur();for(let i=0;i<p.images.length;i++){const img=p.images[i];const box=document.createElement('div');box.className='image-card';const frame=document.createElement('div');frame.className='image-frame';const pic=document.createElement('img');pic.src=imageSrc(img);pic.alt=img.name||'Ảnh sản phẩm';pic.onerror=()=>pic.style.visibility='hidden';const badge=document.createElement('span');badge.className='image-label';badge.textContent=i===0?'ẢNH BÌA':`ẢNH ${i}`;frame.append(pic,badge);const act=document.createElement('div');act.className='image-actions';const stateSpan=document.createElement('span');stateSpan.className=img.url?'ok-dot':'wait-dot';stateSpan.textContent=img.url?'✓ URL':img.uploadStatus==='uploading'?'↻ ĐANG TẢI':img.uploadStatus==='error'?'! LỖI':'● CHƯA TẢI';if(img.uploadError)stateSpan.title=img.uploadError;const group=document.createElement('span');for(const [txt,diff] of [['←',-1],['→',1]]){const b=document.createElement('button');b.textContent=txt;b.title='Đổi thứ tự ảnh';b.disabled=(diff<0&&i===0)||(diff>0&&i===p.images.length-1);b.onclick=()=>{[p.images[i],p.images[i+diff]]=[p.images[i+diff],p.images[i]];imageGrid();renderPreview();safeSave();};group.appendChild(b);}const del=document.createElement('button');del.textContent='×';del.title='Xóa ảnh';del.onclick=()=>{let removed=p.images.splice(i,1)[0];if(removed.preview?.startsWith('blob:'))URL.revokeObjectURL(removed.preview);imageGrid();renderPreview();safeSave();};group.appendChild(del);if(img.url){const copy=document.createElement('button');copy.textContent='URL';copy.title='Sao chép URL ảnh';copy.onclick=()=>navigator.clipboard?.writeText(img.url).then(()=>toast('Đã sao chép URL ảnh.')).catch(()=>toast('Không sao chép được URL.',true));group.appendChild(copy);}act.append(stateSpan,group);const name=document.createElement('div');name.className='image-name';name.title=img.name||'';name.textContent=img.name||'Ảnh đã có URL';box.append(frame,act,name);grid.appendChild(box);}}
function render(){setDropdown(false);renderList();setInputs();imageGrid();renderPreview();safeSave();}
function wireText(id,key){$(id).addEventListener('input',event=>{cur()[key]=event.target.value;if(key==='name'||key==='price')renderList();renderPreview();safeSave();});}
function sizesSelected(p){return E.normalizeSizes(p.sizes||'').filter(s=>['S','M','L'].includes(s));}
function renderSizeChoices(){const selected=sizesSelected(cur());
  document.querySelectorAll('.size-check').forEach(input=>{input.checked=selected.includes(input.value);input.closest('.size-choice').classList.toggle('selected',input.checked);});
  const tags=$('sizeSelected');tags.textContent='';if(!selected.length){tags.textContent='Chon size...';return;}
  for(const size of selected){const chip=document.createElement('span');chip.className='size-tag';chip.textContent=size;tags.appendChild(chip);}
}
function setDropdown(open){$('sizeMenu').classList.toggle('hidden',!open);$('sizeTrigger').setAttribute('aria-expanded',String(open));}
function syncShipLabel(input){input.parentElement.querySelector('.ship-state').textContent=input.checked?'B\u1eacT':'T\u1eaeT';}

async function optimizeImage(file){if(file.type&&!file.type.startsWith('image/'))throw Error('Tệp không phải ảnh.');const mustConvert=file.type==='image/webp'||file.size>1.95*1024*1024;if(!mustConvert)return {blob:file,name:file.name};
  const objectUrl=URL.createObjectURL(file);let image;try{image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Không thể đọc ảnh.'));i.src=objectUrl;});}finally{URL.revokeObjectURL(objectUrl);}
  const ratio=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);let quality=.88,blob;
  while(true){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(!blob)throw Error('Không thể nén ảnh.');if(blob.size<=1.95*1024*1024||quality<=.5)break;quality-=.11;}
  if(blob.size>2*1024*1024)throw Error('Ảnh vượt 2MB sau khi nén.');return {blob,name:file.name.replace(/\.[^.]+$/,'')+'.jpg'};
}
async function addPhotos(files){const p=cur();let count=0;for(const f of Array.from(files)){if(p.images.length>=9){toast('Mỗi sản phẩm tối đa 9 ảnh.',true);break;}try{const {blob,name}=await optimizeImage(f);p.images.push({name,blob,file:true,preview:URL.createObjectURL(blob),url:''});count++;}catch(e){toast(f.name+': '+e.message,true);}}
  imageGrid();renderPreview();safeSave();if(count){toast('Đã chọn '+count+' ảnh.'+(state.autoUpload&&cloudReady()?' Đang tự tải lên Cloudinary…':' Hãy cấu hình Cloudinary ở mục 05 để tải lên.'));if(state.autoUpload&&cloudReady())await uploadAll({silent:true});}}
function addUrls(){const p=cur();let n=0;for(const raw of $('imageUrls').value.split(/[\n,]+/)){const url=raw.trim();if(!url)continue;if(!/^https:\/\//i.test(url)){toast('URL ảnh phải bắt đầu bằng https://',true);return;}if(p.images.length>=9){toast('Tối đa 9 ảnh.',true);break;}p.images.push({name:'Ảnh từ URL',url});n++;}if(n){$('imageUrls').value='';imageGrid();renderPreview();safeSave();toast('Đã thêm '+n+' URL ảnh.');}}
function base64ToBlob(b64,mime){const binary=atob(b64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime});}
function chartBlob(){return base64ToBlob(window.HARIN_CHART_B64,'image/png');}
async function uploadCloud(blob,filename){
  const name=state.cloudName.trim(),preset=state.cloudPreset.trim();
  if(!/^[\w-]+$/.test(name)||!/^[\w-]+$/.test(preset))throw Error('Cloud name hoặc preset chứa ký tự không hợp lệ.');
  const data=new FormData();data.append('file',blob,filename);data.append('upload_preset',preset);
  const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(name)}/image/upload`,{method:'POST',body:data,signal:AbortSignal.timeout(120000)});
  const text=await response.text();let result;try{result=JSON.parse(text);}catch{throw Error('Cloudinary trả dữ liệu không hợp lệ (HTTP '+response.status+').');}
  if(!response.ok||!/^https:\/\//i.test(result.secure_url||''))throw Error(result.error?.message||'HTTP '+response.status);
  return result.secure_url;
}
let currentUploadPromise=null;
async function uploadAll({silent=false}={}){
  state.cloudName=$('cloudName').value.trim();state.cloudPreset=$('cloudPreset').value.trim();updateCloudStatus();safeSave();
  if(!cloudReady()){
    if(!silent){toast('Nhập Cloud name và tên Unsigned preset ở mục 05 trước.',true);$('cloudName').focus();}
    return {done:0,failed:0,missing:true};
  }
  if(currentUploadPromise)return currentUploadPromise;
  currentUploadPromise=(async()=>{
    state.uploading=true;$('uploadAll').disabled=true;
    const progress=$('uploadProgress'), failedImages=new Set();
    let done=0,failed=0,started=0;
    try{
      while(true){
        let target=null;
        for(const p of state.products){
          for(const img of p.images){
            if(img.blob&&!img.url&&!failedImages.has(img)&&img.uploadStatus!=='uploading'){
              target={p,img};break;
            }
          }
          if(target)break;
        }
        if(!target)break;
        const {p,img}=target;
        img.uploadStatus='uploading';img.uploadError='';started++;
        progress.textContent='Đang tải ảnh '+started+' · '+img.name;
        imageGrid();
        try{
          const url=await uploadCloud(img.blob,img.name);
          if(p.images.includes(img)){img.url=url;img.uploadStatus='uploaded';delete img.uploadError;}
          done++;
          safeSave();
        }catch(e){
          img.uploadStatus='error';img.uploadError=e.message||String(e);
          failedImages.add(img);failed++;
          toast('Ảnh '+img.name+': '+img.uploadError,true);
        }
        imageGrid();renderPreview();
      }
      const needChart=state.products.some(p=>p.chartMode==='image'&&!/^https:\/\//i.test(p.chartUrl||''));
      if(needChart){
        progress.textContent='Đang tải ảnh bảng size S/M/L…';
        try{
          const url=await uploadCloud(chartBlob(),'bang_quy_doi_size_harin.png');
          for(const p of state.products){if(p.chartMode==='image'&&!p.chartUrl)p.chartUrl=url;}
          done++;safeSave();$('chartUrl').value=cur().chartUrl||'';
        }catch(e){failed++;toast('Tải bảng size thất bại: '+e.message,true);}
      }
      progress.textContent=done+' ảnh đã có URL Cloudinary'+(failed?' · '+failed+' ảnh lỗi, bấm “Thử tải ảnh còn thiếu” để thử lại.':' · hoàn tất!');
      renderPreview();renderList();safeSave();
      if(done&&!silent)toast('Đã tạo URL cho '+done+' ảnh.');
      return {done,failed,missing:false};
    }finally{
      state.uploading=false;$('uploadAll').disabled=false;
      imageGrid();renderPreview();
    }
  })();
  try{return await currentUploadPromise;}finally{currentUploadPromise=null;}
}
function alertInvalid(pack=false){
  const v=E.validate(state.products,state.format,{shipping:state.shipping});
  if(v.errors.length){alert('Chưa thể tạo Excel vì:\n\n'+v.errors.join('\n'));return false;}
  if(v.missingUrls){
    const reason=`${v.missingUrls} sản phẩm chưa có ảnh bìa dạng URL HTTPS.\n\nHãy chọn ảnh từ máy và cấu hình Cloudinary để web tự tạo URL.`;
    if(pack)return confirm(reason+'\n\nBạn vẫn muốn tải ZIP lưu nháp (Excel chưa đủ ảnh để đăng Shopee)?');
    alert(reason+'\n\nChưa xuất Excel để tránh nhầm thành file đã sẵn sàng đăng Shopee.');
    return false;
  }
  if(v.localImages>0){
    if(pack)return confirm('Vẫn còn '+v.localImages+' ảnh chưa tải lên Cloudinary. Xuất ZIP lưu nháp?');
    alert('Còn '+v.localImages+' ảnh chưa có URL. Hãy tải lên Cloudinary hoặc xóa ảnh chưa tải trước khi xuất Excel.');
    return false;
  }
  return true;
}
function filename(prefix,ext){return prefix+'_'+nowStamp()+'.'+ext;}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function doExport(pack){if(cloudReady()&&state.autoUpload){$('exportStatus').textContent='Đang kiểm tra và tự tải ảnh chưa có URL lên Cloudinary…';await uploadAll({silent:true});}if(!alertInvalid(pack))return;const buttons=['excelBtn','exportBottom','zipBtn','zipBottom'].map($);buttons.forEach(b=>b.disabled=true);$('exportStatus').textContent='Đang tạo file...';try{
  const template=state.format==='basic'?window.SHOPEE_TEMPLATES.basic:window.SHOPEE_TEMPLATES.advanced;
  const res=await E.exportWorkbook(template,state.products,{format:state.format,shipping:state.shipping});
  if(!pack){download(res.blob,filename('harin_shopee_'+state.format,'xlsx'));$('exportStatus').textContent=`Đã tạo file XLSX với ${res.rows} dòng SKU / ${state.products.length} sản phẩm.`;toast('Đã xuất file Excel '+res.rows+' dòng SKU.');}
  else{const zip=new JSZip();const name=filename('harin_shopee_'+state.format,'xlsx');zip.file(name,res.blob);zip.file('bang_size/bang_quy_doi_size_harin.png',chartBlob());let photoCount=0;for(let i=0;i<state.products.length;i++){const p=state.products[i];for(let j=0;j<p.images.length;j++){const img=p.images[j];if(img.blob){const clean=(img.name||'photo.jpg').normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90);zip.file(`anh_san_pham/sp_${i+1}_${j+1}_${clean}`,img.blob);photoCount++;}}}
    const guide=`HARIN STUDIOS - GOI TAI SHOPEE\n\nSo san pham: ${state.products.length}\nSo dong SKU: ${res.rows}\nSo anh luu trong ZIP: ${photoCount}\n\nFile XLSX duoc giu nguyen dinh dang mau Shopee da tai len.\nShopee chi nhan URL hinh anh cong khai trong XLSX, khong nhan duong dan file anh trong ZIP.\nNeu chua co URL, hay tai anh len Cloudinary hoac kho anh web cong khai, sau do xuat lai XLSX.\nBrand (mau 100017): 0 = No Brand.\nCan nang: 0.5 kg, Dai: 15 cm, Rong: 20 cm, Cao: 5 cm.\nKho: Tuy chinh theo tung san pham, mac dinh 50 / bien the.\nVan chuyen (AD-AJ): ${Object.entries(state.shipping).map(([col,on])=>col+': '+on).join('; ')}.\nSize: S 82/64/88; M 86/68/92; L 90/72/96.\n`;
    zip.file('HUONG_DAN.txt',guide);const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});download(blob,filename('harin_shopee_tron_goi','zip'));$('exportStatus').textContent=`Đã tạo ZIP: ${res.rows} dòng SKU, ${photoCount} ảnh gốc và bảng size.`;toast('Đã xuất gói ZIP thành công.');}
  }catch(e){console.error(e);toast('Lỗi tạo file: '+e.message,true);$('exportStatus').textContent='Không thể tạo file: '+e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
function addOne(){state.products.push(defaultProduct());state.selected=state.products.length-1;render();$('itemName').focus();}
function cloneCurrent(){const p=cur();const copy={...p,name:p.name,sku:'',images:p.images.map(img=>({...img}))};state.products.splice(state.selected+1,0,copy);state.selected++;render();toast('Đã nhân bản sản phẩm.');}
function deleteCurrent(){if(state.products.length===1){state.products=[defaultProduct()];state.selected=0;render();toast('Đã xóa dữ liệu sản phẩm.');return;}if(!confirm('Xóa sản phẩm này khỏi danh sách?'))return;state.products.splice(state.selected,1);state.selected=Math.min(state.selected,state.products.length-1);render();}
function addBulk(){const names=prompt('Nhập danh sách tên sản phẩm, mỗi tên một dòng.\nTiền tố 𝙝𝙖𝙧𝙞𝙣.𝙨𝙩𝙪𝙙𝙞𝙤𝙨 được thêm tự động:','');if(!names)return;const vals=names.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!vals.length)return;const template=cur();for(const name of vals){state.products.push({...defaultProduct(),category:template.category,price:template.price,chartGroup:template.chartGroup,name});}state.selected=state.products.length-vals.length;render();toast('Đã thêm '+vals.length+' sản phẩm.');}
function init(){load();$('descriptionPreview').textContent=E.DESCRIPTION;
  $('itemCategory').insertAdjacentHTML('beforeend',window.SHOPEE_CATEGORIES.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} (${c.id})</option>`).join(''));
  for(const [id,key] of [['itemName','name'],['itemPrice','price'],['itemSku','sku'],['itemMaterial','material'],['itemOrigin','origin'],['chartUrl','chartUrl'],['chartGroup','chartGroup']])wireText(id,key);
  $('chartUrl').addEventListener('change',ev=>{cur().chartUrl=ev.target.value.trim().replace(/,+$/,'').trim();ev.target.value=cur().chartUrl;safeSave();renderPreview();});
  $('itemCategory').onchange=ev=>{cur().category=ev.target.value;renderPreview();safeSave();};$('basicCategory').oninput=ev=>{cur().category=ev.target.value;renderPreview();safeSave();};
  $('hasSizes').onchange=ev=>{cur().hasSizes=ev.target.checked;$('sizeInputWrap').classList.toggle('hidden',!ev.target.checked);renderPreview();safeSave();};
  $('stockInput').addEventListener('input',ev=>{cur().stock=ev.target.value;renderPreview();safeSave();});
  document.querySelectorAll('[data-ship]').forEach(input=>input.addEventListener('change',()=>{state.shipping[input.dataset.ship]=input.checked?'M\u1edf':'T\u1eaft';syncShipLabel(input);renderPreview();safeSave();}));
  $('sizeTrigger').onclick=()=>setDropdown($('sizeMenu').classList.contains('hidden'));
  document.querySelectorAll('.size-check').forEach(input=>input.addEventListener('change',()=>{
    const chosen=Array.from(document.querySelectorAll('.size-check:checked')).map(x=>x.value);
    if(!chosen.length){input.checked=true;toast('Chon it nhat mot size.',true);return;}
    cur().sizes=chosen.join(', ');renderSizeChoices();renderPreview();safeSave();
  }));
  $('sizeAll').onclick=()=>{cur().sizes='S, M, L';renderSizeChoices();renderPreview();safeSave();};
  document.addEventListener('click',ev=>{if(!$('sizeDropdown').contains(ev.target))setDropdown(false);});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')setDropdown(false);});

  for(const id of ['chartSaved','chartImage'])$(id).onchange=ev=>{if(!ev.target.checked)return;cur().chartMode=ev.target.value;$('chartGroupBox').style.display=cur().chartMode==='image'?'none':'';$('chartUrlBox').style.display=cur().chartMode==='image'?'':'none';renderPreview();safeSave();};
  $('formatType').onchange=ev=>{state.format=ev.target.value;setInputs();renderPreview();safeSave();};
  for(const id of ['cloudName','cloudPreset'])$(id).addEventListener('input',ev=>{state[id]=ev.target.value;updateCloudStatus();safeSave();});
  for(const id of ['cloudName','cloudPreset'])$(id).addEventListener('change',()=>{if(state.autoUpload&&cloudReady())uploadAll({silent:true});});
  $('autoUploadSwitch').onchange=ev=>{state.autoUpload=ev.target.checked;updateCloudStatus();safeSave();if(state.autoUpload&&cloudReady())uploadAll({silent:true});};
  $('addProduct').onclick=addOne;$('bulkProducts').onclick=addBulk;$('cloneProduct').onclick=cloneCurrent;$('deleteProduct').onclick=deleteCurrent;
  $('imageDrop').onclick=()=>$('imageFile').click();$('imageDrop').onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();$('imageFile').click();}};
  $('imageDrop').ondragover=ev=>{ev.preventDefault();$('imageDrop').classList.add('dragover');};$('imageDrop').ondragleave=()=>$('imageDrop').classList.remove('dragover');$('imageDrop').ondrop=ev=>{ev.preventDefault();$('imageDrop').classList.remove('dragover');addPhotos(ev.dataTransfer.files);};
  $('imageFile').onchange=async ev=>{await addPhotos(ev.target.files);ev.target.value='';};$('appendUrls').onclick=addUrls;
  $('uploadAll').onclick=uploadAll;$('excelBtn').onclick=$('exportBottom').onclick=()=>doExport(false);$('zipBtn').onclick=$('zipBottom').onclick=()=>doExport(true);
  $('chartPreview').onerror=()=>{$('chartPreview').src='assets/bang_quy_doi_size_harin.png';};
  $('chartDownload').onclick=()=>download(chartBlob(),'bang_quy_doi_kich_co_harin_studios.png');render();
  if(location.protocol==='http:'||location.protocol==='https:'){fetch('/api/public-config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(cfg=>{if(!cfg)return;if(cfg.cloudName)state.cloudName=cfg.cloudName;if(cfg.cloudPreset)state.cloudPreset=cfg.cloudPreset;setInputs();safeSave();if(state.autoUpload&&cloudReady())uploadAll({silent:true});}).catch(()=>{});}
}
init();
})();
