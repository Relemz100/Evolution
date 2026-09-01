# Daily Quest - Android

این پروژه از قبل برای GitHub Actions آماده شده است.

## آپلود در GitHub
محتویات همین پوشه را مستقیماً در ریشه Repository آپلود کنید؛
یعنی `package.json` و `index.html` باید مستقیماً در صفحه اصلی Repository دیده شوند.
پوشه `.github` را هم حتماً آپلود کنید.

## ساخت APK
بعد از Commit:
1. Actions
2. Build Daily Quest APK
3. Run workflow
4. بعد از سبز شدن، از Artifacts فایل `Daily-Quest-APK` را بگیرید.
5. داخل ZIP فایل `app-debug.apk` است.

نکته: اگر با آپلود موبایل پوشه `.github` دیده نشد، می‌توانید فایل workflow را دستی در مسیر `.github/workflows/build-apk.yml` بسازید.
