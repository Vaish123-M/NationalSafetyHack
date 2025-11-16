const postcss = require('postcss');
const path = require('path');
const fs = require('fs');
const cfg = require(path.resolve(__dirname, '..', 'postcss.config.js'));
const cssPath = path.resolve(__dirname, '..', 'src', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');
// normalize plugins: PostCSS config may export an object (name->plugin) or an array
let plugins = cfg && cfg.plugins;
if (!plugins) plugins = [];
if (!Array.isArray(plugins) && typeof plugins === 'object') {
  plugins = Object.keys(plugins).map(k => plugins[k]);
}

console.log('Using plugins from config:');
console.log(plugins.map(p => (typeof p === 'function' ? (p.name || '<fn>') : String(p))));

postcss(plugins)
  .process(css, { from: cssPath })
  .then(result => {
    console.log('Processed CSS OK');
    // write generated CSS to src/tailwind.generated.css
    const outPath = path.resolve(__dirname, '..', 'src', 'tailwind.generated.css');
    fs.writeFileSync(outPath, result.css, 'utf8');
    console.log('Wrote generated CSS to', outPath);
  })
  .catch(err => {
    console.error('PostCSS processing failed:');
    console.error(err && err.stack ? err.stack : err);
  });
