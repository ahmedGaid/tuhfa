# Contract: Progress storage and export code

- Key: `tuhfa:v1` in `localStorage`. Shape: `Progress` in [data-model.md](../data-model.md).
- `load()`: parse → zod-validate → migrate to current version → return. Corrupt JSON → keep a copy at
  `tuhfa:corrupt:<ts>`, start fresh, show a one-time notice.
- `save()`: debounced 300 ms; on `QuotaExceeded`/`SecurityError` switch to in-memory mode and show
  «التقدّم مش هيتحفظ على الجهاز ده».
- Export code: `TUHFA1.` + base64url(UTF-8 JSON of Progress) + `.` + 4-char FNV-1a checksum (base36).
- Import: reject (no state change) on wrong prefix, checksum mismatch, schema failure, or future
  version; on success replace state wholesale after a confirm dialog.
