'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { systemSettingsApi, SystemSetting } from '@/utils/api';

interface SettingCtx {
  setting: SystemSetting | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SettingCtx>({ setting: null, refresh: async () => {} });

export function SettingProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = useState<SystemSetting | null>(null);

  const refresh = async () => {
    try {
      const data = await systemSettingsApi.get();
      setSetting(data);
      if (data.faviconUrl) {
        const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
        if (link) link.href = data.faviconUrl;
      }
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  return <Ctx.Provider value={{ setting, refresh }}>{children}</Ctx.Provider>;
}

export const useSetting = () => useContext(Ctx);
