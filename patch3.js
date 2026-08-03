const fs = require('fs');
const path = require('path');

const proj_dir = 'c:\\Users\\Work Station\\Desktop\\KA Copy\\KA  Project\\KAnew\\Karem-Project';
const dl_dir = 'C:\\Users\\Work Station\\Downloads\\meniscus-liquid-nav-main\\meniscus-liquid-nav-main';

const proj_css = path.join(proj_dir, 'style.css');
const dl_css = path.join(dl_dir, 'style.css');

let css = fs.readFileSync(proj_css, 'utf8');
const d_css = fs.readFileSync(dl_css, 'utf8');

const dockRegex = /\/\*\s*={10,}\s*The dock\s*={10,}\s*\*\/(.*?)\/\*\s*---\s*hint/s;
const d_match = d_css.match(dockRegex);

if (d_match) {
  const dock_css = d_match[0].replace(/\/\*\s*---\s*hint/, ''); // remove the hint marker
  
  const projRegex = /\/\*\s*={10,}\s*The dock\s*={10,}\s*\*\/(.*?)\/\*\s*Nav actions container/s;
  if (projRegex.test(css)) {
    css = css.replace(projRegex, dock_css + '\n/* Nav actions container');
    fs.writeFileSync(proj_css, css, 'utf8');
    console.log("CSS updated.");
  } else {
    console.log("Could not find dock CSS in project file.");
  }
} else {
  console.log("Could not find dock CSS in downloaded file.");
}
