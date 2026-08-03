import os
import re

proj_dir = r'c:\Users\Work Station\Desktop\KA Copy\KA  Project\KAnew\Karem-Project'
dl_dir = r'C:\Users\Work Station\Downloads\meniscus-liquid-nav-main\meniscus-liquid-nav-main'

# Update style.css
proj_css = os.path.join(proj_dir, 'style.css')
dl_css = os.path.join(dl_dir, 'style.css')

with open(proj_css, 'r', encoding='utf-8') as f:
    css = f.read()

with open(dl_css, 'r', encoding='utf-8') as f:
    d_css = f.read()

# Extract the dock section from downloaded CSS
# It starts at /* ==========================================================================
#    The dock
#    ========================================================================== */
# And goes until /* --- hint --- */ or end of file. We just need to find it.
start_marker = "/* ==========================================================================\n   The dock"
end_marker = "/* --- hint --------------------------------------------------------------- */"

d_start = d_css.find(start_marker)
d_end = d_css.find(end_marker)
if d_start != -1 and d_end != -1:
    dock_css = d_css[d_start:d_end]
else:
    print("Could not find dock CSS in downloaded file.")
    exit(1)

# Now find the dock section in the project CSS and replace it
# Project CSS has a similar section
p_start = css.find(start_marker)
# Find where the dock section ends in project CSS. It's followed by /* Nav actions container */
p_end = css.find("/* Nav actions container */")

if p_start != -1 and p_end != -1:
    css = css[:p_start] + dock_css + css[p_end:]
    with open(proj_css, 'w', encoding='utf-8') as f:
        f.write(css)
    print("CSS updated.")
else:
    print("Could not find dock CSS in project file.")

# Update script.js
proj_js = os.path.join(proj_dir, 'script.js')
dl_js = os.path.join(dl_dir, 'app.js')

with open(proj_js, 'r', encoding='utf-8') as f:
    js = f.read()

with open(dl_js, 'r', encoding='utf-8') as f:
    d_js = f.read()

# Extract the dock logic from downloaded app.js
# The downloaded app.js has a bunch of constants at the top. We'll extract everything up to /* --- drag the bead --- */ or oot.
# Wait, the user's script.js has the meniscus logic wrapped in a function or just global?
# Let's check how the user's script.js has it.
