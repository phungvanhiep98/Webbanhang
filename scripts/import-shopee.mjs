// Nhập sản phẩm từ file Excel "Cập nhật hàng loạt" của Shopee Kênh Người Bán.
// Cách dùng: npm run import:shopee -- <thư mục chứa file .xlsx>
// Cần 3 file: Thông tin cơ bản (basic_info), Thông tin bán hàng (sales_info), Hình ảnh (media_info).
// Sản phẩm hết hàng (tổng tồn kho = 0) sẽ bị bỏ qua.
// data/overrides.json (tùy chọn): chỉnh thêm theo Mã sản phẩm, ví dụ
//   { "57710203782": { "category": "Dép có quai", "salePrice": 64750, "sold": 0 } }
//   salePrice = giá khuyến mãi thấp nhất đang hiển thị trên Shopee; mọi phân loại giảm cùng tỉ lệ.
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const dir = process.argv[2];
if (!dir) { console.error("Cách dùng: npm run import:shopee -- <thư mục chứa 3 file xlsx>"); process.exit(1); }
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"));
const pick = (k) => files.find((f) => f.includes(k));

// Đọc theo dòng tiêu đề tiếng Việt (dòng có "Mã Sản phẩm"), bỏ các dòng hướng dẫn.
function read(key) {
  const f = pick(key);
  if (!f) { console.warn(`Thiếu file ${key}`); return []; }
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(dir, f)).Sheets.Sheet1 ?? XLSX.readFile(path.join(dir, f)).Sheets[XLSX.readFile(path.join(dir, f)).SheetNames[0]], { header: 1, defval: "" });
  const h = rows.findIndex((r) => String(r[0]).trim() === "Mã Sản phẩm");
  const head = rows[h].map((c) => String(c).trim());
  return rows.slice(h + 1).filter((r) => /^\d+$/.test(String(r[0]).trim()))
    .map((r) => { const o = { _raw: r }; head.forEach((k, i) => { if (k && !(k in o)) o[k] = r[i]; }); return o; });
}

const basic = read("basic_info"), sales = read("sales_info"), media = read("media_info");
const overrides = fs.existsSync("data/overrides.json") ? JSON.parse(fs.readFileSync("data/overrides.json", "utf8")) : {};

const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const num = (v) => Number(String(v).replace(/\D/g, "")) || 0;

const out = [];
for (const b of basic) {
  const id = String(b["Mã Sản phẩm"]);
  const vs = sales.filter((s) => String(s["Mã Sản phẩm"]) === id);
  const stock = vs.reduce((t, s) => t + num(s["Số lượng"]), 0);
  if (!stock) continue; // hết hàng
  const m = media.find((x) => String(x["Mã Sản phẩm"]) === id) ?? {};
  const ov = overrides[id] ?? {};

  const inStockList = vs.filter((s) => num(s["Số lượng"]) > 0).map((s) => num(s["Giá"]));
  const lowestList = Math.min(...inStockList);
  const ratio = ov.salePrice ? Math.min(1, ov.salePrice / lowestList) : 1;
  const sale = (p) => Math.round(p * ratio);

  const variants = vs.map((s) => String(s["Tên phân loại"]).trim()).filter(Boolean);
  const variantPrices = {}, variantStock = {};
  for (const s of vs) {
    const v = String(s["Tên phân loại"]).trim();
    if (!v) continue;
    variantPrices[v] = sale(num(s["Giá"]));
    variantStock[v] = num(s["Số lượng"]);
  }
  const inStockPrices = vs.filter((s) => num(s["Số lượng"]) > 0).map((s) => sale(num(s["Giá"])));

  const images = [m["Ảnh bìa"], ...Array.from({ length: 8 }, (_, i) => m[`Hình ảnh sản phẩm ${i + 1}`])]
    .map((u) => String(u ?? "").trim()).filter((u) => /^https?:\/\//.test(u));
  // Ảnh theo phân loại cấp 1 (vd: màu)
  const optionImages = {};
  for (let i = 1; i <= 20; i++) {
    const name = String(m[`Tên phân loại ${i}`] ?? "").trim();
    const img = String(m[`Hình ảnh phân loại ${i}`] ?? "").trim();
    if (name && /^https?:\/\//.test(img)) optionImages[name] = img;
  }
  const tiers = variants.length && variants[0].includes(",") ? 2 : variants.length ? 1 : 0;
  const optionNames = [String(m["Tên nhóm phân loại hàng 1"] || "Phân loại").trim(), "Kích cỡ"].slice(0, tiers);

  const name = String(b["Tên Sản phẩm"]).trim();
  const lowestSale = Math.min(...(inStockPrices.length ? inStockPrices : Object.values(variantPrices)));
  out.push({
    id, slug: `${slugify(name)}-${id.slice(-4)}`, name,
    category: ov.category ?? (String(m["Ngành hàng"] ?? "").split("/").pop().trim() || "Sản phẩm"),
    price: lowestSale,
    originalPrice: ratio < 1 ? lowestList : undefined,
    stock, sold: ov.sold ?? 0,
    images: images.length ? images : ["/products/placeholder.svg"],
    variants, optionNames, variantPrices, variantStock, optionImages,
    description: String(b["Mô tả Sản phẩm"] ?? "").trim(),
  });
}

fs.writeFileSync("data/products.json", JSON.stringify(out, null, 2));
console.log(`Đã nhập ${out.length} sản phẩm còn hàng vào data/products.json (bỏ qua ${basic.length - out.length} sản phẩm hết hàng).`);
