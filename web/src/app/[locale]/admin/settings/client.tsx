"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsData {
  imageMaxTotal: number;
  imageMaxPerUser: number;
  imageMaxPerOwner: number;
  defaultPoolMax: number;
}

export function AdminSettingsClient({
  initial,
}: {
  initial: SettingsData;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { updateAppSettings } = await import(
        "@/actions/settings.actions"
      );
      const result = await updateAppSettings(values);
      if (result.success) {
        setMessage({ type: "success", text: "Settings saved." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    }
    setSaving(false);
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Image Limits</h2>

        <label className="block">
          <span className="text-sm font-medium">Max images per entity</span>
          <span className="text-xs text-gray-500 ml-2">
            (total approved images per roaster/cafe page)
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={values.imageMaxTotal}
            onChange={(e) =>
              setValues({ ...values, imageMaxTotal: Number(e.target.value) })
            }
            className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Max images per user</span>
          <span className="text-xs text-gray-500 ml-2">
            (per entity, for regular visitors)
          </span>
          <input
            type="number"
            min={1}
            max={10}
            value={values.imageMaxPerUser}
            onChange={(e) =>
              setValues({ ...values, imageMaxPerUser: Number(e.target.value) })
            }
            className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Max images per owner</span>
          <span className="text-xs text-gray-500 ml-2">
            (per entity, for the owner of the roaster/cafe)
          </span>
          <input
            type="number"
            min={1}
            max={20}
            value={values.imageMaxPerOwner}
            onChange={(e) =>
              setValues({
                ...values,
                imageMaxPerOwner: Number(e.target.value),
              })
            }
            className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Default pool max</span>
          <span className="text-xs text-gray-500 ml-2">
            (max default images per entity type)
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={values.defaultPoolMax}
            onChange={(e) =>
              setValues({ ...values, defaultPoolMax: Number(e.target.value) })
            }
            className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </main>
  );
}
