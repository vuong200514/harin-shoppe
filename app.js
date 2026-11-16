(function(){
'use strict';
const E=window.HarinExport;
const $=id=>document.getElementById(id);
const nowStamp=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('')+'_'+[d.getHours(),d.getMinutes()].map(x=>String(x).padStart(2,'0')).join('');};
const CATEGORY_BY_ID=new Map((window.SHOPEE_CATEGORIES||[]).map(c=>[String(c.id),c]));
const DEFAULT_CHART_URL='https://res.cloudinary.com/p8nrkuot/image/upload/v1794772267/bang_quy_doi_kich_co_harin_studios.png';
const DEFAULT_CLOUD_NAME='p8nrkuot';
const DEFAULT_CLOUD_PRESET='harin_unsigned';
const defaultProduct=()=>({name:'',category:'',price:'',sku:'',material:'',origin:'',stock:50,hasSizes:true,sizes:'S, M, L',chartMode:'image',chartGroup:'top',chartUrl:DEFAULT_CHART_URL,images:[]});
const state={products:[defaultProduct()],selected:0,format:'advanced',shipping:{...E.SHIPPING},cloudName:DEFAULT_CLOUD_NAME,cloudPreset:DEFAULT_CLOUD_PRESET,autoUpload:true,uploading:false};
function esc(s){return String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function cur(){return state.products[state.selected];}
// Restricted to the 76 women's-fashion category IDs in advanced 100017.
function syncAutoFormat(){state.format='advanced';return state.format;}
function updateTemplateSummary(){
  const label=$('formatSummary');if(!label)return;
  label.textContent='Chỉ dùng mẫu nâng cao Thời Trang Nữ (100017). Thương hiệu luôn No Brand (mã 0 tại cột AL); hãy xác nhận kết quả khi Shopee nhập file.';
}

function safeSave(){try{const payload={...state,uploading:false,products:state.products.map(p=>({...p,images:p.images.filter(i=>i.url).map(i=>({name:i.name,url:i.url}))}))};localStorage.setItem('harin_product_studio_v2',JSON.stringify(payload));}catch(err){console.warn('Autosave unavailable',err);}}
function load(){try{let s=JSON.parse(localStorage.getItem('harin_product_studio_v2')||'null');const previous=!s;if(!s)s=JSON.parse(localStorage.getItem('harin_product_studio_v1')||'null');if(!s||!Array.isArray(s.products)||!s.products.length)return;
  state.products=s.products.map(p=>({...defaultProduct(),...p,
    // Preserve other product edits, but clear out-of-scope saved category IDs from V5.
    category:CATEGORY_BY_ID.has(String(p.category||''))?String(p.category):'',
    stock:p.stock===undefined?50:p.stock,chartMode:previous?'image':(p.chartMode||'image'),
    chartUrl:String(p.chartUrl||DEFAULT_CHART_URL).trim().replace(/,+$/,'').trim(),
    images:(p.images||[]).filter(i=>i.url).slice(0,9)}));
  state.selected=Math.min(Math.max(s.selected||0,0),state.products.length-1);
  state.shipping=E.normalizeShipping(s.shipping||{}); // migrate V7 'Mở' to Shopee-compatible 'Bật'
  syncAutoFormat();
  state.cloudName=DEFAULT_CLOUD_NAME;state.cloudPreset=DEFAULT_CLOUD_PRESET;state.autoUpload=true;
}catch(err){console.warn('Could not load previous state',err);}}
let toastTimer;
function toast(text,error=false){const el=$('toast');el.textContent=text;el.style.background=error?'#a93d31':'#292825';el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4500);}
function renderList(){const cont=$('productList');cont.textContent='';$('productCounter').textContent=state.products.length+' sản phẩm';state.products.forEach((p,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='product-tab'+(state.selected===i?' active':'');const child=document.createElement('span');child.className='tab-main';const ttl=document.createElement('span');ttl.className='tab-title';ttl.textContent=p.name||'Chưa đặt tên';const sub=document.createElement('span');sub.className='tab-sub';sub.textContent=(p.price?Number(p.price).toLocaleString('vi-VN')+'đ':'Chưa có giá')+' · '+(p.images||[]).length+' ảnh';const num=document.createElement('span');num.className='tab-number';num.textContent=String(i+1).padStart(2,'0');child.append(ttl,sub);btn.append(num,child);btn.onclick=()=>{state.selected=i;render();};cont.appendChild(btn);});}
function countVariants(p){const sizes=p.hasSizes?E.buildRows([p],{format:'advanced'}).rowCount:1;return sizes;}
function setInputs(){const p=cur();$('productIndex').textContent='Sản phẩm '+String(state.selected+1).padStart(2,'0');const fields={itemName:'name',itemPrice:'price',itemSku:'sku',itemMaterial:'material',itemOrigin:'origin',chartGroup:'chartGroup',chartUrl:'chartUrl'};
  for(const [id,key] of Object.entries(fields))$(id).value=p[key]??'';
  const matched=CATEGORY_BY_ID.get(String(p.category||''));$('itemCategory').value=matched?matched.name:'';setCategoryChosen();
  $('hasSizes').checked=!!p.hasSizes;$('sizeInputWrap').classList.toggle('hidden',!p.hasSizes);renderSizeChoices();$('stockInput').value=p.stock??50;
  document.querySelectorAll('[data-ship]').forEach(input=>{input.checked=state.shipping[input.dataset.ship]==='B\u1eadt';syncShipLabel(input);});
  $('chartSaved').checked=p.chartMode!=='image';$('chartImage').checked=p.chartMode==='image';
  $('chartGroupBox').style.display=p.chartMode==='image'?'none':'';$('chartUrlBox').style.display=p.chartMode==='image'?'':'none';
  updateTemplateSummary();
  $('itemCategory').setAttribute('aria-expanded','false');closeCategoryMenu();
  updateCloudStatus();
}
function renderPreview(){syncAutoFormat();updateTemplateSummary();const p=cur();$('previewTitle').textContent=E.fullTitle(p.name||'Tên sản phẩm của bạn');$('previewPrice').textContent=p.price?Number(p.price).toLocaleString('vi-VN')+' ₫':'Chưa nhập';const n=countVariants(p);$('previewVariants').textContent=p.hasSizes?n+' size':'Không phân loại';$('previewStock').textContent=(n*Number(p.stock||0)).toLocaleString('vi-VN');$('previewImages').textContent=(p.images||[]).filter(x=>x.url).length+' / '+(p.images||[]).length;$('previewBrand').textContent='No Brand · ghi trong Excel';
  const valid=E.validate(state.products,state.format,{shipping:state.shipping});const checkpoints=[
    [state.products.every(p=>p.name&&p.name.trim()),'Tên sản phẩm đã có tiền tố'],
    [state.products.every(p=>p.price&&Number(p.price)>=1000),'Đã nhập giá hợp lệ'],
    [state.products.every(p=>CATEGORY_BY_ID.has(String(p.category||''))),'Đã chọn ngành hàng Shopee hợp lệ'],
    [valid.missingUrls===0,'Ảnh chính đã có URL công khai'],
    [state.products.every(p=>p.chartMode==='saved'||!!p.chartUrl),'Bảng size có ID hoặc URL'],
    [Object.values(state.shipping).includes('B\u1eadt'),'Có ít nhất 1 kênh vận chuyển']
  ];
  const warningBox=$('exportWarnings');
  warningBox.replaceChildren();
  warningBox.classList.toggle('hidden',!valid.warnings.length);
  if (valid.warnings.length) {
    const header=document.createElement('strong');header.textContent=`⚠ ${valid.warnings.length} cảnh báo trước khi xuất`;
    const list=document.createElement('ul');
    for(const warning of valid.warnings){const li=document.createElement('li');li.textContent=warning;list.append(li);}
    warningBox.append(header,list);
  }
  const el=$('checklist');el.textContent='';for(const [good,label] of checkpoints){const div=document.createElement('div');div.className='step';const badge=document.createElement('span');badge.className='step-index';badge.style.background=good?'var(--green-pale)':'#fff2eb';badge.style.color=good?'var(--green)':'#c47745';badge.textContent=good?'✓':'!';const msg=document.createElement('span');msg.textContent=label;div.append(badge,msg);el.append(div);}
}
function imageSrc(i){if(i.preview)return i.preview;if(i.url)return i.url;return '';}
function cloudReady(){return !!(state.cloudName.trim()&&state.cloudPreset.trim());}
function updateCloudStatus(){
  const el=$('cloudReadyStatus');if(!el)return;
  const pending=state.products.flatMap(p=>p.images||[]).filter(i=>i.blob&&!i.url);
  const errors=pending.filter(i=>i.uploadStatus==='error');
  const ready=cloudReady();
  el.textContent=!ready?'⚠ Chưa có kết nối Cloudinary':state.uploading?'↻ Đang tự tải ảnh lên Cloudinary…':errors.length?'⚠ Có '+errors.length+' ảnh chưa tải thành công':'✓ Cloudinary sẵn sàng · tự lấy URL khi chọn ảnh';
  const retry=$('uploadAll');retry.classList.toggle('hidden',!(pending.length&&!state.uploading));
  $('uploadInline').classList.toggle('has-error',!ready||errors.length>0);
}
function updatePhotoControls(){
  const n=(cur().images||[]).length;
  $('photoToolbar').classList.toggle('hidden',n===0);
  $('photoCount').textContent=`${n} / 9 ảnh đã chọn`;
  $('imageCountHeader').textContent=`${n}/9 ảnh / sản phẩm`;
  $('addMorePhotos').disabled=n>=9;
  $('addMorePhotos').textContent=n>=9?'Đã đủ 9 ảnh':'＋ Thêm ảnh';
  $('imageDrop').setAttribute('aria-label',`Chọn ảnh sản phẩm từ máy, hiện có ${n} trên 9 ảnh`);
}
function imageGrid(){const grid=$('imageGrid');grid.textContent='';const p=cur();for(let i=0;i<p.images.length;i++){const img=p.images[i];const box=document.createElement('div');box.className='image-card';const frame=document.createElement('div');frame.className='image-frame';const pic=document.createElement('img');pic.src=imageSrc(img);pic.alt=img.name||'Ảnh sản phẩm';pic.onerror=()=>pic.style.visibility='hidden';const badge=document.createElement('span');badge.className='image-label';badge.textContent=i===0?'ẢNH BÌA':`ẢNH ${i}`;frame.append(pic,badge);const act=document.createElement('div');act.className='image-actions';const stateSpan=document.createElement('span');stateSpan.className=img.url?'ok-dot':'wait-dot';stateSpan.textContent=img.url?'✓ URL':img.uploadStatus==='uploading'?'↻ ĐANG TẢI':img.uploadStatus==='error'?'! LỖI':'● CHƯA TẢI';if(img.uploadError)stateSpan.title=img.uploadError;const group=document.createElement('span');for(const [txt,diff] of [['←',-1],['→',1]]){const b=document.createElement('button');b.textContent=txt;b.title='Đổi thứ tự ảnh';b.disabled=(diff<0&&i===0)||(diff>0&&i===p.images.length-1);b.onclick=()=>{[p.images[i],p.images[i+diff]]=[p.images[i+diff],p.images[i]];imageGrid();renderPreview();safeSave();};group.appendChild(b);}const del=document.createElement('button');del.textContent='×';del.title='Xóa ảnh';del.onclick=()=>{let removed=p.images.splice(i,1)[0];if(removed.preview?.startsWith('blob:'))URL.revokeObjectURL(removed.preview);imageGrid();renderPreview();safeSave();updateCloudStatus();};group.appendChild(del);if(i>0){const cover=document.createElement('button');cover.type='button';cover.className='image-cover-btn';cover.textContent='★ Đặt làm ảnh bìa';cover.onclick=()=>{const [chosen]=p.images.splice(i,1);p.images.unshift(chosen);imageGrid();renderPreview();safeSave();toast('Đã đổi ảnh bìa.');};group.appendChild(cover);}if(img.url){const copy=document.createElement('button');copy.textContent='URL';copy.title='Sao chép URL ảnh';copy.onclick=()=>navigator.clipboard?.writeText(img.url).then(()=>toast('Đã sao chép URL ảnh.')).catch(()=>toast('Không sao chép được URL.',true));group.appendChild(copy);}act.append(stateSpan,group);const name=document.createElement('div');name.className='image-name';name.title=img.name||'';name.textContent=img.name||'Ảnh đã có URL';box.append(frame,act,name);grid.appendChild(box);}updatePhotoControls();}
function render(){closeCategoryMenu();setDropdown(false);renderList();setInputs();imageGrid();renderPreview();safeSave();updateCloudStatus();}
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
async function addPhotos(files){
  const p=cur();
  const selected=Array.from(files||[]);
  if(!selected.length)return;
  const slots=Math.max(0,9-p.images.length);
  if(slots===0){toast('Đã đủ 9 ảnh cho sản phẩm. Xóa bớt ảnh để chọn ảnh khác.',true);return;}
  if(selected.length>slots)toast(`Bạn chọn ${selected.length} ảnh nhưng chỉ còn ${slots} chỗ. Web sẽ lấy ${slots} ảnh đầu tiên.`,true);
  let count=0;
  for(const f of selected.slice(0,slots)){
    try{const {blob,name}=await optimizeImage(f);p.images.push({name,blob,file:true,preview:URL.createObjectURL(blob),url:'',uploadStatus:'pending'});count++;}
    catch(e){toast(f.name+': '+e.message,true);}
  }
  imageGrid();renderPreview();renderList();safeSave();updateCloudStatus();
  if(count){
    toast(`Đã nhận ${count} ảnh cùng lúc. Đang tự lấy URL Cloudinary…`);
    if(cloudReady())await uploadAll({silent:true});else toast('Chưa có cấu hình Cloudinary trên server.',true);
  }
}
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
  updateCloudStatus();safeSave();
  if(!cloudReady()){
    if(!silent)toast('Chưa có kết nối Cloudinary. Kiểm tra Environment trên Render.',true);
    return {done:0,failed:0,missing:true};
  }
  if(currentUploadPromise)return currentUploadPromise;
  currentUploadPromise=(async()=>{
    state.uploading=true;$('uploadAll').disabled=true;updateCloudStatus();
    const progress=$('uploadProgress'), failedImages=new Set();
    let done=0,failed=0,started=0;
    try{
      const total=state.products.reduce((sum,p)=>sum+(p.images||[]).filter(img=>img.blob&&!img.url).length,0);
      async function uploadWorker(){
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
          progress.textContent=`Đang tải cùng lúc tối đa 3 ảnh · đã xử lý ${done+failed}/${total} ảnh`;
          imageGrid();
          try{
            const url=await uploadCloud(img.blob,img.name);
            if(p.images.includes(img)){img.url=url;img.uploadStatus='uploaded';delete img.uploadError;}
            done++;safeSave();
          }catch(e){
            img.uploadStatus='error';img.uploadError=e.message||String(e);
            failedImages.add(img);failed++;
            toast('Ảnh '+img.name+': '+img.uploadError,true);
          }
          progress.textContent=`Đã xử lý ${done+failed}/${total} ảnh · ${done} thành công${failed?' · '+failed+' lỗi':''}`;
          imageGrid();renderPreview();renderList();updateCloudStatus();
        }
      }
      await Promise.all(Array.from({length:Math.min(3,total)},()=>uploadWorker()));
      const needChart=state.products.some(p=>p.chartMode==='image'&&!/^https:\/\//i.test(p.chartUrl||''));
      if(needChart){
        progress.textContent='Đang tải ảnh bảng size S/M/L…';
        try{
          const url=await uploadCloud(chartBlob(),'bang_quy_doi_size_harin.png');
          for(const p of state.products){if(p.chartMode==='image'&&!p.chartUrl)p.chartUrl=url;}
          done++;safeSave();$('chartUrl').value=cur().chartUrl||'';
        }catch(e){failed++;toast('Tải bảng size thất bại: '+e.message,true);}
      }
      progress.textContent=done+' ảnh mới đã có URL Cloudinary'+(failed?' · '+failed+' ảnh lỗi, bấm “Tải lại ảnh lỗi” ở đây để thử lại.':' · hoàn tất!');
      renderPreview();renderList();safeSave();
      if(done&&!silent)toast('Đã tạo URL cho '+done+' ảnh.');
      return {done,failed,missing:false};
    }finally{
      state.uploading=false;$('uploadAll').disabled=false;
      imageGrid();renderPreview();updateCloudStatus();
    }
  })();
  try{return await currentUploadPromise;}finally{currentUploadPromise=null;}
}
function alertInvalid(pack=false){
  syncAutoFormat();
  const v=E.validate(state.products,state.format,{shipping:state.shipping});
  if(v.errors.length){alert('Chưa thể tạo Excel vì:\n\n'+v.errors.join('\n'));return false;}
  if(v.missingUrls){
    const reason=`${v.missingUrls} sản phẩm chưa có ảnh bìa dạng URL HTTPS.\n\nChọn ảnh tại mục 02 và kiểm tra trạng thái tải lên Cloudinary.`;
    if(pack)return confirm(reason+'\n\nBạn vẫn muốn tải ZIP lưu nháp (Excel chưa đủ ảnh để đăng Shopee)?');
    alert(reason+'\n\nChưa xuất Excel để tránh nhầm thành file đã sẵn sàng đăng Shopee.');
    return false;
  }
  if(v.localImages>0){
    if(pack)return confirm('Vẫn còn '+v.localImages+' ảnh chưa tải lên Cloudinary. Xuất ZIP lưu nháp?');
    alert('Còn '+v.localImages+' ảnh chưa có URL. Hãy tải lên Cloudinary hoặc xóa ảnh chưa tải trước khi xuất Excel.');
    return false;
  }
  if(v.warnings.length) return confirm('CẢNH BÁO - Kiểm tra trước khi xuất Excel:\n\n'+v.warnings.join('\n\n')+'\n\nBạn đã kiểm tra và vẫn muốn tiếp tục?');
  return true;
}
function filename(prefix,ext){return prefix+'_'+nowStamp()+'.'+ext;}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function doExport(pack){syncAutoFormat();if(cloudReady()&&state.autoUpload){$('exportStatus').textContent='Đang kiểm tra và tự tải ảnh chưa có URL lên Cloudinary…';await uploadAll({silent:true});}if(!alertInvalid(pack))return;const buttons=['excelBtn','exportBottom','zipBtn','zipBottom'].map($);buttons.forEach(b=>b.disabled=true);$('exportStatus').textContent='Đang tạo file...';try{
  const template=window.SHOPEE_TEMPLATES.advanced;
  const res=await E.exportWorkbook(template,state.products,{format:state.format,shipping:state.shipping});
  if(!pack){download(res.blob,filename('harin_thoi_trang_nu_nang_cao','xlsx'));$('exportStatus').textContent=`Đã tạo file nâng cao Thời Trang Nữ với ${res.rows} dòng SKU / ${state.products.length} sản phẩm. No Brand được ghi vào cột AL; vẫn cần kiểm tra khi nhập trên Shopee.`;toast('Đã xuất Excel nâng cao '+res.rows+' dòng SKU.');}
  else{const zip=new JSZip();const name=filename('harin_thoi_trang_nu_nang_cao','xlsx');zip.file(name,res.blob);zip.file('bang_size/bang_quy_doi_size_harin.png',chartBlob());let photoCount=0;for(let i=0;i<state.products.length;i++){const p=state.products[i];for(let j=0;j<p.images.length;j++){const img=p.images[j];if(img.blob){const clean=(img.name||'photo.jpg').normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90);zip.file(`anh_san_pham/sp_${i+1}_${j+1}_${clean}`,img.blob);photoCount++;}}}
    const guide=`HARIN STUDIOS - GOI TAI SHOPEE\n\nSo san pham: ${state.products.length}\nSo dong SKU: ${res.rows}\nSo anh luu trong ZIP: ${photoCount}\n\nFile XLSX duoc giu nguyen dinh dang mau Shopee da tai len.\nShopee chi nhan URL hinh anh cong khai trong XLSX, khong nhan duong dan file anh trong ZIP.\nNeu chua co URL, hay tai anh len Cloudinary hoac kho anh web cong khai, sau do xuat lai XLSX.\nThuong hieu shop: No Brand. Mau nang cao 100017: AL = 0 (No Brand); kiem tra khi nhap Shopee.\nCan nang: 0.5 kg, Dai: 15 cm, Rong: 20 cm, Cao: 5 cm.\nKho: Tuy chinh theo tung san pham, mac dinh 50 / bien the.\nVan chuyen (AD-AJ): ${Object.entries(state.shipping).map(([col,on])=>col+': '+on).join('; ')}.\nSize: S 82/64/88; M 86/68/92; L 90/72/96.\n`;
    zip.file('HUONG_DAN.txt',guide);const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});download(blob,filename('harin_shopee_tron_goi','zip'));$('exportStatus').textContent=`Đã tạo ZIP: ${res.rows} dòng SKU, ${photoCount} ảnh gốc và bảng size.`;toast('Đã xuất gói ZIP thành công.');}
  }catch(e){console.error(e);toast('Lỗi tạo file: '+e.message,true);$('exportStatus').textContent='Không thể tạo file: '+e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
function addOne(){state.products.push(defaultProduct());state.selected=state.products.length-1;render();$('itemName').focus();}
function cloneCurrent(){const p=cur();const copy={...p,name:p.name,sku:'',images:p.images.map(img=>({...img}))};state.products.splice(state.selected+1,0,copy);state.selected++;render();toast('Đã nhân bản sản phẩm.');}
function deleteCurrent(){if(state.products.length===1){state.products=[defaultProduct()];state.selected=0;render();toast('Đã xóa dữ liệu sản phẩm.');return;}if(!confirm('Xóa sản phẩm này khỏi danh sách?'))return;state.products.splice(state.selected,1);state.selected=Math.min(state.selected,state.products.length-1);render();}
function addBulk(){const names=prompt('Nhập danh sách tên sản phẩm, mỗi tên một dòng.\nTiền tố 𝙝𝙖𝙧𝙞𝙣.𝙨𝙩𝙪𝙙𝙞𝙤𝙨 được thêm tự động:','');if(!names)return;const vals=names.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!vals.length)return;const template=cur();for(const name of vals){state.products.push({...defaultProduct(),category:template.category,price:template.price,chartGroup:template.chartGroup,name});}state.selected=state.products.length-vals.length;render();toast('Đã thêm '+vals.length+' sản phẩm.');}
// Category IDs and paths from the uploaded advanced 100017 women's-fashion template only.
const normalizedCategoryCache=(window.SHOPEE_CATEGORIES||[]).map(c=>({
  ...c, norm:normalizeCategoryText(c.name), root:c.name.split('/')[0],
  leaf:c.name.split('/').at(-1), segments:c.name.split('/').map(normalizeCategoryText)
}));
let categoryMatches=[], categoryActive=-1;
function normalizeCategoryText(s){return String(s||'').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim();}
function closeCategoryMenu(){const menu=$('categoryResults');if(!menu)return;menu.classList.add('hidden');$('itemCategory').setAttribute('aria-expanded','false');categoryActive=-1;}
function setCategoryChosen(){const c=CATEGORY_BY_ID.get(String(cur().category||''));const el=$('categoryChosen');if(!el)return;el.classList.toggle('filled',!!c);el.textContent=c?`✓ Đã chọn: ${c.name.replaceAll('/',' › ')} · ID ${c.id}`:'Chưa chọn ngành hàng — gõ tên rồi bấm vào gợi ý';}
function categoryScore(c,q,tokens){
 if(c.id===q)return -200;
 const leaf=normalizeCategoryText(c.leaf),root=normalizeCategoryText(c.root);
 // A one-word query such as "nam" should prioritize men's categories before "nấm".
 const word=new RegExp('(?:^| )'+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?: |$)');
 if(tokens.length===1&&word.test(root))return root.includes('thoi trang')?-150:-140;
 if(tokens.length===1&&root.includes(q))return -130;
 if(leaf===q)return -100;
 if(c.segments.some(x=>x===q))return -80;
 if(leaf.startsWith(q))return -60;
 if(c.segments.some(x=>x.startsWith(q)))return -40;
 if(c.norm.includes(q))return -20;
 return 0;
}
function markCategory(text,tokens){
 // Reconstruct the fold-to-original character offsets so non-accent queries highlight accented characters.
 const pieces=Array.from(text), folded=[], from=[];
 for(let i=0;i<pieces.length;i++){
   const fold=pieces[i].toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
   for(const char of fold){folded.push(char);from.push(i);}
 }
 const spans=[];const lower=folded.join('');
 for(const term of tokens){if(!term)continue;let offset=0,index;while((index=lower.indexOf(term,offset))>=0){spans.push([from[index],from[index+term.length-1]+1]);offset=index+term.length;}}
 if(!spans.length)return esc(text);
 const hits=new Set();for(const [start,end] of spans)for(let i=start;i<end;i++)hits.add(i);
 let output='',inside=false;for(let i=0;i<pieces.length;i++){
   if(hits.has(i)&&!inside){output+='<mark>';inside=true;}
   if(!hits.has(i)&&inside){output+='</mark>';inside=false;}
   output+=esc(pieces[i]);
 }
 if(inside)output+='</mark>';return output;
}
function categoryPick(c){
 cur().category=String(c.id);const inp=$('itemCategory');inp.value=c.name;setCategoryChosen();closeCategoryMenu();
 syncAutoFormat();
 renderPreview();safeSave();
}
function categoryHighlightActive(index){
 const menu=$('categoryResults');categoryActive=index;
 menu.querySelectorAll('.category-result').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-selected',String(i===index));});
 const active=menu.querySelectorAll('.category-result')[index];if(active){active.scrollIntoView({block:'nearest'});$('itemCategory').setAttribute('aria-activedescendant',active.id);}else $('itemCategory').removeAttribute('aria-activedescendant');
}
function showCategorySuggestions(){
 const menu=$('categoryResults'),query=normalizeCategoryText($('itemCategory').value),terms=query.split(' ').filter(Boolean);
 menu.replaceChildren();categoryMatches=[];categoryActive=-1;
 if(!query){
   const heading=document.createElement('div');heading.className='category-menu-head';heading.textContent='Thời Trang Nữ · chọn nhóm để tìm ngành hàng chi tiết';menu.append(heading);
   const grid=document.createElement('div');grid.className='category-roots';
   for(const root of (window.SHOPEE_ROOTS||[])){
     const b=document.createElement('button');b.type='button';b.className='category-root';b.textContent='▸ '+root;
     b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{$('itemCategory').value=root;showCategorySuggestions();$('itemCategory').focus();});grid.append(b);
   }
   menu.append(grid);
 }else{
   categoryMatches=normalizedCategoryCache.filter(c=>terms.every(term=>c.norm.includes(term)||c.id.includes(term)))
     .sort((a,b)=>categoryScore(a,query,terms)-categoryScore(b,query,terms)||a.root.localeCompare(b.root,'vi')||a.name.localeCompare(b.name,'vi'));
   const total=categoryMatches.length;
   const head=document.createElement('div');head.className='category-menu-head';head.textContent=total?`${total.toLocaleString('vi-VN')} ngành hàng khớp · gõ thêm để lọc chính xác`:'Không tìm thấy ngành hàng theo từ khóa';menu.append(head);
   const MAX_RENDER=180;
   for(let i=0;i<Math.min(total,MAX_RENDER);i++){
     const c=categoryMatches[i];const b=document.createElement('button');b.type='button';b.className='category-result';b.id='categoryResult_'+i;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.dataset.index=String(i);
     const info=document.createElement('span');info.className='category-result-text';
     const path=document.createElement('span');path.className='category-result-path';path.innerHTML=markCategory(c.name.replaceAll('/',' › '),terms);
     const note=document.createElement('span');note.className='category-result-sub';note.textContent='✓ Mẫu nâng cao Thời Trang Nữ (100017)';
     const id=document.createElement('span');id.className='category-result-id';id.textContent='#'+c.id;
     info.append(path,note);b.append(info,id);
     b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>categoryPick(c));menu.append(b);
   }
   if(total>MAX_RENDER){const tail=document.createElement('div');tail.className='category-menu-head';tail.textContent=`Đang hiển thị ${MAX_RENDER}/${total}. Gõ thêm từ khóa để lọc.`;menu.append(tail);}
 }
 menu.classList.remove('hidden');$('itemCategory').setAttribute('aria-expanded','true');$('itemCategory').removeAttribute('aria-activedescendant');
}
function wireCategorySearch(){
 const input=$('itemCategory');
 input.addEventListener('focus',showCategorySuggestions);
 input.addEventListener('input',()=>{cur().category='';setCategoryChosen();showCategorySuggestions();renderPreview();safeSave();});
 input.addEventListener('keydown',ev=>{
   if(ev.key==='Escape'){ev.preventDefault();closeCategoryMenu();return;}
   if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){
     ev.preventDefault();if($('categoryResults').classList.contains('hidden'))showCategorySuggestions();
     const count=Math.min(categoryMatches.length,180);if(count){let i=categoryActive+(ev.key==='ArrowDown'?1:-1);if(i<0)i=count-1;if(i>=count)i=0;categoryHighlightActive(i);}return;
   }
   if(ev.key==='Enter' && !$('categoryResults').classList.contains('hidden') && categoryActive>=0){ev.preventDefault();categoryPick(categoryMatches[categoryActive]);}
 });
 document.addEventListener('pointerdown',ev=>{if(!$('categoryField').contains(ev.target))closeCategoryMenu();});
}

function init(){load();$('descriptionPreview').textContent=E.DESCRIPTION;
  $('categoryTotal').textContent=window.SHOPEE_CATEGORIES.length.toLocaleString('vi-VN');
  for(const [id,key] of [['itemName','name'],['itemPrice','price'],['itemSku','sku'],['itemMaterial','material'],['itemOrigin','origin'],['chartUrl','chartUrl'],['chartGroup','chartGroup']])wireText(id,key);
  $('chartUrl').addEventListener('change',ev=>{cur().chartUrl=ev.target.value.trim().replace(/,+$/,'').trim();ev.target.value=cur().chartUrl;safeSave();renderPreview();});
  wireCategorySearch();
  $('hasSizes').onchange=ev=>{cur().hasSizes=ev.target.checked;$('sizeInputWrap').classList.toggle('hidden',!ev.target.checked);renderPreview();safeSave();};
  $('stockInput').addEventListener('input',ev=>{cur().stock=ev.target.value;renderPreview();safeSave();});
  document.querySelectorAll('[data-ship]').forEach(input=>input.addEventListener('change',()=>{state.shipping[input.dataset.ship]=input.checked?'B\u1eadt':'T\u1eaft';syncShipLabel(input);renderPreview();safeSave();}));
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
  $('addProduct').onclick=addOne;$('bulkProducts').onclick=addBulk;$('cloneProduct').onclick=cloneCurrent;$('deleteProduct').onclick=deleteCurrent;
  $('imageDrop').onclick=()=>$('imageFile').click();$('imageDrop').onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();$('imageFile').click();}};
  $('imageDrop').ondragover=ev=>{ev.preventDefault();$('imageDrop').classList.add('dragover');};$('imageDrop').ondragleave=()=>$('imageDrop').classList.remove('dragover');$('imageDrop').ondrop=ev=>{ev.preventDefault();$('imageDrop').classList.remove('dragover');addPhotos(ev.dataTransfer.files);};
  $('addMorePhotos').onclick=()=>$('imageFile').click();
  $('imageFile').onchange=ev=>{const picked=Array.from(ev.target.files||[]);ev.target.value='';void addPhotos(picked);};
  $('uploadAll').onclick=uploadAll;$('excelBtn').onclick=$('exportBottom').onclick=()=>doExport(false);$('zipBtn').onclick=$('zipBottom').onclick=()=>doExport(true);
  $('chartPreview').onerror=()=>{$('chartPreview').src='assets/bang_quy_doi_size_harin.png';};
  $('chartDownload').onclick=()=>download(chartBlob(),'bang_quy_doi_kich_co_harin_studios.png');render();
  if(location.protocol==='http:'||location.protocol==='https:'){fetch('/api/public-config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(cfg=>{if(!cfg)return;if(cfg.cloudName)state.cloudName=cfg.cloudName;if(cfg.cloudPreset)state.cloudPreset=cfg.cloudPreset;updateCloudStatus();safeSave();if(cloudReady())uploadAll({silent:true});}).catch(()=>{});}
}
init();
})();
