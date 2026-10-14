#!/usr/bin/env python3
"""Genera un único HTML autocontenido (dist/kazehana-single.html) a partir de index.html + css + js.
Uso:  python3 tools/build.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css' / 'style.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="css/style.css">', lambda m: '<style>\n' + css + '\n</style>', html)
def inline(m):
    src = (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n' + src + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'kazehana-single.html').write_text(html, encoding='utf-8')
print('OK ->', out / 'kazehana-single.html', len(html) // 1024, 'KB')
