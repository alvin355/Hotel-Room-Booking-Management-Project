# Hotel Room Booking

A simple hotel room booking app. Guests can browse rooms, register, save rooms, and book stays. An admin can add, edit, and delete rooms.

The frontend is React (Vite). The backend is Express with the native MongoDB driver.

## Required environment

- **Node.js** 18 or later (LTS)
- **npm** (comes with Node.js)
- **MongoDB** running locally, or a MongoDB Atlas connection string

## Project structure

```
hotel-booking/
├── server/          # Express API + native MongoDB driver
│   ├── index.js
│   ├── db.js
│   ├── seed.js
│   ├── .env.example
│   └── routes/
├── client/          # React + Vite frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## How to run the entire app

1. Install **Node.js 18+**.

2. Start **MongoDB**. The API stores users, rooms, bookings, and bookmarks in MongoDB, so this must be running first.

   **MongoDB Atlas (free cloud database)**

   Use this if you do not want to install MongoDB locally. Atlas hosts the database on the internet. Your app on your computer still talks to it through the URI in `.env`.

   1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account (or log in).
   2. Create a project if Atlas asks for one, then click **Create** / **Build a Database**.
   3. Choose the **M0 Free** cluster. Pick a cloud provider and a region close to you, then create the cluster. Wait until it finishes (usually a minute or two).
   4. **Database user:** Atlas will ask you to create a username and password for the database (this is not your Atlas login). Save the password. Avoid special characters like `@`, `#`, or `/` in the password, or you will have to URL-encode them in the URI.
   5. **Network access:** add your current IP so your computer is allowed to connect. For local homework/testing you can click **Allow Access from Anywhere**, which uses `0.0.0.0/0`.
   6. On the cluster, click **Connect** → **Drivers**. Choose **Node.js**. Copy the connection string. It looks like:

      ```
      mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
      ```

   7. Edit that string:
      - Replace `<password>` with the database user password from step 4.
      - Put `/hotel-booking` before the `?` so the app uses that database name, for example:

      ```
      mongodb+srv://myUser:myPassword@cluster0.xxxxx.mongodb.net/hotel-booking?retryWrites=true&w=majority
      ```

   8. In `hotel-booking/server`, copy `.env.example` to `.env` if you have not already, then set:

      ```
      MONGODB_URI=mongodb+srv://myUser:myPassword@cluster0.xxxxx.mongodb.net/hotel-booking?retryWrites=true&w=majority
      ```

   Keep the rest of `.env` (`PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) as they are.

   If `npm run dev` prints **Server selection timed out after 30000 ms**, the URI is fine but Atlas is refusing the connection. Fix it in Atlas:

   1. Open your cluster → **Network Access**.
   2. Click **Add IP Address**.
   3. For local testing, click **Allow Access from Anywhere** (`0.0.0.0/0`) and confirm.
   4. Wait about a minute, then run `npm run dev` again.

   Also check: the cluster is not paused (click **Resume** if Atlas shows that), and you are not on a VPN that blocks outbound MongoDB.

3. Start the API (terminal 1):

   ```bash
   cd hotel-booking/server
   cp .env.example .env
   npm install
   npm run dev
   ```

   The API is at [http://localhost:5001](http://localhost:5001).
   Open [http://localhost:5001/api/health](http://localhost:5001/api/health) — it should return `{ "ok": true, "db": "connected" }`.

   On macOS, port 5000 is often already used by **AirPlay Receiver** (Control Center). This project uses **5001** so it does not clash. If you still see `EADDRINUSE`, change `PORT` in `server/.env` to another free port and match it in `client/vite.config.js`.

   On first start, the server creates:
   - an admin user from `server/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
   - three sample rooms if the rooms collection is empty

   Change admin values in `.env` **before** the first start if you want different credentials.

4. Start the React client (terminal 2):

   ```bash
   cd hotel-booking/client
   npm install
   npm run dev
   ```

5. Open the app at [http://localhost:5173](http://localhost:5173).
   Keep both terminals running. The Vite proxy sends `/api` to port 5001.

6. Log in:
   - **Admin:** `admin@hotel.com` / `admin123` → goes to `/admin` to manage rooms
   - **Customer:** register at `/register`, then log in at `/login`

7. Try the flow:
   - Home (`/`) is public: rooms, price sort, date availability
   - Room details (`/rooms/:id`) is public
   - Book and Save require login; guests are sent to `/login` first
   - Customers book at `/book` (success popup) and see saved rooms at `/bookmarks`
   - Admins manage rooms at `/admin` (no customer management)
