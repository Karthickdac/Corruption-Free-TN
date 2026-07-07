---
name: pdfkit ESM/CJS interop
description: How to import pdfkit in the ESM api-server without "not a constructor" error
---

`api-server` uses `"type": "module"` (ESM). pdfkit is CommonJS.

`(await import("pdfkit")).default` fails at runtime with `TypeError: PDFDocument is not a constructor`.

**Fix:** use `createRequire` from Node built-in "module":

```ts
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// in handler:
const PDFDocument: any = _require("pdfkit");
```

**Why:** ESM dynamic import of CJS doesn't always expose the constructor as `.default`; `createRequire` bypasses this by using the CJS require machinery directly.

**How to apply:** Any time a CJS module is needed in the ESM api-server and dynamic import fails, switch to `createRequire`.
