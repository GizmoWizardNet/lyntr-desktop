# Lyntr Desktop

## shit listed here, need to add, and some stuff else as well

1. Add CORS headers (see above) to the `lyntr` web repo
2. Add `GET /api/profile/:handle` to the web repo for the full public profile
3. Add a lightweight "list scrollables" JSON endpoint for the scrollables MinIO bucket [maybe??]
4. Build out forum thread detail (post list, reply composer, voting) against the wired
   `getForumThread()` client function << this is the difficult bitch
5. Persist window size/position/maximized state via `@tauri-apps/plugin-store` small QoL
6. Wire `src/lib/native.ts`'s `sendNativeNotification` to fire on incoming `notification`/`dm_message`
   WebSocket events, and call the Rust `set_unread_summary` command whenever the `unread` store
   changes so the tray/taskbar badge stay in sync(very difficult ig)
7. macOS/Linux bundle targets once Windows ships. (least important)
