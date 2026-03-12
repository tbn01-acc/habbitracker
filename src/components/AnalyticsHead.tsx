import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dynamically injects Yandex Metrika counter script and
 * Yandex Webmaster verification meta tag into <head>.
 * Reads values from app_settings once on mount.
 */
export function AnalyticsHead() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;

    const inject = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'analytics_codes')
          .single();

        if (!data?.setting_value) return;

        const value = data.setting_value as any;
        const metrikaId = value.yandex_metrika_id?.trim();
        const webmasterCode = value.yandex_webmaster_verification?.trim();

        // Yandex Webmaster verification meta tag
        if (webmasterCode) {
          const existing = document.querySelector('meta[name="yandex-verification"]');
          if (!existing) {
            const meta = document.createElement('meta');
            meta.name = 'yandex-verification';
            meta.content = webmasterCode;
            document.head.appendChild(meta);
          }
        }

        // Yandex Metrika counter script
        if (metrikaId && /^\d+$/.test(metrikaId)) {
          const existingScript = document.getElementById('ym-script');
          if (!existingScript) {
            // Inline init
            const initScript = document.createElement('script');
            initScript.id = 'ym-script';
            initScript.textContent = `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
              ym(${metrikaId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true,trackHash:true});
            `;
            document.head.appendChild(initScript);

            // noscript fallback
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.src = `https://mc.yandex.ru/watch/${metrikaId}`;
            img.style.cssText = 'position:absolute;left:-9999px;';
            img.alt = '';
            noscript.appendChild(img);
            document.body.appendChild(noscript);
          }
        }
      } catch (err) {
        console.error('Analytics injection error:', err);
      } finally {
        setLoaded(true);
      }
    };

    inject();
  }, [loaded]);

  return null;
}
