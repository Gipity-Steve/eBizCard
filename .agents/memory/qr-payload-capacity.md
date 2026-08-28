---
name: QR payload capacity
description: Preventing silently truncated or unreadable QR contact cards
---

QR encoders must calculate capacity from the actual payload instead of assuming a fixed version and block size.

**Why:** A visually complete QR can still be unreadable when a fixed-capacity implementation silently drops bytes from a vCard.

**How to apply:** Use a maintained encoder or explicitly validate that the complete UTF-8 payload fits before rendering. Decode-test the generated matrix when changing contact fields.