import type { AstroIntegration } from 'astro';

type Options = {
  cloudflareToken?: string;
  clarityId?: string;
  onlyInProd?: boolean;
};

export default function analytics(opts: Options = {}): AstroIntegration {
  const onlyInProd = opts.onlyInProd ?? true;
  const isProd = process.env.NODE_ENV === 'production';

  return {
    name: 'analytics-injector',
    hooks: {
      'astro:config:setup': ({ injectScript, logger }) => {
        if (onlyInProd && !isProd) return;

        // Cloudflare Web Analytics (loads the beacon with your token)
        if (opts.cloudflareToken) {
          injectScript('head-inline', `
            (function(){
              var s=document.createElement('script');
              s.defer=true;
              s.src='https://static.cloudflareinsights.com/beacon.min.js';
              s.setAttribute('data-cf-beacon', JSON.stringify({token:'${opts.cloudflareToken}'}));
              document.head.appendChild(s);
            })();
          `);
        }

        // Microsoft Clarity (official snippet)
        if (opts.clarityId) {
          injectScript('head-inline', `
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/${opts.clarityId}";
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${opts.clarityId}");
          `);
        }

        if (!opts.cloudflareToken && !opts.clarityId) {
          logger.info('[analytics-injector] No tokens provided; nothing injected.');
        }
      },
    },
  };
}
