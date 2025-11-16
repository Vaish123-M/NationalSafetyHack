const path = require('path');
const cfgPath = path.resolve(__dirname, '..', 'postcss.config.js');
console.log('postcss config path:', cfgPath);
try {
  const cfg = require(cfgPath);
  console.log('postcss config export:');
  console.log(cfg);
  if (cfg && cfg.plugins) {
    console.log('plugins details:');
    cfg.plugins.forEach((p, idx) => {
      try {
        console.log(idx, 'type:', typeof p);
        if (typeof p === 'function') {
          console.log('  name:', p.name || '(anonymous)');
          console.log('  postcss prop:', p.postcss);
          console.log('  toString snippet:', p.toString().slice(0, 200));
        } else if (Array.isArray(p)) {
          console.log('  array plugin:', p[0] && (p[0].name || p[0]));
        } else {
          console.log('  plugin value:', p);
        }
      } catch (e) {
        console.error('  error inspecting plugin', e && e.message);
      }
    });
  }
} catch (e) {
  console.error('error requiring postcss config:', e && e.message);
  console.error(e);
}
