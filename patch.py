import os
import re

proj_dir = r'c:\Users\Work Station\Desktop\KA Copy\KA  Project\KAnew\Karem-Project'
dl_dir = r'C:\Users\Work Station\Downloads\meniscus-liquid-nav-main\meniscus-liquid-nav-main'

# 1. Update index.html
html_path = os.path.join(proj_dir, 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Tab 1
html = re.sub(r'(<button class="tab"[^>]*id="tab-home"[^>]*style="--acc:)[^"]*(".*?</svg>)', 
              r'\1#c9f24a" onclick="spaGo(\'home\');return false;">\n        <svg class="tab__icon" viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M3.5 10.6 12 3.9l8.5 6.7" />\n          <path d="M5.7 9.2v9.1a1.6 1.6 0 0 0 1.6 1.6h9.4a1.6 1.6 0 0 0 1.6-1.6V9.2" />\n          <path d="M9.9 19.9v-4.8a1.2 1.2 0 0 1 1.2-1.2h1.8a1.2 1.2 0 0 1 1.2 1.2v4.8" />\n        </svg>', 
              html, flags=re.DOTALL)

# Replace Tab 2
html = re.sub(r'(<button class="tab"[^>]*id="tab-about"[^>]*style="--acc:)[^"]*(".*?</svg>)',
              r'\1#ffd23f" onclick="spaGo(\'about\');return false;">\n        <svg class="tab__icon" viewBox="0 0 24 24" aria-hidden="true">\n          <circle cx="12" cy="8.5" r="3.7" />\n          <path d="M4.9 20.1a7.35 7.35 0 0 1 14.2 0" />\n        </svg>',
              html, flags=re.DOTALL)

# Replace Tab 3
html = re.sub(r'(<button class="tab"[^>]*id="tab-services"[^>]*style="--acc:)[^"]*(".*?</svg>)',
              r'\1#ffa02e" onclick="spaGo(\'services\');return false;">\n        <svg class="tab__icon" viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M20.3 11.9a7.7 7.7 0 0 1-11.1 6.9l-5 1.4 1.4-4.7A7.7 7.7 0 1 1 20.3 11.9Z" />\n        </svg>',
              html, flags=re.DOTALL)

# Replace Tab 4
html = re.sub(r'(<button class="tab"[^>]*id="tab-training"[^>]*style="--acc:)[^"]*(".*?</svg>)',
              r'\1#ff6a45" onclick="spaGo(\'training\');return false;">\n        <svg class="tab__icon" viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M4.7 8.5h2.8l1.4-2.3h6.2l1.4 2.3h2.8a1.7 1.7 0 0 1 1.7 1.7v7.5a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 18.2v-7.5a1.7 1.7 0 0 1 1.7-1.7Z" />\n          <circle cx="12" cy="13.9" r="3.3" />\n        </svg>',
              html, flags=re.DOTALL)

# Replace Tab 5
html = re.sub(r'(<button class="tab"[^>]*id="tab-contact"[^>]*style="--acc:)[^"]*(".*?</svg>)',
              r'\1#ff4d7d" onclick="spaGo(\'contact\');return false;">\n        <svg class="tab__icon" viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M3.6 7.9h4.1M12.4 7.9h8" />\n          <circle cx="10.1" cy="7.9" r="2.3" />\n          <path d="M3.6 16.1h7.5M15.4 16.1h5" />\n          <circle cx="13.2" cy="16.1" r="2.3" />\n        </svg>',
              html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


print("HTML updated.")
