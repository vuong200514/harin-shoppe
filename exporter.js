/* Harin Shopee spreadsheet export engine. Preserves official workbook metadata, validations and hidden sheets. */
(function (root) {
  'use strict';
  const DESCRIPTION = `📍 LƯU Ý KHI ĐẶT HÀNG

* Màu sắc thực tế có thể chênh lệch nhẹ do ánh sáng, góc chụp và màn hình hiển thị.
* Nếu phân vân về kích cỡ hoặc sản phẩm, đừng ngại nhắn tin để shop tư vấn.
* Shop luôn kiểm tra sản phẩm cẩn thận trước khi gửi đến bạn.

🧺 HƯỚNG DẪN BẢO QUẢN
• Giặt nhẹ bằng tay hoặc cho vào túi giặt nếu giặt máy.
• Không sử dụng chất tẩy mạnh.
• Lộn mặt trái khi giặt và phơi nơi thoáng mát.
• Hạn chế sấy ở nhiệt độ cao để giữ màu và form vải.

🤍 CAM KẾT CỦA SHOP
✓ Sản phẩm đúng hình, đúng mô tả.
✓ Hỗ trợ khách hàng nhanh chóng trước và sau khi nhận hàng.
✓ Luôn lắng nghe mọi góp ý để hoàn thiện chất lượng sản phẩm và dịch vụ.

Cảm ơn bạn đã lựa chọn 𝒉𝒂𝒓𝒊𝒏.𝒔𝒕𝒖𝒅𝒊𝒐𝒔. Hy vọng sản phẩm sẽ khiến bạn hài lòng. Nếu yêu thích, đừng quên dành cho shop một đánh giá 5⭐ để tiếp thêm động lực cho chúng mình nhé!`;
  const PREFIX = '𝙝𝙖𝙧𝙞𝙣.𝙨𝙩𝙪𝙙𝙞𝙤𝙨';
  const SIZE_IDS = { top: 1204838133, bottom: 1504827701 };
  const SHIPPING = { AD: 'Tắt', AE: 'Mở', AF: 'Mở', AG: 'Tắt', AH: 'Mở', AI: 'Mở', AJ: 'Mở' };

  function escapeXml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  }
  function numeric(value) { return Number(value); }
  function cell(col, row, value) {
    if (value === undefined || value === null || value === '') return '';
    const pos = col + row;
    if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${pos}" s="6"><v>${value}</v></c>`;
    return `<c r="${pos}" s="6" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  }
  function colsToIndex(col) {
    let n=0;
    for (const c of col) n=n*26+(c.charCodeAt(0)-64);
    return n;
  }
  function fullTitle(name) {
    const stripped=String(name||'').trim().replace(/^𝙝𝙖𝙧𝙞𝙣\.𝙨𝙩𝙪𝙙𝙞𝙤𝙨\s*/u,'');
    return PREFIX + ' ' + stripped;
  }
  function normalizeSizes(sizes) {
    const arr = String(sizes||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
    return [...new Set(arr)].slice(0,30);
  }
  function getImageUrls(p) {
    return (p.images||[]).map(img=>typeof img==='string'?img:img.url).filter(url=>/^https:\/\//i.test(String(url||'').trim())).slice(0,9);
  }
  function buildRows(products, options) {
    const advanced=options.format!=='basic';
    let rowNo=7; const out=[];
    for (let index=0;index<products.length;index++) {
      const p=products[index];
      const sizes=p.hasSizes ? normalizeSizes(p.sizes||'S, M, L') : [''];
      const names=sizes.length?sizes:[''];
      const urls=getImageUrls(p);
      const baseSku = (p.sku||`HARIN-${String(index+1).padStart(4,'0')}`).trim().replace(/\s/g,'-');
      const groupId = baseSku;
      const groupName = p.hasSizes ? 'Kích cỡ' : '';
      for (let v=0;v<names.length;v++) {
        const size=names[v];
        const sku = p.hasSizes ? `${baseSku}-${size.replace(/\s/g,'-')}` : baseSku;
        const chartId=p.chartId || (p.chartGroup==='bottom' ? SIZE_IDS.bottom : SIZE_IDS.top);
        const chartMode = p.chartMode || 'saved';
        const data={
          A: numeric(p.category), B: fullTitle(p.name), C: DESCRIPTION,
          D: baseSku, E: p.hasSizes ? groupId : undefined,
          F: groupName, G: size,
          K: numeric(p.price), L: 50, M: sku,
          N: chartMode==='saved' ? numeric(chartId) : undefined,
          O: chartMode==='image' ? (p.chartUrl||options.chartUrl||'') : undefined,
          Z: 0.5, AA: 15, AB: 20, AC: 5,
          ...SHIPPING,
          ...(advanced ? {AL:0, AN:p.origin||undefined, AO:p.material||undefined} : {})
        };
        for (let u=0;u<urls.length;u++) data[String.fromCharCode('Q'.charCodeAt(0)+u)] = urls[u];
        // Future variant photos should be supplied as true URLs to H, if needed.
        const sorted=Object.entries(data).filter(([,val])=>val!==undefined&&val!==null&&val!=='')
          .sort((a,b)=>colsToIndex(a[0])-colsToIndex(b[0]));
        out.push(`<row r="${rowNo}" spans="1:${advanced?80:38}">${sorted.map(([col,val])=>cell(col,rowNo,val)).join('')}</row>`);
        rowNo++;
      }
    }
    return {xml:out.join(''),rowCount:rowNo-7,lastRow:Math.max(6,rowNo-1)};
  }
  async function exportWorkbook(templateBase64, products, options={}) {
    if (!root.JSZip) throw new Error('Thiếu JSZip, không thể xuất Excel.');
    const format=options.format||'advanced';
    const zip=await root.JSZip.loadAsync(templateBase64,{base64:true});
    const path='xl/worksheets/sheet2.xml';
    let xml=await zip.file(path).async('string');
    if (!xml.includes('</sheetData>')) throw new Error('Mẫu Shopee không có thẻ sheetData hợp lệ.');
    const result=buildRows(products,{...options,format});
    xml=xml.replace('</sheetData>',result.xml+'</sheetData>');
    xml=xml.replace(/<dimension ref="[^"]+"\s*\/?>(?:<\/dimension>)?/,`<dimension ref="A1:${format==='basic'?'AL':'CB'}${result.lastRow}"></dimension>`);
    // Some sheets in the Shopee-provided templates use a nonstandard snake_case activePane.
    xml=xml.replace(/activePane="bottom_left"/g,'activePane="bottomLeft"')
      .replace(/activePane="top_left"/g,'activePane="topLeft"');
    zip.file(path,xml);
    // Correct the same non-standard pane enumeration in the other preserved sheets.
    const sheets=Object.keys(zip.files).filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name)&&name!==path);
    for (const other of sheets) {
      const source=await zip.file(other).async('string');
      if (/activePane="(?:bottom_left|top_left|top_right|bottom_right)"/.test(source)) {
        const fixed=source.replace(/activePane="bottom_left"/g,'activePane="bottomLeft"')
          .replace(/activePane="top_left"/g,'activePane="topLeft"')
          .replace(/activePane="top_right"/g,'activePane="topRight"')
          .replace(/activePane="bottom_right"/g,'activePane="bottomRight"');
        zip.file(other,fixed);
      }
    }
    return {blob:await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}), rows:result.rowCount};
  }
  function validate(products, format='advanced') {
    const errors=[];
    if (!products.length)errors.push('Chưa có sản phẩm nào.');
    let missingUrls=0, localImages=0;
    for (let i=0;i<products.length;i++) {
      const p=products[i],tag=`Sản phẩm ${i+1}`;
      if (!p.name||!p.name.trim())errors.push(`${tag}: chưa nhập tên.`);
      if (!/^\d+$/.test(String(p.category||'')))errors.push(`${tag}: chưa chọn mã ngành hàng.`);
      if (!Number.isFinite(Number(p.price))||Number(p.price)<1000||Number(p.price)>120000000)errors.push(`${tag}: giá phải trong khoảng 1.000 – 120.000.000đ.`);
      if (fullTitle(p.name).length>120)errors.push(`${tag}: tên đầy đủ vượt 120 ký tự.`);
      if (p.hasSizes && !normalizeSizes(p.sizes).length)errors.push(`${tag}: thiếu danh sách kích cỡ.`);
      if (p.chartMode==='image' && !/^https:\/\//i.test(p.chartUrl||''))errors.push(`${tag}: chế độ ảnh bảng size cần URL công khai.`);
      const images=p.images||[];
      const urls=getImageUrls(p);
      localImages+=images.filter(img=>img.file&&!img.url).length;
      if (!urls.length)missingUrls++;
      if (images.length>9)errors.push(`${tag}: tối đa 9 ảnh (1 ảnh bìa + 8 ảnh phụ).`);
    }
    return {errors,missingUrls,localImages};
  }
  root.HarinExport={DESCRIPTION,PREFIX,SIZE_IDS,SHIPPING,fullTitle,buildRows,exportWorkbook,validate};
})(typeof window!=='undefined'?window:globalThis);
