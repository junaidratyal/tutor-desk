
  // Browser notification helper
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendNotification(title: string, body: string, url: string = "/dashboard") {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "tutor-desk",
    data: { url }
  });
}

// Schedule daily fee reminder check
export function scheduleFeeReminders(students: any[], payments: any[]) {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const unpaid = students.filter(s => {
    const pay = payments.find((p: any) => p.student_id === s.id);
    return !pay || pay.status !== "paid";
  });

  if (unpaid.length > 0) {
    sendNotification(
      "💰 Fee Reminder",
      `${unpaid.length} student(s) ki fees pending hain — ${unpaid.map((s: any) => s.name).join(", ")}`,
      "/dashboard/fees"
    );
  }
}

export function sessionReminder(studentName: string, time: string) {
  sendNotification(
    "📅 Session Reminder",
    `${studentName} ka session ${time} pe hai!`,
    "/dashboard/schedule"
  );
}
