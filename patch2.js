const fs = require('fs');
const path = require('path');

const proj_dir = 'c:\\Users\\Work Station\\Desktop\\KA Copy\\KA  Project\\KAnew\\Karem-Project';
const dl_dir = 'C:\\Users\\Work Station\\Downloads\\meniscus-liquid-nav-main\\meniscus-liquid-nav-main';

// Update style.css
const proj_css = path.join(proj_dir, 'style.css');
const dl_css = path.join(dl_dir, 'style.css');

let css = fs.readFileSync(proj_css, 'utf8');
const d_css = fs.readFileSync(dl_css, 'utf8');

const start_marker = "/* ==========================================================================\\n   The dock";
const end_marker = "/* --- hint --------------------------------------------------------------- */";

const d_start = d_css.indexOf(start_marker);
const d_end = d_css.indexOf(end_marker);
if (d_start !== -1 && d_end !== -1) {
  const dock_css = d_css.substring(d_start, d_end);
  const p_start = css.indexOf(start_marker);
  const p_end = css.indexOf("/* Nav actions container */");
  
  if (p_start !== -1 && p_end !== -1) {
    css = css.substring(0, p_start) + dock_css + css.substring(p_end);
    fs.writeFileSync(proj_css, css, 'utf8');
    console.log("CSS updated.");
  } else {
    console.log("Could not find dock CSS in project file.");
  }
} else {
  console.log("Could not find dock CSS in downloaded file.");
}
