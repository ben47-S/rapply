self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Rapply", body: "" };
  event.waitUntil(
    self.registration.showNotification(data.title || "Rapply", {
      body: data.body || "",
      icon: "/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        return clients.openWindow("/");
      })
  );
});
