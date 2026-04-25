"use client";

import { useState, useEffect } from "react";

type Override = { min: number; max: number };
type Config = {
  validCountries: string[];
  defaultAgeMin: number;
  defaultAgeMax: number;
  countryAgeOverrides: Record<string, Override>;
  requireVocationalTraining: boolean;
  requireFieldInterest: boolean;
};

const DEFAULT: Config = {
  validCountries: [],
  defaultAgeMin: 18,
  defaultAgeMax: 35,
  countryAgeOverrides: {},
  requireVocationalTraining: true,
  requireFieldInterest: true,
};

export function EligibilityForm() {
  const [config, setConfig] = useState<Config>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countryInput, setCountryInput] = useState("");
  const [overrideCountry, setOverrideCountry] = useState("");
  const [overrideMin, setOverrideMin] = useState("18");
  const [overrideMax, setOverrideMax] = useState("30");

  useEffect(() => {
    fetch("/api/admin/eligibility")
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setConfig({
            validCountries: typeof d.validCountries === "string" ? JSON.parse(d.validCountries) : (d.validCountries ?? []),
            defaultAgeMin: d.defaultAgeMin ?? 18,
            defaultAgeMax: d.defaultAgeMax ?? 35,
            countryAgeOverrides: typeof d.countryAgeOverrides === "string" ? JSON.parse(d.countryAgeOverrides) : (d.countryAgeOverrides ?? {}),
            requireVocationalTraining: !!d.requireVocationalTraining,
            requireFieldInterest: !!d.requireFieldInterest,
          });
        }
        setLoading(false);
      });
  }, []);

  function addCountry() {
    const val = countryInput.trim().toUpperCase();
    if (!val || config.validCountries.includes(val)) { setCountryInput(""); return; }
    setConfig((c) => ({ ...c, validCountries: [...c.validCountries, val] }));
    setCountryInput("");
  }

  function removeCountry(code: string) {
    setConfig((c) => ({
      ...c,
      validCountries: c.validCountries.filter((x) => x !== code),
      countryAgeOverrides: Object.fromEntries(Object.entries(c.countryAgeOverrides).filter(([k]) => k !== code)),
    }));
  }

  function addOverride() {
    const code = overrideCountry.trim().toUpperCase();
    if (!code) return;
    setConfig((c) => ({ ...c, countryAgeOverrides: { ...c.countryAgeOverrides, [code]: { min: parseInt(overrideMin) || 18, max: parseInt(overrideMax) || 30 } } }));
    setOverrideCountry("");
  }

  function removeOverride(code: string) {
    setConfig((c) => {
      const { [code]: _, ...rest } = c.countryAgeOverrides;
      return { ...c, countryAgeOverrides: rest };
    });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/eligibility", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Toggles */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Gates</h2>
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" checked={config.requireVocationalTraining}
            onChange={(e) => setConfig((c) => ({ ...c, requireVocationalTraining: e.target.checked }))}
            className="accent-[#3c3489] w-4 h-4" />
          Require vocational training
        </label>
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" checked={config.requireFieldInterest}
            onChange={(e) => setConfig((c) => ({ ...c, requireFieldInterest: e.target.checked }))}
            className="accent-[#3c3489] w-4 h-4" />
          Require field interest
        </label>
      </div>

      {/* Default age range */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Default Age Range</h2>
        <div className="flex gap-4 items-center">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Min age</span>
            <input type="number" value={config.defaultAgeMin} onChange={(e) => setConfig((c) => ({ ...c, defaultAgeMin: parseInt(e.target.value) || 18 }))}
              className="w-20 h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Max age</span>
            <input type="number" value={config.defaultAgeMax} onChange={(e) => setConfig((c) => ({ ...c, defaultAgeMax: parseInt(e.target.value) || 35 }))}
              className="w-20 h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          </label>
        </div>
      </div>

      {/* Valid countries */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Valid Countries</h2>
        <div className="flex gap-2">
          <input placeholder="Country code (e.g. AU)" value={countryInput} onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCountry(); } }}
            className="flex-1 h-9 px-3 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          <button onClick={addCountry} className="px-3 h-9 rounded-md border border-[#e5e5e5] text-sm hover:bg-[#fafaf9]">Add</button>
        </div>
        {config.validCountries.length === 0 && <p className="text-xs text-[#5c5c5c]">No countries added (all rejected)</p>}
        <div className="flex flex-wrap gap-2">
          {config.validCountries.map((code) => (
            <span key={code} className="flex items-center gap-1 px-2 py-0.5 bg-[#f0effe] text-[#3c3489] rounded text-xs font-mono">
              {code}
              <button onClick={() => removeCountry(code)} className="hover:text-[#a32d2d] leading-none ml-1">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Country age overrides */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Country Age Overrides</h2>
        <div className="flex gap-2 items-end">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Country</span>
            <input placeholder="AU" value={overrideCountry} onChange={(e) => setOverrideCountry(e.target.value.toUpperCase())}
              className="w-20 h-9 px-3 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Min</span>
            <input type="number" value={overrideMin} onChange={(e) => setOverrideMin(e.target.value)}
              className="w-16 h-9 px-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Max</span>
            <input type="number" value={overrideMax} onChange={(e) => setOverrideMax(e.target.value)}
              className="w-16 h-9 px-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none" />
          </label>
          <button onClick={addOverride} className="h-9 px-3 rounded-md border border-[#e5e5e5] text-sm hover:bg-[#fafaf9]">Add override</button>
        </div>
        {Object.entries(config.countryAgeOverrides).length === 0 && <p className="text-xs text-[#5c5c5c]">No overrides</p>}
        <div className="space-y-2">
          {Object.entries(config.countryAgeOverrides).map(([code, range]) => (
            <div key={code} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs bg-[#f0effe] text-[#3c3489] px-2 py-0.5 rounded w-12 text-center">{code}</span>
              <span className="text-[#5c5c5c] text-xs">Age {range.min}–{range.max}</span>
              <button onClick={() => removeOverride(code)} className="text-xs text-[#a32d2d] hover:underline">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-[#fafaf9] border border-[#e5e5e5] rounded-lg p-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-2">Preview</h2>
        <p className="text-xs text-[#5c5c5c]">
          Default age: {config.defaultAgeMin}–{config.defaultAgeMax} ·
          Countries: {config.validCountries.length || "none"} ·
          Overrides: {Object.keys(config.countryAgeOverrides).length} ·
          Training required: {config.requireVocationalTraining ? "Yes" : "No"} ·
          Field interest required: {config.requireFieldInterest ? "Yes" : "No"}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        {saved && <span className="text-sm text-[#0f6e56] self-center">Saved!</span>}
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] transition-colors disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
