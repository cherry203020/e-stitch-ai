# Design catalog images

Product images are stored in `backend/uploads/designs/` and used by the seed:

| Product              | Filename                    |
|----------------------|-----------------------------|
| Classic Round Neck   | `classic-round-neck.png`    |
| Heavy Zardozi Bridal | `heavy-zardozi-bridal.png` |
| Keyhole Back         | `keyhole-back.png`         |
| Kundan Bridal        | `kundan-bridal.png`        |
| V-Neck Party         | `v-neck-party.png`         |
| Mirror Work Lehenga  | `mirror-work-lehenga.png`  |
| Thread Embroidery   | `thread-embroidery.png`    |

To replace or add an image:

1. Put the image in `backend/uploads/designs/` with the filename above (or add a new row in `seed_data.py` and use the same path pattern).
2. Re-run the seed:
   ```bash
   cd backend
   python seed_data.py
   ```

The design will then show your image in the Designs catalog and 3D Preview.
