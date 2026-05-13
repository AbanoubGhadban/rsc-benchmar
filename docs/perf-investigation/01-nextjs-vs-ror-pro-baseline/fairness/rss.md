## Peak RSS during conn=50 / 20s autocannon at S=6

All values in **MB** (RSS).

| Subject | Idle (mean) | Under-load (mean) | Under-load (peak) | Cool-down (mean) | Δ peak − idle |
|---|---:|---:|---:|---:|---:|
| nextjs | 164.6 | 242.4 | 278.5 | 265.9 | 114.0 |
| ror-pro | 361.3 | 364.2 | 370.2 | 367.5 | 8.8 |

### Composition (final snapshot, MB)

- **Next.js**: parent 59.0 MB + child workers 1.7, 204.7 MB
- **ROR Pro**: Rails(Puma) 192.0 MB + node-renderer 56.5 MB + node-renderer workers 119.1 MB