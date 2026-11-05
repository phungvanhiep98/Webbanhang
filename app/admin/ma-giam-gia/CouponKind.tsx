"use client";
import { useState } from "react";

export function CouponKind() {
  const [kind, setKind] = useState("percent");
  return (
    <>
      <div className="field">
        <label>Kiểu giảm</label>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="percent">Giảm theo %</option>
          <option value="amount">Giảm số tiền</option>
        </select>
      </div>
      <div className="field">
        <label>{kind === "percent" ? "Giảm bao nhiêu % *" : "Giảm bao nhiêu tiền (₫) *"}</label>
        <input name="value" required inputMode="numeric" placeholder={kind === "percent" ? "VD: 10" : "VD: 20000"} />
      </div>
      {kind === "percent" && (
        <div className="field"><label>Giảm tối đa (₫)</label><input name="max_discount" inputMode="numeric" placeholder="0 = không giới hạn" /></div>
      )}
    </>
  );
}
