Drop generated icons here.

Fastest path: install the Tauri CLI (already a devDependency) and run, from
the project root, against a 1024x1024 square PNG of the Lyntr logo:

    npx tauri icon path/to/lyntr-logo-1024.png

That generates every size this config references (32x32.png, 128x128.png,
128x128@2x.png, icon.icns, icon.ico, plus Android/iOS variants you can
ignore for now) directly into src-tauri/icons/.
